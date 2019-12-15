import { logMain } from 'common/utils/logger';
import { isMac, SupportedPlatform, Platform } from '@/utils/platform';
import { spawn } from '@/utils/child-process';
import { matchOne } from 'common/utils/regexp';
import { parseStringFromProcessOutput } from 'common/utils/format';

export const EnvIds = ['gcc', 'gdb', 'python', 'cpplint', 'code'] as SupportedEnvId[];

export enum VSIXId {
  'ms-vscode.cpptools' = 'ms-vscode.cpptools',
  'formulahendry.code-runner' = 'formulahendry.code-runner',
  'streetsidesoftware.code-spell-checker' = 'streetsidesoftware.code-spell-checker',
  'mine.cpplint' = 'mine.cpplint',
  'vadimcn.vscode-lldb' = 'vadimcn.vscode-lldb',
}

export type SupportedVSIXId = keyof typeof VSIXId;

export const VSIXIds = (isMac ? Object.keys(VSIXId) : Object.keys(VSIXId).filter(id => id !== 'vadimcn.vscode-lldb')) as SupportedVSIXId[];

const emptyEnvironments = genEmptyEnvironments();

let environments = emptyEnvironments;

function genNotInstalled(): ICheckEnvironmentResultNotInstalled {
  return { installed: false };
}

function genInstalled(
  version: ICheckEnvironmentResultInstalled['version'],
  path: ICheckEnvironmentResultInstalled['path']
): ICheckEnvironmentResultInstalled {
  return {
    installed: true,
    version,
    path,
  };
}

export function genEmptyVSIXMap() {
  const map = {};
  VSIXIds.map(id => {
    map[id] = genNotInstalled();
  });
  return map as Record<SupportedVSIXId, ICheckEnvironmentResult>;
}

export function genEmptyEnvironments(): IEnvironments {
  return {
    gcc: genNotInstalled(),
    gdb: genNotInstalled(),
    python: genNotInstalled(),
    cpplint: genNotInstalled(),
    code: genNotInstalled(),
    vsix: genEmptyVSIXMap(),
  };
}

async function findPath(cmd: string) {
  const cmdMap: Record<SupportedPlatform, string> = {
    [Platform.win32]: 'where',
    [Platform.darwin]: 'which',
    [Platform.linux]: 'which',
  };
  try {
    const { stdout, stderr } = await spawn('[findPath]', cmdMap[process.platform], [cmd]);
    return matchOne(/(.*)/, parseStringFromProcessOutput(stdout || stderr));
  } catch (e) { }
  return null;
}

export async function checkXCodeCLT(): Promise<boolean> {
  try {
    if (isMac) {
      await spawn('[checkXCodeCLT]', 'xcode-select', ['-p']);
      return true;
    }
  } catch (e) { }
  return false;
}

export async function checkGcc(): Promise<ICheckEnvironmentResult> {
  const GCC_REG = /^gcc version (.*)$/m;
  const APPLE_CLANG_REG = /version (.*)$/m;
  try {
    if (isMac && !await checkXCodeCLT()) {
      return genNotInstalled();
    }
    const { stdout, stderr } = await spawn('[checkGcc]', 'gcc', ['-v']);
    let ver: string | null = null;
    if (isMac) {
      ver =
        matchOne(APPLE_CLANG_REG, parseStringFromProcessOutput(stderr || stdout)) ||
        matchOne(GCC_REG, parseStringFromProcessOutput(stderr || stdout));
    } else {
      ver = matchOne(GCC_REG, parseStringFromProcessOutput(stderr || stdout));
    }
    if (ver) {
      // if (isWindows) {
      //   // 非 MinGW-W64 版，VSC 不支持调试
      //   if (ver.search('MinGW-W64') === -1) {
      //     return genNotInstalled();
      //   }
      // }
      return genInstalled(ver, await findPath('gcc'));
    }
  } catch (e) { }
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
  } catch (e) { }
  return genNotInstalled();
}

export async function checkPython(): Promise<ICheckEnvironmentResult> {
  const PYTHON_REG = /^Python (.*)$/m;
  try {
    const { stdout, stderr } = await spawn('[checkPython]', 'python', ['-V']);
    const ver = matchOne(PYTHON_REG, parseStringFromProcessOutput(stderr || stdout));
    if (ver) {
      return genInstalled(ver, await findPath('python'));
    }
  } catch (e) { }
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
  } catch (e) { }
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
      } catch (e) { }
    }
  }
  return genNotInstalled();
}

export async function checkVsix(codePath: string): Promise<Record<SupportedVSIXId, ICheckEnvironmentResult>> {
  try {
    const vsixMap = genEmptyVSIXMap();
    const { stdout, stderr } = await spawn('[checkVSIX]', `"${codePath}"`, ['--list-extensions', '--show-versions']);
    VSIXIds.forEach(vsixId => {
      const reg = new RegExp(`^${vsixId}@([.\\w]+)$`, 'm');
      const ver = matchOne(reg, parseStringFromProcessOutput(stderr || stdout));
      if (ver) {
        vsixMap[vsixId] = genInstalled(ver, null);
      }
    });
    return vsixMap;
  } catch (e) { }
  return genEmptyVSIXMap();
}

export async function getEnvironments(force = false) {
  if (!force && environments !== emptyEnvironments) {
    return environments;
  }
  // const [gcc, gdb, python, cpplint, code] = await Promise.all([
  //   checkGcc(),
  //   isMac ? genNotInstalled() : checkGdb(),
  //   checkPython(),
  //   checkCpplint(),
  //   checkVSCode(),
  // ]);
  const gcc = await checkGcc();
  const gdb = isMac ? genNotInstalled() : await checkGdb();
  const python = await checkPython();
  const cpplint = await checkCpplint();
  const code = await checkVSCode();
  const environmentResult: IEnvironments = {
    gcc,
    gdb,
    python,
    cpplint,
    code,
    vsix: code.installed && code.path ? await checkVsix(code.path) : genEmptyVSIXMap(),
  };
  logMain.info('[getEnvironments]', environmentResult);
  environments = environmentResult;
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

export async function isVsixInstalled(vsixId: SupportedVSIXId) {
  return (await getVsix(vsixId)).installed;
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

export async function getWindowsSystemPath() {
  try {
    const { stdout, stderr } = await spawn('[getWindowsSystemPath]', 'reg', ['query', `"HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment"`, '/v', 'PATH']);
    return matchOne(/PATH    REG_\S*SZ    ([\S ]+)/, parseStringFromProcessOutput(stdout || stderr));
  } catch (e) { }
  return null;
}

export async function getWindowsUserPath() {
  try {
    const { stdout, stderr } = await spawn('[getWindowsUserPath]', 'reg', ['query', 'HKEY_CURRENT_USER\\Environment', '/v', 'PATH']);
    return matchOne(/PATH    REG_\S*SZ    ([\S ]+)/, parseStringFromProcessOutput(stdout || stderr));
  } catch (e) { }
  return null;
}
