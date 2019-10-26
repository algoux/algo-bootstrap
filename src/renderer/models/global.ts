import sm from '@/utils/modules';
import { DvaAction, DvaSagaEffect } from '@/utils/dva';

type CurrentState = IGlobalState;

function genInitialState(): CurrentState {
  return {
    name: 'Dva state',
    environment: sm.envChecker.genEmptyEnvironment(),
  };
}

export default {
  state: genInitialState(),
  reducers: {
    setEnvironment(state: CurrentState, { payload: { environment } }: DvaAction<Pick<CurrentState, 'environment'>>) {
      state.environment = environment;
    },
  },
  effects: {
    * getEnvironment({ payload: { force = false } }: DvaAction<{ force?: boolean }>, { call, put }: DvaSagaEffect) {
      const environment: IEnvironment = yield call(sm.envChecker.getEnvironment, force);
      yield put({
        type: 'setEnvironment',
        payload: {
          environment,
        },
      });
      return environment;
    },
  },
};
