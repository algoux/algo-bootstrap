import { logMain } from './logger';
import { parseStringFromProcessOutput } from 'common/utils/format';
import { escapeRegExp, matchOne } from 'common/utils/regexp';
import { spawn } from './child-process';
import { isWindows } from './platform';

export async function getWindowsSystemPath() {
  try {
    const { stdout, stderr } = await spawn('[getWindowsSystemPath]', 'reg', [
      'query',
      `"HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment"`,
      '/v',
      'PATH',
    ]);
    return matchOne(
      /PATH    REG_\S*SZ    ([\S ]+)/,
      parseStringFromProcessOutput(stdout || stderr),
    );
  } catch (e) {}
  return null;
}

export async function getWindowsUserPath() {
  try {
    const { stdout, stderr } = await spawn('[getWindowsUserPath]', 'reg', [
      'query',
      'HKEY_CURRENT_USER\\Environment',
      '/v',
      'PATH',
    ]);
    return matchOne(
      /PATH    REG_\S*SZ    ([\S ]+)/,
      parseStringFromProcessOutput(stdout || stderr),
    );
  } catch (e) {}
  return null;
}

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
