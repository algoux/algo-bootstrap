import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { isMac, isWindows } from '@/utils/platform';
import { spawn, execFile, sudoExec } from '@/utils/child-process';
import {
  isEnvInstalled,
  isVsixInstalled,
  getEnvironment,
  getWindowsUserPath,
  getWindowsSystemPath,
  getEnvironments,
} from './env-checker';
import Respack from './respack';
import { extractAll, getUncompressedSize } from '@/utils/extract';
import { app } from 'electron';
import paths from 'common/configs/paths';
import { matchOne, escapeRegExp } from 'common/utils/regexp';
import { logMain } from '@/utils/logger';
import getFolderSize from 'get-folder-size';
import { TerminalManager } from '@/utils/terminal';
import { v4 as uuidv4 } from 'uuid';

const RESPACK_PATH = path.join(app.getPath('userData'), paths.respack);
const RESPACK_TEMP_PATH = path.join(app.getPath('userData'), paths.respackTemp);
const RESOURCES_DOWNLOAD_PATH = path.join(app.getPath('userData'), paths.resourcesDownload);
const RESOURCES_TEMP_PATH = path.join(os.tmpdir(), paths.resourcesTemp);
const USERLIB_SRC_PATH = path.join(__static, paths.userlibSrc);
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

export async function getMingwTotalSize(): Promise<number> {
  const res = await Respack.readResFromLocalManifestOrThrow('c++');
  return getUncompressedSize(path.join(RESPACK_PATH, res.name));
}

export async function getMingwUncompressedSize(): Promise<number> {
  const installPath = 'C:\\MinGW64';
  return new Promise((resolve, reject) => {
    const __start = Date.now();
    getFolderSize(installPath)
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

export async function installGcc(force = false) {
  if (!force && (await isEnvInstalled('gcc'))) {
    return;
  }
  if (isMac) {
    await installXCodeCLT();
    await getEnvironments(true);
  } else if (isWindows) {
    const res = await Respack.readResFromLocalManifestOrThrow('c++');
    // 解压 MinGW64
    const installPath = 'C:\\MinGW64';
    await extractAll(path.join(RESPACK_PATH, res.name), installPath, true);
    (await appendToWindowsUserPath(`${installPath}\\bin`)) && (await refreshWindowsPath());
    await getEnvironments(true);
  }
}

export async function installPython(force = false) {
  if (!force && (await isEnvInstalled('python'))) {
    return;
  }
  if (isWindows) {
    const res = await Respack.readResFromLocalManifestOrThrow('python');
    await execFile('[installPython]', path.join(RESPACK_PATH, res.name));
    await refreshWindowsPath();
    await getEnvironments(true);
  }
}

export async function installCpplint(force = false) {
  if (!force && (await isEnvInstalled('cpplint'))) {
    return;
  }
  const py = await getEnvironment('python');
  if (!py.installed) {
    throw Error('No Python installed');
  }
  const res = await Respack.readResFromLocalManifestOrThrow('cpplint');
  switch (res.format) {
    case 'zip':
      // 解压 cpplint 项目代码包
      const filePath = path.join(RESPACK_PATH, res.name);
      const installPath = path.join(RESPACK_TEMP_PATH, 'cpplint');
      await extractAll(filePath, installPath);
      // 安装 cpplint
      // 是 Mac 且是 py2，或是 Windows 时，使用 sudo 安装
      if (isMac && matchOne(/^(\d+)/, py.version) === '2') {
        await sudoExec('[installCpplint]', `cd "${installPath}" && python setup.py install`);
      } else if (isWindows) {
        // https://github.com/jorangreef/sudo-prompt/issues/116
        const { stdout, stderr } = await sudoExec(
          '[installCpplint]',
          `cd /d "${installPath}" && python setup.py install`,
          {
            env: { PATH: process.env.PATH || '' },
          },
        );
        const pythonScriptPath = matchOne(
          /^Installing cpplint.exe script to (.*)/m,
          stdout || stderr || '',
        );
        if (pythonScriptPath) {
          (await appendToWindowsUserPath(pythonScriptPath)) && (await refreshWindowsPath());
        }
      } else {
        await spawn('[installCpplint]', 'python', ['setup.py', 'install'], {
          cwd: installPath,
        });
      }
      break;
    default:
      throw Error('Incompatible format');
  }
  await getEnvironments(true);
}

export async function installVSCode(force = false) {
  if (!force && (await isEnvInstalled('vscode'))) {
    return;
  }
  const res = await Respack.readResFromLocalManifestOrThrow('vscode');
  if (isMac) {
    switch (res.format) {
      case 'zip':
        // path.replace(/(\s+)/g, '\\$1')
        const filePath = path.join(RESPACK_PATH, res.name);
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
    await execFile('[installVSCode]', path.join(RESPACK_PATH, res.name));
    await refreshWindowsPath();
    await getEnvironments(true);
  }
}

export async function installVsix(vsixId: SupportedVSIXId, force = false) {
  if (!force && (await isVsixInstalled(vsixId))) {
    return;
  }
  const vscode = await getEnvironment('vscode');
  if (!vscode.installed) {
    throw Error('No VS Code installed');
  }
  const res = await Respack.readResFromLocalManifestOrThrow(`vsix/${vsixId}`);
  const filePath = path.join(RESPACK_PATH, res.name);
  await spawn('[installVsix]', `"${vscode.path || 'code'}"`, [
    '--install-extension',
    `"${filePath}"`,
  ]);
  await getEnvironments(true);
}

export async function installUserLib(force = false) {
  const srcPath = path.join(USERLIB_SRC_PATH);
  const targetPath = path.join(USERLIB_PATH);
  const iJsonPath = path.join(targetPath, 'i.json');
  let version: string | undefined;
  try {
    const obj = await fs.readJson(iJsonPath);
    version = obj?.version;
  } catch (error) {}
  const currentVersion = app.getVersion();
  if (!force && version === currentVersion) {
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

export async function installCppcheckFromSrc(
  srcFileName: string,
  options: { terminalId?: string; force?: boolean } = {},
) {
  if (!options.force && (await isEnvInstalled('cppcheck'))) {
    return;
  }
  if (isWindows) {
    throw Error('cppcheck installation is not supported on Windows');
  }
  await installUserLib();
  const cppcheckSrcZipPath = path.join(RESOURCES_DOWNLOAD_PATH, srcFileName);
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

export async function installCpplintV2FromSrc(
  srcFileName: string,
  options: { terminalId?: string; force?: boolean } = {},
) {
  if (!options.force && (await isEnvInstalled('cpplint'))) {
    return;
  }
  if (isWindows) {
    throw Error('cpplint v2 installation is not supported on Windows');
  }
  await installUserLib();
  const cpplintSrcZipPath = path.join(RESOURCES_DOWNLOAD_PATH, srcFileName);
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
