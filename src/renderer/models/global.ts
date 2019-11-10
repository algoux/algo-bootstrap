import { DvaAction, DvaSagaEffect } from '@/utils/dva';
import sm from '@/utils/modules';
import { purifyObject } from '@/../common/utils/format';

type CurrentState = IGlobalState;

function genInitialState(): CurrentState {
  return {
    name: 'Dva state',
    environments: purifyObject(sm.envChecker.genEmptyEnvironments()),
  };
}

export default {
  state: genInitialState(),
  reducers: {
    setEnvironments(state: CurrentState, { payload: { environments } }: DvaAction<Pick<CurrentState, 'environments'>>) {
      state.environments = purifyObject(environments);
    },
  },
  effects: {
    * getEnvironments({ payload: { force = false } }: DvaAction<{ force?: boolean }>, { call, put }: DvaSagaEffect) {
      const environments: IEnvironments = yield call(sm.envChecker.getEnvironments, force);
      yield put({
        type: 'setEnvironments',
        payload: {
          environments,
        },
      });
      return environments;
    },
  },
};
