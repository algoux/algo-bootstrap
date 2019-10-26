interface IState {
  global: IGlobalState;
}

interface IGlobalState {
  name: string;
  environment: IEnvironment;
}
