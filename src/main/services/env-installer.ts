import { isMac, isWindows } from "@/utils/platform";
import { spawn } from "@/utils/child-process";

export async function installXcodeCLT() {
  try {
    if (isMac) {
      await spawn('[installXcodeCLT]', 'xcode-select', ['--install']);
      return true;
    }
  } catch (e) { }
  return false;
}

export async function installGccAndGdb() {
  if (isMac) {
    return await installXcodeCLT();
  } else if (isWindows) {
    // 解压 MinGW64
    // 设置 PATH
    return true;
  }
  return false;
}

export async function installPython() {
  if (isMac) {
    return true;
  } else if (isWindows) {

    return true;
  }
  return false;
}

export async function installCpplint() {
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

export async function installVSCode() {
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
