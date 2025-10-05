import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import checkDiskSpace from 'check-disk-space';
import { logMain } from '@/utils/logger';
import { isMac, isWindows } from '@/utils/platform';
import { Platform } from 'common/configs/platform';
import { spawn } from '@/utils/child-process';
import { matchOne } from 'common/utils/regexp';
import { parseStringFromProcessOutput } from 'common/utils/format';
import { VSIXIds } from 'common/configs/resources';
import { getAppVscProfileDirPath, getVscProfileNameConfig } from '@/utils/vsc';
import { rearrangeWindowsPath } from '@/utils/platform-windows';

const emptyEnvironments = genEmptyEnvironments();

let environmentsCache = emptyEnvironments;

function genNotInstalled(): ICheckEnvironmentResultNotInstalled {
  return { installed: false };
}

function genInstalled<T = any>(
  version: ICheckEnvironmentResultInstalled['version'],
  path: ICheckEnvironmentResultInstalled['path'],
  meta: T = {} as T,
): ICheckEnvironmentResultInstalled<T> {
  return {
    installed: true,
    version,
    path,
    meta,
  };
}

export function genEmptyVSIXMap() {
  const map = {};
  VSIXIds.map((id) => {
    map[id] = genNotInstalled();
  });
  return map as Record<SupportedVSIXId, ICheckEnvironmentResult>;
}

export function genEmptyEnvironments(): IEnvironments {
  return {
    gcc: genNotInstalled(),
    gdb: genNotInstalled(),
    python: genNotInstalled(),
    cppcheck: genNotInstalled(),
    cpplint: genNotInstalled(),
    vscode: genNotInstalled(),
    vsix: genEmptyVSIXMap(),
    vscodeProfile: genNotInstalled(),
  };
}

async function findPath(cmd: string) {
  const cmdMap: Record<SupportedPlatform, string> = {
    [Platform.win32]: 'where',
    [Platform.darwin]: 'which',
    // [Platform.linux]: 'which',
  };
  try {
    const { stdout, stderr } = await spawn('[findPath]', cmdMap[process.platform], [cmd]);
    return matchOne(/(.*)/, parseStringFromProcessOutput(stdout || stderr));
  } catch (e) {}
  return null;
}

export async function findCommandsInPath(
  searchRegExp: RegExp,
): Promise<{ command: string; path: string }[]> {
  const pathEnv = process.env.PATH || '';
  const pathDirs = pathEnv.split(path.delimiter);
  const results = [];

  for (const dir of pathDirs) {
    try {
      const files = await fs.promises.readdir(dir);
      for (const file of files) {
        if (searchRegExp.test(file)) {
          const fullPath = path.join(dir, file);
          try {
            await fs.promises.access(fullPath, fs.constants.X_OK);
            results.push({
              command: file,
              path: fullPath,
            });
          } catch (e) {}
        }
      }
    } catch (e) {}
  }

  return results;
}

export async function checkXCodeCLT(): Promise<boolean> {
  try {
    if (isMac) {
      await spawn('[checkXCodeCLT]', 'xcode-select', ['-p']);
      return true;
    }
  } catch (e) {}
  return false;
}

export async function checkGcc(): Promise<ICheckEnvironmentResult<ICheckEnvironmentResultMetaGcc>> {
  const GCC_REG = /^gcc version (.*)$/m;
  const GCC_REG_ZH = /^gcc 版本 (.*)$/m;
  const CLANG_REG = /clang version (.*)$/m;
  const CLANG_REG_ZH = /clang 版本 (.*)$/m;
  const verMatcher = (ver: string) => {
    const fullVer =
      matchOne(GCC_REG, ver) ||
      matchOne(GCC_REG_ZH, ver) ||
      matchOne(CLANG_REG, ver) ||
      matchOne(CLANG_REG_ZH, ver);
    if (!fullVer) {
      return null;
    }
    const verNum = matchOne(/^(\d+\.\d+\.\d+)/, fullVer);
    if (!verNum) {
      return null;
    }
    return {
      fullVersion: fullVer,
      version: verNum,
    };
  };

  try {
    if (isMac && !(await checkXCodeCLT())) {
      return genNotInstalled();
    }
    const { stdout, stderr } = await spawn('[checkGcc]', 'gcc', ['-v']);
    let ver = verMatcher(parseStringFromProcessOutput(stderr || stdout));
    if (ver) {
      // if (isWindows) {
      //   // 非 MinGW-W64 版，VSC 不支持调试
      //   if (ver.search('MinGW-W64') === -1) {
      //     return genNotInstalled();
      //   }
      // }
      const alternativesCommands = await findCommandsInPath(/^gcc-\d+$/);
      const alternatives: ICheckEnvironmentResultMetaGcc['alternatives'] = [];
      for (const alternative of alternativesCommands) {
        const { stdout, stderr } = await spawn('[checkGcc]', alternative.command, ['-v']);
        const altVer = verMatcher(parseStringFromProcessOutput(stderr || stdout));
        if (altVer) {
          alternatives.push({
            command: alternative.command,
            path: alternative.path,
            version: altVer.version,
            fullVersion: altVer.fullVersion,
            type:
              altVer.fullVersion.includes('clang') || altVer.fullVersion.includes('llvm')
                ? 'clang'
                : 'gcc',
          });
        }
      }
      return genInstalled(ver.version, await findPath('gcc'), {
        fullVersion: ver.fullVersion,
        type:
          ver.fullVersion.includes('clang') || ver.fullVersion.includes('llvm') ? 'clang' : 'gcc',
        alternatives,
      });
    }
  } catch (e) {}
  return genNotInstalled();
}

export async function checkGdb(): Promise<ICheckEnvironmentResult> {
  const GDB_REG = /^GNU gdb \(GDB\) (.*)$/m;
  try {
    const { stdout, stderr } = await spawn('[checkGdb]', 'gdb', ['-v']);
    const ver = matchOne(GDB_REG, parseStringFromProcessOutput(stderr || stdout));
    if (ver) {
      return genInstalled(ver, await findPath('gdb'));
    }
  } catch (e) {}
  return genNotInstalled();
}

export async function checkPython(): Promise<
  ICheckEnvironmentResult<ICheckEnvironmentResultMetaPython>
> {
  const PYTHON_REG = /^Python (.*)$/m;
  try {
    if (isMac && !(await checkXCodeCLT())) {
      return genNotInstalled();
    }
    const { stdout, stderr } = await spawn('[checkPython]', 'python3', ['-V']);
    const ver = matchOne(PYTHON_REG, parseStringFromProcessOutput(stderr || stdout));
    if (ver) {
      return genInstalled(ver, await findPath('python3'), {
        command: 'python3',
        isPython3: /3\.\d+\.\d+/.test(ver),
      });
    }
  } catch (e) {}

  try {
    const { stdout, stderr } = await spawn('[checkPython]', 'python', ['-V']);
    const ver = matchOne(PYTHON_REG, parseStringFromProcessOutput(stderr || stdout));
    if (ver) {
      return genInstalled(ver, await findPath('python'), {
        command: 'python',
        isPython3: /3\.\d+\.\d+/.test(ver),
      });
    }
  } catch (e) {}

  // 尝试将 WindowsApps 的假 python 挪到最后，重试一次
  if (isWindows && rearrangeWindowsPath()) {
    const { stdout, stderr } = await spawn('[checkPython]', 'python3', ['-V']);
    const ver = matchOne(PYTHON_REG, parseStringFromProcessOutput(stderr || stdout));
    if (ver) {
      return genInstalled(ver, await findPath('python3'), {
        command: 'python3',
        isPython3: /3\.\d+\.\d+/.test(ver),
      });
    }
  }

  return genNotInstalled();
}

export async function checkCpplint(): Promise<ICheckEnvironmentResult> {
  const CPPLINT_REG = /^cpplint (.*)$/m;
  try {
    const { stdout, stderr } = await spawn('[checkCpplint]', 'cpplint', ['--version']);
    const ver = matchOne(CPPLINT_REG, parseStringFromProcessOutput(stderr || stdout));
    if (ver) {
      return genInstalled(ver, await findPath('cpplint'));
    }
  } catch (e) {}
  return genNotInstalled();
}

export async function checkCppcheck(): Promise<ICheckEnvironmentResult> {
  const CPP_CHECK_REG = /^Cppcheck (.*)$/m;
  try {
    const { stdout, stderr } = await spawn('[checkCppcheck]', 'cppcheck', ['--version']);
    const ver = matchOne(CPP_CHECK_REG, parseStringFromProcessOutput(stderr || stdout));
    if (ver) {
      return genInstalled(ver, await findPath('cppcheck'));
    }
  } catch (e) {}
  return genNotInstalled();
}

export async function checkVSCode(): Promise<ICheckEnvironmentResult> {
  const CODE_REG = /(\d+.\d+.\d+)/;
  try {
    const { stdout, stderr } = await spawn('[checkVSCode]', 'code', ['-v']);
    const ver = matchOne(CODE_REG, parseStringFromProcessOutput(stderr || stdout));
    if (ver) {
      return genInstalled(ver, await findPath('code'));
    }
  } catch (e) {
    if (isMac) {
      try {
        const binPath = '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
        const { stdout, stderr } = await spawn('[checkVSCode]', `"${binPath}"`, ['-v']);
        const ver = matchOne(CODE_REG, parseStringFromProcessOutput(stderr || stdout));
        if (ver) {
          return genInstalled(ver, binPath);
        }
      } catch (e) {}
    }
  }
  return genNotInstalled();
}

const VSCODE_EXT_DIR = path.join(os.homedir(), '.vscode', 'extensions');

export async function checkVsix(
  codePath: string,
): Promise<Record<SupportedVSIXId, ICheckEnvironmentResult>> {
  const extPaths = await fs.readdir(VSCODE_EXT_DIR).catch(() => []);
  try {
    const vsixMap = genEmptyVSIXMap();
    const { stdout, stderr } = await spawn('[checkVSIX]', `"${codePath}"`, [
      '--list-extensions',
      '--show-versions',
    ]);
    for (const vsixId of VSIXIds) {
      const reg = new RegExp(`^${vsixId}@([_.-\\w]+)$`, 'm');
      const ver = matchOne(reg, parseStringFromProcessOutput(stderr || stdout));
      if (ver) {
        const extPath = extPaths.find((extPath) => extPath.startsWith(vsixId));
        if (extPath) {
          vsixMap[vsixId] = genInstalled(ver, path.join(VSCODE_EXT_DIR, extPath));
        }
      }
    }
    return vsixMap;
  } catch (e) {}
  return genEmptyVSIXMap();
}

export async function getEnvironments(force = false) {
  if (!force && environmentsCache !== emptyEnvironments) {
    return environmentsCache;
  }
  // const [gcc, gdb, python, cpplint, vscode] = await Promise.all([
  //   checkGcc(),
  //   isMac ? genNotInstalled() : checkGdb(),
  //   checkPython(),
  //   checkCpplint(),
  //   checkVSCode(),
  // ]);
  const gcc = await checkGcc();
  const gdb = isMac ? genNotInstalled() : await checkGdb();
  const python = await checkPython();
  const cppcheck = await checkCppcheck();
  const cpplint = await checkCpplint();
  const vscode = await checkVSCode();
  const environmentResult: IEnvironments = {
    gcc,
    gdb,
    python,
    cppcheck,
    cpplint,
    vscode,
    vsix: vscode.installed && vscode.path ? await checkVsix(vscode.path) : genEmptyVSIXMap(),
    vscodeProfile: await checkVSCodeUserProfile(),
  };
  logMain.info('[getEnvironments]', JSON.stringify(environmentResult, null, 2));
  environmentsCache = environmentResult;
  return environmentResult;
}

export async function getEnvironment(env: Exclude<keyof IEnvironments, 'vsix'>) {
  return (await getEnvironments())[env];
}

export async function getVsix(vsixId: SupportedVSIXId) {
  return (await getEnvironments()).vsix[vsixId];
}

export async function isEnvInstalled(env: Exclude<keyof IEnvironments, 'vsix'>) {
  return (await getEnvironment(env)).installed;
}

export async function isVsixesInstalled(vsixIds: SupportedVSIXId[]) {
  const environments = await getEnvironments();
  for (const vsixId of vsixIds) {
    if (!environments.vsix[vsixId].installed) {
      return false;
    }
  }
  return true;
}

// export async function isAllVsixInstalled() {
//   let installed = true;
//   for (const vsixId of VSIXIds) {
//     if (!await isVsixInstalled(vsixId)) {
//       installed = false;
//       break;
//     }
//   }
//   return installed;
// }

export function checkRemainingDiskSpace(checkPath?: string) {
  if (isWindows) {
    return checkDiskSpace(checkPath || 'C:');
  }
  return checkDiskSpace(checkPath || '/');
}

export async function checkVSCodeUserProfile() {
  const profileDirPath = getAppVscProfileDirPath();
  if (!profileDirPath) {
    return genNotInstalled();
  }
  try {
    if (!(await fs.stat(profileDirPath)).isDirectory()) {
      return genNotInstalled();
    }
    const settingsJSON = await fs
      .readJSON(path.join(profileDirPath, 'settings.json'))
      .catch(() => ({}));
    return genInstalled(settingsJSON?.algoBootstrap?.version || '', profileDirPath, {
      profileName: getVscProfileNameConfig(),
    });
  } catch (e: any) {
    return genNotInstalled();
  }
}
