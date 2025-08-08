import { DvaSagaEffect } from '@/utils/dva';
import sm from '@/utils/modules';
import { purifyObject } from '@/../common/utils/format';

type CurrentState = IEnvState;

function genInitialState(): CurrentState {
  return {
    environments: purifyObject(sm.envChecker.genEmptyEnvironments()),
  };
}

export default {
  state: genInitialState(),
  reducers: {
    setEnvironments(
      state: CurrentState,
      { payload: { environments } }: DvaAction<Pick<CurrentState, 'environments'>>,
    ) {
      state.environments = environments;
    },
  },
  effects: {
    *getEnvironments(
      { payload: { force = false } }: DvaAction<{ force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      const environments: IEnvironments = purifyObject(
        yield call(sm.envChecker.getEnvironments, force),
      );
      yield put({
        type: 'setEnvironments',
        payload: {
          environments,
        },
      });
      return environments;
    },
    *installGcc(
      { payload: { force = false } }: DvaAction<{ force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installGcc, force);
      return yield put({
        type: 'getEnvironments',
        payload: {},
      });
    },
    *installPython(
      { payload: { force = false } }: DvaAction<{ force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installPython, force);
      return yield put({
        type: 'getEnvironments',
        payload: {},
      });
    },
    *installCpplint(
      { payload: { force = false } }: DvaAction<{ force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installCpplint, force);
      return yield put({
        type: 'getEnvironments',
        payload: {},
      });
    },
    *installVSCode(
      { payload: { force = false } }: DvaAction<{ force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installVSCode, force);
      return yield put({
        type: 'getEnvironments',
        payload: {},
      });
    },
    *installVsix(
      {
        payload: { vsixId, force = false },
      }: DvaAction<{ vsixId: SupportedVSIXId; force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installVsix, vsixId, force);
      return yield put({
        type: 'getEnvironments',
        payload: {},
      });
    },
  },
};
