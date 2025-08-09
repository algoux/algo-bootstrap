import os from 'os';

const _platform = process.platform;
const _arch = os.arch();

export const isWindows = _platform === 'win32';
export const isMac = _platform === 'darwin';
export const isLinux = _platform === 'linux';

export enum Platform {
  win32 = 'win32',
  darwin = 'darwin',
  // linux = 'linux',
}

export enum PlatformArch {
  arm64 = 'arm64',
  x64 = 'x64',
}

export type SupportedPlatform = keyof typeof Platform;
export type SupportedPlatformArch = `${SupportedPlatform}-${PlatformArch}`;

export const currentPlatform = _platform as SupportedPlatform;
export const currentPlatformArch = `${_platform}-${_arch}` as SupportedPlatformArch;

export const supportedPlatformArchs = [
  'win32-arm64',
  'win32-x64',
  'darwin-arm64',
  'darwin-x64',
] as SupportedPlatformArch[];

export function isPlatformArchIsSupported(): boolean {
  return supportedPlatformArchs.includes(currentPlatformArch);
}
