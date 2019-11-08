import { logMain } from 'common/utils/logger';
import { isMac, SupportedPlatform, Platform } from '@/utils/platform';
import { spawn } from '@/utils/child-process';
import { matchOne } from 'common/utils/regexp';
import { parseStringFromProcessOutput } from 'common/utils/format';

export enum VSIXId {
  'ms-vscode.cpptools' = 'ms-vscode.cpptools',
  'formulahendry.code-runner' = 'formulahendry.code-runner',
  'streetsidesoftware.code-spell-checker' = 'streetsidesoftware.code-spell-checker',
  'mine.cpplint' = 'mine.cpplint',
}

export type SupportedVSIXId = keyof typeof VSIXId;

export const VSIXIds = Object.keys(VSIXId) as SupportedVSIXId[];

const emptyEnvironment = genEmptyEnvironment();

let environment = emptyEnvironment;

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
  Object.keys(VSIXId).map(id => {
    map[id] = genNotInstalled();
  });
  return map as Record<SupportedVSIXId, ICheckEnvironmentResult>;
}

export function genEmptyEnvironment(): IEnvironment {
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
  const APPLE_CLANG_REG = /^Apple clang version (.*)$/m;
  try {
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
        const binPath = '/Applications/Visual\\ Studio\\ Code.app/Contents/Resources/app/bin/code';
        const { stdout, stderr } = await spawn('[checkVSCode]', binPath, ['-v']);
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

export async function getEnvironment(force = false) {
  if (!force && environment !== emptyEnvironment) {
    return environment;
  }
  const [gcc, gdb, python, cpplint, code] = await Promise.all([
    isMac ? (await checkXCodeCLT() ? checkGcc() : genNotInstalled()) : checkGcc(),
    isMac ? genNotInstalled() : checkGdb(),
    checkPython(),
    checkCpplint(),
    checkVSCode(),
  ]);
  const environmentResult: IEnvironment = {
    gcc,
    gdb,
    python,
    cpplint,
    code,
    vsix: code.installed && code.path ? await checkVsix(code.path) : genEmptyVSIXMap(),
  };
  logMain.info('[getEnvironment]', environmentResult);
  environment = environmentResult;
  return environmentResult;
}

export async function isEnvInstalled(env: Exclude<keyof IEnvironment, 'vsix'>) {
  return (await getEnvironment())[env].installed;
}

export async function isVsixInstalled(vsixId: SupportedVSIXId) {
  return (await getEnvironment()).vsix[vsixId].installed;
}
