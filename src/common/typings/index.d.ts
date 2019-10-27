type PromiseResolveType<T extends Promise<any>> = T extends Promise<infer R> ? R : any;

type _GlobalSharedModules = typeof import('common/../main/modules').default;

// type _GlobalEnvironment = PromiseResolveType<ReturnType<typeof import('common/../main/services/env-checker').default>>;

type SupportedPlatform = import('common/../main/utils/platform').SupportedPlatform;

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
  version: string | null;
  path: string | null;
}

type ICheckEnvironmentResult = ICheckEnvironmentResultNotInstalled | ICheckEnvironmentResultInstalled;

interface IEnvironment {
  gcc: ICheckEnvironmentResult;
  gdb: ICheckEnvironmentResult;
  python: ICheckEnvironmentResult;
  cpplint: ICheckEnvironmentResult;
  code: ICheckEnvironmentResult;
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
