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
export type SupportedArch = keyof typeof PlatformArch;
export type SupportedPlatformArch = 'win32-arm64' | 'win32-x64' | 'darwin-arm64' | 'darwin-x64';

export const supportedPlatformArchs = [
  'win32-arm64',
  'win32-x64',
  'darwin-arm64',
  'darwin-x64',
] as SupportedPlatformArch[];
