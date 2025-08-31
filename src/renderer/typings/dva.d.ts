type EnvComponentConfig = import('./env').EnvComponentConfig;
type EnvComponentModuleConfigStatus = import('./env').EnvComponentModuleConfigStatus;
type EnvComponent = import('common/configs/env').EnvComponent;
type EnvComponentModule = import('./env').EnvComponentModule;

interface DvaAction<P = any> {
  type: string;
  payload: P;
}

interface IDvaBaseState {
  routing: {
    location: ILocation;
  };
  loading: {
    global: boolean;
    effects: Record<EffectKeys, boolean>;
    models: Record<keyof IDvaModelState, boolean>;
  };
}

interface IDvaModelState {
  env: IEnvState;
  respack: IRespackState;
  projects: IProjectsState;
  resources: IResourcesState;
}

type IState = IDvaBaseState & IDvaModelState;

interface ILocation {
  hash: string;
  pathname: string;
  query: Record<string, string>;
  search: string;
  state: any;
}

// models

interface IGlobalState {}

interface IEnvState {
  environments: IEnvironments;
  config: EnvComponentConfig;
  moduleConfigStatus: Record<EnvComponentModule, EnvComponentModuleConfigStatus>;
}

interface IRespackState {
  hasRespack: boolean;
  manifest: IRespackManifest | null;
}

interface IResourcesState {
  resourceIndex: Record<
    /** ResourceId */ string,
    /** matched the only resource index item */ {
      version: string;
      path: string;
      md5: string;
      size: number;
      updatedAt: string;
    }
  >;
}

interface IProject {
  id: string;
  path: string;
  createdAt: number;
}

interface IProjectsState {
  list: IProject[];
}

type EffectKeys =
  | 'env/getEnvironments'
  | 'env/installGcc'
  | 'env/installPython'
  | 'env/installVSCode'
  | 'env/installVsix'
  | 'env/installCppcheck'
  | 'env/installCpplint'
  | 'projects/addProject'
  | 'projects/deleteProject'
  | 'resources/getResourceIndexItem'
  | 'resources/getResourceIndexItems';
