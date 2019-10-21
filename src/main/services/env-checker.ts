import { logProcess, logMain } from 'common/utils/logger';
import { isMac, SupportedPlatform, Platform } from '@/utils/platform';
import { spawn, ChildProcessOutput } from '@/utils/child-process';

function parseStringFromStd(s: ChildProcessOutput) {
  return (s || '').toString();
}

function matchOne(reg: RegExp, str: ChildProcessOutput) {
  const regResult = reg.exec(parseStringFromStd(str));
  if (regResult && regResult[1]) {
    return regResult[1].trim();
  }
  return null;
}

async function findPath(cmd: string) {
  const cmdMap: Record<SupportedPlatform, string> = {
    [Platform.win32]: 'where',
    [Platform.darwin]: 'which',
    [Platform.linux]: 'which',
  };
  try {
    const { stdout, stderr } = await spawn('[findPath]', cmdMap[process.platform], [cmd]);
    return matchOne(/(.*)/, stdout || stderr);
  } catch (e) { }
  return null;
}

export interface ICheckEnvironmentResultNotInstalled {
  installed: false;
}

export interface ICheckEnvironmentResultInstalled {
  installed: true;
  version: string | null;
  path: string | null;
}

export type ICheckEnvironmentResult = ICheckEnvironmentResultNotInstalled | ICheckEnvironmentResultInstalled;

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
      ver = matchOne(APPLE_CLANG_REG, stderr || stdout) || matchOne(GCC_REG, stderr || stdout);
    } else {
      ver = matchOne(GCC_REG, stderr || stdout);
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
    const ver = matchOne(GDB_REG, stderr || stdout);
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
    const ver = matchOne(PYTHON_REG, stderr || stdout);
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
    const ver = matchOne(CPPLINT_REG, stderr || stdout);
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
    const ver = matchOne(CODE_REG, stderr || stdout);
    if (ver) {
      return genInstalled(ver, await findPath('code'));
    }
  } catch (e) {
    if (isMac) {
      try {
        const binPath = '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
        const { stdout, stderr } = await spawn('[checkVSCode]', binPath, ['-v']);
        const ver = matchOne(CODE_REG, stderr || stdout);
        if (ver) {
          return genInstalled(ver, binPath);
        }
      } catch (e) { }
    }
  }
  return genNotInstalled();
}

async function checkEnvironment() {
  const [gcc, gdb, python, cpplint, code] = await Promise.all([
    isMac ? (await checkXCodeCLT() ? checkGcc() : genNotInstalled()) : checkGcc(),
    isMac ? genNotInstalled() : checkGdb(),
    checkPython(),
    checkCpplint(),
    checkVSCode(),
  ]);
  const environment = {
    gcc,
    gdb,
    python,
    cpplint,
    code,
  };
  logMain.info('[checkEnvironment]', environment);
  return environment;
}

export default checkEnvironment;
