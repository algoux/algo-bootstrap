import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { isMac, isWindows } from '@/utils/platform';
import { spawn, execFile } from '@/utils/child-process';
import {
  isEnvInstalled,
  isVsixesInstalled,
  getEnvironment,
  getWindowsUserPath,
  getWindowsSystemPath,
  getEnvironments,
} from './env-checker';
import { extractAll, getTopDirName, getUncompressedSize } from '@/utils/extract';
import { app } from 'electron';
import { escapeRegExp } from 'common/utils/regexp';
import { logMain } from '@/utils/logger';
import getFolderSize from 'get-folder-size';
import { TerminalManager } from '@/utils/terminal';
import { v4 as uuidv4 } from 'uuid';
import { getPath } from '@/utils/path';
import { PathKey } from 'common/configs/paths';

const RESOURCES_DOWNLOAD_PATH = getPath(PathKey.resourcesDownload);
const RESOURCES_TEMP_PATH = getPath(PathKey.resourcesTemp);
const USERLIB_SRC_PATH = getPath(PathKey.staticUserlibSrc);
const USERLIB_PATH = path.join(os.homedir(), '.algo-bootstrap');

export async function appendToWindowsUserPath(PATH: string) {
  logMain.info('[appendToWindowsUserPath] PATH to append:', PATH);
  const userPath = (await getWindowsUserPath()) ?? '%PATH%';
  // TODO 防止重复添加 path。已添加则返回 false
  await spawn('[appendToWindowsUserPath]', 'setx', [
    'PATH',
    `"${userPath}${!userPath || userPath.endsWith(';') ? '' : ';'}${PATH}"`,
  ]);
  return true;
}

export async function refreshWindowsPath() {
  if (!isWindows) {
    return;
  }
  const systemPath = await getWindowsSystemPath();
  const userPath = await getWindowsUserPath();
  if (systemPath === null || userPath === null) {
    // 目前仅在 gcc、python、cpplint、vscode 安装完毕后用到刷新 PATH
    // 而环境一旦安装成功，user PATH 一定不为空，且 system PATH 始终不为空
    // 因此若有 system/user PATH 获取失败，要么是 reg 命令挂掉，要么是确实没有 PATH 这个环境变量。后者已经在上文分析，可排除
    // 这种情况可认为是意外导致 reg 挂掉，为防止刷新环境错误，这里抛错且不更新 PATH
    // TODO 考虑部分环境用户已配置在系统变量的情况
    logMain.error('[refreshWindowsPath] system or user path is null');
    throw Error('system or user path is null');
  }
  const newPath = [
    ...systemPath.split(';').filter((p) => !!p),
    ...userPath.split(';').filter((p) => !!p),
  ].join(';');
  // 将 PATH 中的变量替换为实际值
  let parsedPath = newPath.replace(/%(\S)+?%/g, (match) => match.toUpperCase());
  for (const key of Object.keys(process.env)) {
    parsedPath = parsedPath.replace(
      new RegExp(`%${escapeRegExp(key.toUpperCase())}%`, 'g'),
      process.env[key]!,
    );
  }
  logMain.info('[refreshWindowsPath]', parsedPath);
  process.env.PATH = parsedPath;
}

export async function installXCodeCLT() {
  if (isMac) {
    await spawn('[installXcodeCLT]', 'xcode-select', ['--install']);
  }
}

export async function getMingwTotalSize(filename: string): Promise<number> {
  try {
    return await getUncompressedSize(path.join(RESOURCES_DOWNLOAD_PATH, filename));
  } catch (e) {
    logMain.error('[getMingwTotalSize.error]', filename, e);
    throw e;
  }
}

export async function getMingwUncompressedSize(): Promise<number> {
  return new Promise((resolve, reject) => {
    const __start = Date.now();
    getFolderSize(getMingwInstallPath())
      .then((sizeResult) => {
        if (sizeResult.errors) {
          logMain.error(
            `[getMingwUncompressedSize.error ${Date.now() - __start + 'ms'}]`,
            sizeResult.errors,
          );
          reject(sizeResult.errors);
          return;
        }
        resolve(sizeResult.size);
      })
      .catch((err) => {
        logMain.error(`[getMingwUncompressedSize.error ${Date.now() - __start + 'ms'}]`, err);
        reject(err);
      });
  });
}

export function getWindowsGlobalInstallPath() {
  return 'C:\\algo-bootstrap';
}

export function getMingwInstallPath() {
  return path.join(getWindowsGlobalInstallPath(), 'mingw64');
}

export async function installGcc(options: { filename?: string; force?: boolean } = {}) {
  if (!options.force && (await isEnvInstalled('gcc'))) {
    return;
  }
  if (isMac) {
    await installXCodeCLT();
    await getEnvironments(true);
  } else if (isWindows) {
    if (!options.filename) {
      throw Error('gcc installer filename is required');
    }
    const filePath = path.join(RESOURCES_DOWNLOAD_PATH, options.filename);
    const topDirName = await getTopDirName(filePath);
    if (!topDirName) {
      throw Error('mingw64 zip should have top dir');
    }
    try {
      // 解压 MinGW64
      const installPath = getMingwInstallPath();
      logMain.info('[installGcc] using install path:', installPath);
      await fs.ensureDir(installPath);
      await extractAll(filePath, installPath, true);
      // 移动到上一层
      const mingwFilesPath = path.join(installPath, topDirName);
      logMain.info('[installGcc] move mingw files:', mingwFilesPath, '->', installPath);
      // await fs.move(mingwFilesPath, installPath, { overwrite: true });
      const files = await fs.readdir(mingwFilesPath);
      for (const file of files) {
        logMain.info(
          '[installGcc] move mingw top-level file/dir:',
          path.join(mingwFilesPath, file),
          '->',
          path.join(installPath, file),
        );
        await fs.move(path.join(mingwFilesPath, file), path.join(installPath, file));
      }
      await fs.remove(mingwFilesPath);
      logMain.info('[installGcc] append PATH:', `${installPath}\\bin`);
      (await appendToWindowsUserPath(`${installPath}\\bin`)) && (await refreshWindowsPath());
    } catch (e) {
      logMain.error('[installGcc] error:', e);
      throw e;
    }
    await getEnvironments(true);
  }
}

export async function installPython(options: { filename?: string; force?: boolean } = {}) {
  if (!options.force && (await isEnvInstalled('python'))) {
    return;
  }
  if (isWindows) {
    if (!options.filename) {
      throw Error('Python installer filename is required');
    }
    const filePath = path.join(RESOURCES_DOWNLOAD_PATH, options.filename);
    await execFile('[installPython]', filePath);
    await refreshWindowsPath();
    await getEnvironments(true);
  }
}

export async function installVSCode(options: { filename: string; force?: boolean }) {
  if (!options.force && (await isEnvInstalled('vscode'))) {
    return;
  }
  const filePath = path.join(RESOURCES_DOWNLOAD_PATH, options.filename);
  if (isMac) {
    switch (path.extname(filePath)) {
      case '.zip':
        const installPath = path.join('/Applications');
        // ref: https://github.com/ZJONSSON/node-unzipper/issues/160
        // process.noAsar = true;
        // await extractAll(filePath, installPath);
        await spawn('[installVSCode]', 'unzip', ['-oq', `"${filePath}"`, '-d', `"${installPath}"`]);
        break;
      default:
        throw Error('Incompatible format');
    }
    await getEnvironments(true);
  } else if (isWindows) {
    await execFile('[installVSCode]', filePath);
    await refreshWindowsPath();
    await getEnvironments(true);
  }
}

export async function installVsix(options: {
  vsixId: SupportedVSIXId;
  filename: string;
  force?: boolean;
  fetchEnvironments?: boolean;
}) {
  if (!options.force && (await isVsixesInstalled([options.vsixId]))) {
    return;
  }
  const vscode = await getEnvironment('vscode');
  if (!vscode.installed) {
    throw Error('No VS Code installed');
  }
  const filePath = path.join(RESOURCES_DOWNLOAD_PATH, options.filename);
  logMain.info('[installVsix] installing vsix:', options.vsixId, '<-', options.filename);
  await spawn('[installVsix]', `"${vscode.path || 'code'}"`, [
    '--install-extension',
    `"${filePath}"`,
  ]);
  if (options.fetchEnvironments) {
    await getEnvironments(true);
  }
}

export async function installVsixes(options: {
  vsixes: { vsixId: SupportedVSIXId; filename: string }[];
  force?: boolean;
}) {
  if (!options.force && (await isVsixesInstalled(options.vsixes.map((vsix) => vsix.vsixId)))) {
    return;
  }
  const vscode = await getEnvironment('vscode');
  if (!vscode.installed) {
    throw Error('No VS Code installed');
  }
  for (const vsix of options.vsixes) {
    const { vsixId, filename } = vsix;
    logMain.info('[installVsixes] installing vsix:', vsixId, '<-', filename);
    const filePath = path.join(RESOURCES_DOWNLOAD_PATH, filename);
    await spawn('[installVsix]', `"${vscode.path || 'code'}"`, [
      '--install-extension',
      `"${filePath}"`,
    ]);
  }
  await getEnvironments(true);
}

export async function installUserLib(options: { force?: boolean } = {}) {
  const srcPath = path.join(USERLIB_SRC_PATH);
  const targetPath = path.join(USERLIB_PATH);
  const iJsonPath = path.join(targetPath, 'i.json');
  let version: string | undefined;
  try {
    const obj = await fs.readJson(iJsonPath);
    version = obj?.version;
  } catch (error) {}
  const currentVersion = app.getVersion();
  if (!options.force && version === currentVersion) {
    return;
  }

  logMain.info('[installUserLib] install to', targetPath);
  await fs.remove(targetPath);
  await fs.copy(srcPath, targetPath, { recursive: true });
  const binPath = path.join(targetPath, 'bin');
  const binFiles = await fs.readdir(binPath);
  for (const file of binFiles) {
    const filePath = path.join(binPath, file);
    const stat = await fs.stat(filePath);
    if (stat.isFile()) {
      const newMode = stat.mode | 0o111;
      stat.mode !== newMode && (await fs.chmod(filePath, newMode));
    }
  }
  await fs.writeJson(iJsonPath, { version: currentVersion }, { spaces: 2 });
}

export async function installCppcheckFromSrc(options: {
  srcFileName: string;
  terminalId?: string;
  force?: boolean;
}) {
  if (!options.force && (await isEnvInstalled('cppcheck'))) {
    return;
  }
  if (isWindows) {
    throw Error('cppcheck installation is not supported on Windows');
  }
  await installUserLib();
  const cppcheckSrcZipPath = path.join(RESOURCES_DOWNLOAD_PATH, options.srcFileName);
  await extractAll(cppcheckSrcZipPath, RESOURCES_TEMP_PATH);
  const extractedPath = path.join(
    RESOURCES_TEMP_PATH,
    path.basename(cppcheckSrcZipPath, path.extname(cppcheckSrcZipPath)),
  );
  const depsDirPath = path.join(USERLIB_PATH, 'deps');
  await fs.ensureDir(depsDirPath);
  const targetPath = path.join(depsDirPath, 'cppcheck');
  await fs.remove(targetPath);
  await fs.move(extractedPath, targetPath);
  const tm = TerminalManager.getInstance();
  const terminal = tm.createCommandTerminal({
    id: options.terminalId || `cppcheck-${uuidv4().slice(0, 6)}`,
  });
  await terminal.exec('bash', ['tools/cppcheck-user-install.sh'], {
    cwd: USERLIB_PATH,
  });
  await getEnvironments(true);
}

export async function installCpplintV2FromSrc(options: {
  srcFileName: string;
  terminalId?: string;
  force?: boolean;
}) {
  if (!options.force && (await isEnvInstalled('cpplint'))) {
    return;
  }
  if (isWindows) {
    throw Error('cpplint v2 installation is not supported on Windows');
  }
  await installUserLib();
  const cpplintSrcZipPath = path.join(RESOURCES_DOWNLOAD_PATH, options.srcFileName);
  await extractAll(cpplintSrcZipPath, RESOURCES_TEMP_PATH);
  const extractedPath = path.join(
    RESOURCES_TEMP_PATH,
    path.basename(cpplintSrcZipPath, path.extname(cpplintSrcZipPath)),
  );
  const depsDirPath = path.join(USERLIB_PATH, 'deps');
  await fs.ensureDir(depsDirPath);
  const targetPath = path.join(depsDirPath, 'cpplint');
  await fs.remove(targetPath);
  await fs.move(extractedPath, targetPath);
  const tm = TerminalManager.getInstance();
  const terminal = tm.createCommandTerminal({
    id: options.terminalId || `cpplint-${uuidv4().slice(0, 6)}`,
  });
  await terminal.exec('bash', ['tools/cpplint-user-install.sh'], {
    cwd: USERLIB_PATH,
  });
  await getEnvironments(true);
}
