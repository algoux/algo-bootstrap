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
}

type IState = IDvaBaseState & IDvaModelState;

interface ILocation {
  hash: string;
  pathname: string;
  query: Record<string, string>;
  search: string;
  state: any;
}

interface IEnvState {
  environments: IEnvironments;
}

interface IRespackState {
  hasRespack: boolean;
  manifest: IRespackManifest | null;
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
  | 'env/installCpplint'
  | 'env/installVSCode'
  | 'env/installVsix'
  | 'respack/getHasRespack'
  | 'respack/getManifest'
  | 'respack/importRespack'
  | 'projects/addProject'
  | 'projects/deleteProject'
