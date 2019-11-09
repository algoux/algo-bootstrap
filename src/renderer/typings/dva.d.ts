interface IState {
  global: IGlobalState;
}

interface IGlobalState {
  name: string;
  environments: IEnvironment;
}
