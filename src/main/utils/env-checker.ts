import { exec } from 'promisify-child-process';
import { logProcess, logMain } from 'common/utils/logger';

const SHELL_TIMEOUT = 10 * 1000;

const commonExecOptions = {
  timeout: SHELL_TIMEOUT,
  windowsHide: true,
};

export interface ICheckEnvironmentResult {
  installed: boolean;
  version?: string;
}

function versionMatch(reg: RegExp, str: any) {
  const regResult = reg.exec((str || '').toString());
  if (regResult && regResult[1]) {
    return regResult[1];
  }
  return null;
}

export async function checkGcc(): Promise<ICheckEnvironmentResult> {
  const GCC_REG = /^gcc version (.*)$/m;
  const APPLE_CLANG_REG = /^Apple clang version (.*)$/m;
  try {
    const { stdout, stderr } = await exec('gcc -v', commonExecOptions);
    let ver: string | null = null;
    if (process.platform === 'darwin') {
      ver = versionMatch(APPLE_CLANG_REG, stderr) || versionMatch(GCC_REG, stdout);
    } else {
      ver = versionMatch(GCC_REG, stdout);
    }
    if (ver) {
      return {
        installed: true,
        version: ver,
      };
    }
  } catch (e) {
    logProcess.error('[checkGcc]', e);
  }
  return {
    installed: false,
  };
}

export async function checkPython(): Promise<ICheckEnvironmentResult> {
  const PYTHON_REG = /^Python (.*)$/m;
  try {
    const { stdout, stderr } = await exec('python -V', commonExecOptions);
    const ver = versionMatch(PYTHON_REG, stdout || stderr);
    if (ver) {
      return {
        installed: true,
        version: ver,
      };
    }
  } catch (e) {
    logProcess.error('[checkPython]', e);
  }
  return {
    installed: false,
  };
}

async function checkEnvironment() {
  const environment = {
    gcc: await checkGcc(),
    python: await checkPython(),
  };
  logMain.info(environment);
  return environment;
}

export default checkEnvironment;
