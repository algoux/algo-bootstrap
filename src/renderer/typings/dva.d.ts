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
  name: string;
  environments: IEnvironments;
}

type EffectKeys =
  | 'env/getEnvironments'
  | 'env/installGcc'
  | 'env/installPython'
  | 'env/installCpplint'
  | 'env/installVSCode'
  | 'env/installVsix'
