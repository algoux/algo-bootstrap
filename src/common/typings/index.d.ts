type PromiseResolveType<T extends Promise<any>> = T extends Promise<infer R> ? R : any;

type _GlobalSharedModules = typeof import('common/../main/modules').default;

// type _GlobalEnvironment = PromiseResolveType<ReturnType<typeof import('common/../main/services/env-checker').default>>;

type SupportedPlatform = import('common/../main/utils/platform').SupportedPlatform;
type SupportedEnvId = Exclude<keyof IEnvironments, 'vsix'>
type SupportedVSIXId = import('common/../main/services/env-checker').SupportedVSIXId;

interface IApiResp<T = undefined> {
  success: boolean;
  code?: number;
  msg?: string;
  data?: T;
}

interface ICheckEnvironmentResultNotInstalled {
  installed: false;
}

interface ICheckEnvironmentResultInstalled {
  installed: true;
  version: string;
  path: string | null;
}

type ICheckEnvironmentResult = ICheckEnvironmentResultNotInstalled | ICheckEnvironmentResultInstalled;

interface IEnvironments {
  gcc: ICheckEnvironmentResult;
  gdb: ICheckEnvironmentResult;
  python: ICheckEnvironmentResult;
  cpplint: ICheckEnvironmentResult;
  code: ICheckEnvironmentResult;
  vsix: Record<SupportedVSIXId, ICheckEnvironmentResult>;
}

interface IRespackManifestFile {
  id: string;
  name: string;
  version: string;
  format: string;
}

interface IRespackManifest {
  id: string;
  description: string;
  version: string;
  platform: SupportedPlatform;
  files: IRespackManifestFile[];
}

interface ICheckVersionInfo {
  version: string;
  url: string;
}

interface ICheckAppVersion {
  win32: ICheckVersionInfo;
  darwin: ICheckVersionInfo;
}

interface ICheckRespackVersion {
  win32: ICheckVersionInfo;
  darwin: ICheckVersionInfo;
}
