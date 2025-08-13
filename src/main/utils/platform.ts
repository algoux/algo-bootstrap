import os from 'os';
import {
  supportedPlatformArchs,
  SupportedPlatform,
  SupportedArch,
  SupportedPlatformArch,
} from 'common/configs/platform';

const _platform = process.platform;
const _arch = os.arch();

export const isWindows = _platform === 'win32';
export const isMac = _platform === 'darwin';
export const isLinux = _platform === 'linux';

export const currentPlatform = _platform as SupportedPlatform;
export const currentArch = _arch as SupportedArch;
export const currentPlatformArch = `${_platform}-${_arch}` as SupportedPlatformArch;

export function isPlatformArchIsSupported(): boolean {
  return supportedPlatformArchs.includes(currentPlatformArch);
}
