const _platform = process.platform;

export const isWindows = _platform === 'win32';
export const isMac = _platform === 'darwin';
export const isLinux = _platform === 'linux';

export enum Platform {
  win32 = 'win32',
  darwin = 'darwin',
  linux = 'linux',
}

export type SupportedPlatform = keyof typeof Platform;
