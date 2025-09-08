import path from 'path';
import os from 'os';
import { appConf } from '@/utils/store';
import { isWindows, isMac } from '@/utils/platform';

export function getVscProfileDirConfig() {
  return appConf.get('vscProfileDir');
}

export function setVscProfileDirConfig(vscProfileDir: string) {
  appConf.set('vscProfileDir', vscProfileDir);
}

export function getVscProfileNameConfig() {
  return appConf.get('vscProfileName');
}

export function setVscProfileNameConfig(vscProfileName: string) {
  appConf.set('vscProfileName', vscProfileName);
}

export function getUserProfilesDirPath() {
  if (isWindows) {
    return path.join(os.homedir(), 'AppData/Roaming/Code/User/profiles');
  }
  if (isMac) {
    return path.join(os.homedir(), 'Library/Application Support/Code/User/profiles');
  }
  return path.join(os.homedir(), '.config/Code/User/profiles');
}

export function getAppVscProfileDirPath() {
  const profileDir = getVscProfileDirConfig();
  if (!profileDir) {
    return null;
  }
  return path.join(getUserProfilesDirPath(), profileDir);
}
