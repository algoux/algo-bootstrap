import { logMain } from './logger';
import { isWindows } from './platform';
import * as reg from 'native-reg';

const USER_SUBKEY = 'Environment';
const SYSTEM_SUBKEY = 'SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment';

// Helper: stringify value returned by native-reg queryValue / getValue (parsed types)
function _valueToString(v: any): string {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.join(';'); // MULTI_SZ -> join with ';' (reasonable for PATH-like)
  return String(v);
}

export function getWindowsEnv(hkey: reg.HKEY, subKey: string, valueName: string, raw = false) {
  if (raw) {
    let key;
    let value: reg.ParsedValue | null = null;
    try {
      key = reg.openKey(hkey, subKey, reg.Access.READ);
      if (key) {
        value = reg.queryValue(key, valueName);
      }
    } catch {}
    try {
      key && reg.closeKey(key);
    } catch {}
    return value;
  }

  try {
    return reg.getValue(hkey, subKey, valueName);
  } catch {
    return null;
  }
}

export function getWindowsEnvMap(
  pathInclude: 'system' | 'user' | undefined = undefined,
): Record<string, string> {
  const env: Record<string, string> = {};
  const origKeyMap = new Map();

  if (pathInclude === 'system' || !pathInclude) {
    try {
      const sysKey = reg.openKey(reg.HKLM, SYSTEM_SUBKEY, reg.Access.READ);
      if (sysKey) {
        const names = reg.enumValueNames(sysKey);
        for (const valueName of names) {
          // 使用 getValue 虽然能拿到自动展开的值，但可能出现末尾非法字符情况
          // const value = getWindowsEnv(reg.HKLM, SYSTEM_SUBKEY, valueName);
          const value = reg.queryValue(sysKey, valueName);
          env[valueName] = _valueToString(value);
          const valueNameUpper = valueName.toUpperCase();
          origKeyMap.set(valueNameUpper, valueName);
        }
        reg.closeKey(sysKey);
      }
    } catch (e) {
      logMain.error('[getWindowsEnvMap] error opening system key:', e);
    }
  }

  if (pathInclude === 'user' || !pathInclude) {
    try {
      const userKey = reg.openKey(reg.HKCU, USER_SUBKEY, reg.Access.READ);
      if (userKey) {
        const names = reg.enumValueNames(userKey);
        for (const valueName of names) {
          // const value = getWindowsEnv(reg.HKCU, USER_SUBKEY, valueName);
          const value = reg.queryValue(userKey, valueName);
          const valueNameUpper = valueName.toUpperCase();
          if (!origKeyMap.has(valueNameUpper)) {
            origKeyMap.set(valueNameUpper, valueName);
          }
          const usingValueName = origKeyMap.get(valueNameUpper)!;
          // 简单的特殊处理，仅对 Path 合并，其他的覆盖
          if (valueNameUpper === 'PATH') {
            env[usingValueName] = [
              ...(env[usingValueName] || '').split(';').filter(Boolean),
              ..._valueToString(value).split(';').filter(Boolean),
            ].join(';');
          } else {
            env[usingValueName] = _valueToString(value);
          }
        }
        reg.closeKey(userKey);
      }
    } catch (e) {
      logMain.error('[getWindowsEnvMap] error opening user key:', e);
    }
  }

  const envUpper = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [key.toUpperCase(), value]),
  );

  const MAX_DEPTH = 20;
  function expandOnce(str: string, depth: number) {
    if (typeof str !== 'string') return str;
    if (depth >= MAX_DEPTH) return str;
    return str.replace(/%([^%]+)%/g, (_, name) => {
      const up = name.toUpperCase();
      if (Object.prototype.hasOwnProperty.call(envUpper, up)) {
        return expandOnce(envUpper[up], depth + 1);
      }
      if (Object.prototype.hasOwnProperty.call(process.env, up)) {
        return expandOnce(process.env[up], depth + 1);
      }
      return `%${name}%`;
    });
  }
  for (const up of Object.keys(envUpper)) {
    envUpper[up] = expandOnce(envUpper[up], 0);
  }
  const finalEnv = {};
  for (const up of Object.keys(envUpper)) {
    const k = origKeyMap.get(up) || up;
    finalEnv[k] = envUpper[up];
  }

  return finalEnv;
}

export function getWindowsUserPath(raw = false): string {
  let res: string;
  if (raw) {
    res = _valueToString(getWindowsEnv(reg.HKCU, USER_SUBKEY, 'Path', raw));
  } else {
    // const res = _valueToString(getWindowsEnv(reg.HKCU, USER_SUBKEY, 'Path', raw));
    const envMap = getWindowsEnvMap('user');
    const pathKey = Object.keys(envMap).find((key) => key.toUpperCase() === 'PATH');
    if (!pathKey) {
      logMain.warn('[getWindowsUserPath] PATH key not found. envMap:', envMap);
      throw Error('PATH key not found');
    }
    res = envMap[pathKey];
  }
  logMain.info('[getWindowsUserPath]', res);
  return res;
}

export function getWindowsSystemPath(raw = false): string {
  let res: string;
  if (raw) {
    res = _valueToString(getWindowsEnv(reg.HKLM, SYSTEM_SUBKEY, 'Path', raw));
  } else {
    // const res = _valueToString(getWindowsEnv(reg.HKLM, SYSTEM_SUBKEY, 'Path', raw));
    const envMap = getWindowsEnvMap('system');
    const pathKey = Object.keys(envMap).find((key) => key.toUpperCase() === 'PATH');
    if (!pathKey) {
      logMain.warn('[getWindowsUserPath] PATH key not found. envMap:', envMap);
      throw Error('PATH key not found');
    }
    res = envMap[pathKey];
  }
  logMain.info('[getWindowsSystemPath]', res);
  return res;
}

export function setWindowsUserEnv(key: string, value: string) {
  logMain.info('[setWindowsUserEnv] key:', key, 'value:', value);
  if (typeof key !== 'string' || key.length === 0) throw new Error('invalid key');
  const h = reg.createKey(reg.HKCU, USER_SUBKEY, reg.Access.ALL_ACCESS);
  try {
    reg.setValueEXPAND_SZ(h, key, value);
  } finally {
    reg.closeKey(h);
  }
}

export function deleteWindowsUserEnv(key: string) {
  logMain.info('[deleteWindowsUserEnv] key:', key);
  if (typeof key !== 'string' || key.length === 0) throw new Error('invalid key');
  const h = reg.openKey(reg.HKCU, USER_SUBKEY, reg.Access.SET_VALUE);
  if (!h) return false;
  try {
    const existed = reg.deleteValue(h, key);
    return !!existed;
  } finally {
    reg.closeKey(h);
  }
}

export function appendToWindowsUserPath(PATH: string) {
  if (!PATH) {
    return false;
  }
  logMain.info('[appendToWindowsUserPath] PATH to append:', PATH);
  const userPath = getWindowsUserPath() || '%PATH%';
  const userPathArray = userPath.split(';').filter(Boolean);
  if (userPathArray.includes(PATH)) {
    return false;
  }
  userPathArray.push(PATH);
  setWindowsUserEnv('Path', userPathArray.join(';'));
  return true;
}

export function refreshWindowsPath() {
  if (!isWindows) {
    return;
  }
  const envMap = getWindowsEnvMap();
  const pathKey = Object.keys(envMap).find((key) => key.toUpperCase() === 'PATH');
  if (!pathKey) {
    throw Error('PATH key not found');
  }
  const newPath = envMap[pathKey];
  process.env.PATH = newPath;
  logMain.info(`[refreshWindowsPath]`, newPath);
}
