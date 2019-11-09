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
import * as path from 'path';
import { matchOne } from 'common/utils/regexp';
import { logMain } from 'common/utils/logger';
import getFolderSize from 'get-folder-size';

const RESPACK_PATH = path.join(app.getPath('userData'), paths.respack);
const RESPACK_TEMP_PATH = path.join(app.getPath('userData'), paths.respackTemp);

export async function refreshWindowsPath() {
  if (!isWindows) {
    return;
  }
  const systemPath = await getWindowsSystemPath() || '';
  const userPath = await getWindowsUserPath() || '';
  const newPath = [...systemPath.split(';').filter(p => !!p), ...userPath.split(';').filter(p => !!p)].join(';');
  logMain.info('[refreshWindowsPath]', newPath);
  process.env.PATH = newPath;
  getEnvironments(true);
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
    getFolderSize(installPath, (err, size) => {
      if (err) {
        logMain.error(`[getMingwUncompressedSize.error ${Date.now() - __start + 'ms'}]`, err);
        reject(err);
        return;
      }
      resolve(size);
    });
  });
}

export async function installGccAndGdb(force = false) {
  if (!force && await isEnvInstalled('gcc')) {
    return;
  }
  if (isMac) {
    await installXCodeCLT();
  } else if (isWindows) {
    const res = await Respack.readResFromLocalManifestOrThrow('c++');
    // 解压 MinGW64
    const installPath = 'C:\\MinGW64';
    await extractAll(path.join(RESPACK_PATH, res.name), installPath, true);
    const userPath = await getWindowsUserPath() || '';
    logMain.info('[installGccAndGdb] userPath:', userPath);
    await spawn('[installGccAndGdb]', 'setx', ['PATH', `"${userPath}${!userPath || userPath.endsWith(';') ? '' : ';'}${installPath}\\bin"`]);
    await refreshWindowsPath();
  }
}

export async function installPython(force = false) {
  if (!force && await isEnvInstalled('python')) {
    return;
  }
  if (isWindows) {
    const res = await Respack.readResFromLocalManifestOrThrow('python');
    await execFile('[installPython]', path.join(RESPACK_PATH, res.name));
    await refreshWindowsPath();
  }
}

export async function installCpplint(force = false) {
  if (!force && await isEnvInstalled('cpplint')) {
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
      // 是 Mac 且是 py2 时，使用 sudo 安装
      if (isMac && matchOne(/^(\d+)/, py.version) === '2') {
        await sudoExec('[installCpplint]', `cd "${installPath}" && python setup.py install`);
      } else {
        await spawn('[installCpplint]', 'python', ['setup.py', 'install'], {
          cwd: installPath,
        });
      }
      break;
    default:
      throw Error('Incompatible format');
  }
}

export async function installVSCode(force = false) {
  if (!force && await isEnvInstalled('code')) {
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
  } else if (isWindows) {
    await execFile('[installVSCode]', path.join(RESPACK_PATH, res.name));
    await refreshWindowsPath();
  }
}

export async function installVsix(vsixId: SupportedVSIXId, force = false) {
  if (!force && await isVsixInstalled(vsixId)) {
    return;
  }
  const code = await getEnvironment('code');
  if (!code.installed) {
    throw Error('No VS Code installed');
  }
  const res = await Respack.readResFromLocalManifestOrThrow(`vsix/${vsixId}`);
  const filePath = path.join(RESPACK_PATH, res.name);
  await spawn('[installVsix]', `"${code.path || 'code'}"`, ['--install-extension', `"${filePath}"`]);
}
