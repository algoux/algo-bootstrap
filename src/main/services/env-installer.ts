import { isMac, isWindows } from "@/utils/platform";
import { spawn } from "@/utils/child-process";
import { getEnvironment } from "./env-checker";

async function isEnvInstalled(env: keyof IEnvironment) {
  return (await getEnvironment())[env].installed;
}

export async function installXCodeCLT() {
  if (isMac) {
    await spawn('[installXcodeCLT]', 'xcode-select', ['--install']);
  }
}

export async function installGccAndGdb(force = false) {
  if (!force && await isEnvInstalled('gcc')) {
    return;
  }
  if (isMac) {
    await installXCodeCLT();
  } else if (isWindows) {
    // 解压 MinGW64

    // 设置 PATH
    await spawn('[installGccAndGdb]', 'setx', ['PATH', '"%PATH%;C:\\MinGW64\\bin"']);
  }
}

export async function installPython(force = false) {
  if (!force && await isEnvInstalled('python')) {
    return;
  }
  if (isMac) {
    return true;
  } else if (isWindows) {

    return true;
  }
  return false;
}

export async function installCpplint(force = false) {
  if (!force && await isEnvInstalled('cpplint')) {
    return;
  }
  try {
    // 解压 cpplint 项目代码包
    // 安装 cpplint
    const cpplintPath = '';
    // Mac 且是 py2 时，使用 sudo 安装
    await spawn('[installCpplint]', 'python', [`${cpplintPath}/setup.py`, 'install']);
    return true;
  } catch (e) { }
  return false;
}

export async function installVSCode(force = false) {
  if (!force && await isEnvInstalled('code')) {
    return;
  }
  if (isMac) {
    // 解压 zip
    // 复制 app 到 /Applications
    return true;
  } else if (isWindows) {

    return true;
  }
  return false;
}

export async function installVsix(vsixPath) {
  try {
    await spawn('[installVsix]', 'code', ['--install-extension', vsixPath]);
    return true;
  } catch (e) { }
  return false;
}
