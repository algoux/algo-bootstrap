import { isMac, isWindows } from '@/utils/platform';
import { spawn } from '@/utils/child-process';
import { getEnvironment } from './env-checker';
import Respack from './respack';
import { extractAll, getUncompressedSize } from '@/utils/extract';
import { app } from 'electron';
import paths from 'common/configs/paths';
import * as path from 'path';
import { matchOne } from 'common/utils/regexp';
import { parseStringFromProcessOutput } from 'common/utils/format';
import { logMain } from 'common/utils/logger';
import getFolderSize from 'get-folder-size';

const RESPACK_PATH = app.getPath('userData') + paths.respack;
const RESPACK_TEMP_PATH = app.getPath('userData') + paths.respackTemp;

async function isEnvInstalled(env: Exclude<keyof IEnvironment, 'vsix'>) {
  return (await getEnvironment())[env].installed;
}

async function isVsixInstalled(vsixId: SupportedVSIXId) {
  return (await getEnvironment()).vsix[vsixId].installed;
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
    const { stdout, stderr } = await spawn('[installGccAndGdb]', 'reg', ['query', 'HKEY_CURRENT_USER\\Environment', '/v', 'PATH']);
    const userPath = matchOne(/PATH    REG_EXPAND_SZ    ([\S ]+)/, parseStringFromProcessOutput(stdout || stderr)) || '%PATH%';
    logMain.info('[installGccAndGdb] userPath:', userPath);
    await spawn('[installGccAndGdb]', 'setx', ['PATH', `"${userPath}${userPath.endsWith(';') ? '' : ';'}${installPath}\\bin"`]);
  }
}

export async function installPython(force = false) {
  if (!force && await isEnvInstalled('python')) {
    return;
  }
  if (isWindows) {

  }
}

export async function installCpplint(force = false) {
  if (!force && await isEnvInstalled('cpplint')) {
    return;
  }
  const res = await Respack.readResFromLocalManifestOrThrow('cpplint');
  switch (res.format) {
    case 'zip':
      // 解压 cpplint 项目代码包
      const installPath = path.join(RESPACK_TEMP_PATH, 'cpplint');
      await extractAll(path.join(RESPACK_PATH, res.name), installPath);
      // 安装 cpplint
      // TODO: Mac 且是 py2 时，使用 sudo 安装
      await spawn('[installCpplint]', 'python', ['setup.py', 'install'], {
        cwd: installPath,
      });
      break;
    default:
      throw new Error('Incompatible format');
  }
}

export async function installVSCode(force = false) {
  if (!force && await isEnvInstalled('code')) {
    return;
  }
  if (isMac) {
    // 解压 zip
    // 复制 app 到 /Applications
  } else if (isWindows) {

  }
}

export async function installVsix(vsixPath) {
  try {
    await spawn('[installVsix]', 'code', ['--install-extension', vsixPath]);
    return;
  } catch (e) { }
}
