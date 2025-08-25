import {
  EnvComponentAction,
  EnvComponentConfigItem,
  EnvComponentModuleConfigStatus,
  EnvComponentModule,
} from '@/typings/env';
import { DvaSagaEffect } from '@/utils/dva';
import sm from '@/utils/modules';
import { EnvComponent } from 'common/configs/env';
import { purifyObject } from 'common/utils/format';

type CurrentState = IEnvState;

function genInitialState(): CurrentState {
  return {
    environments: purifyObject(sm.envChecker.genEmptyEnvironments()),
    config: {
      [EnvComponent.c_cpp]: {
        action: EnvComponentAction.SKIP,
      },
      [EnvComponent.python]: {
        action: EnvComponentAction.SKIP,
      },
      [EnvComponent.vscode]: {
        action: EnvComponentAction.SKIP,
      },
      [EnvComponent.basicExtensions]: {
        action: EnvComponentAction.SKIP,
      },
      [EnvComponent.codeStyleExtensions]: {
        action: EnvComponentAction.SKIP,
      },
      [EnvComponent.languagePackages]: {
        action: EnvComponentAction.SKIP,
      },
    },
    moduleConfigStatus: {
      [EnvComponentModule.c_cpp]: EnvComponentModuleConfigStatus.PENDING,
      [EnvComponentModule.python]: EnvComponentModuleConfigStatus.PENDING,
      [EnvComponentModule.vscode]: EnvComponentModuleConfigStatus.PENDING,
      [EnvComponentModule.extensions]: EnvComponentModuleConfigStatus.PENDING,
      [EnvComponentModule.magic]: EnvComponentModuleConfigStatus.PENDING,
    },
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
    setConfig(
      state: CurrentState,
      { payload: { config } }: DvaAction<Pick<CurrentState, 'config'>>,
    ) {
      state.config = config;
    },
    setConfigItem(
      state: CurrentState,
      {
        payload: { component, item },
      }: DvaAction<{ component: EnvComponent; item: EnvComponentConfigItem }>,
    ) {
      state.config[component] = item;
    },
    setModuleConfigStatus(
      state: CurrentState,
      {
        payload: { module, status },
      }: DvaAction<{ module: EnvComponentModule; status: EnvComponentModuleConfigStatus }>,
    ) {
      state.moduleConfigStatus[module] = status;
    },
  },
  effects: {
    *getEnvironments(
      { payload: { force = false } }: DvaAction<{ force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      const environments: IEnvironments = purifyObject(
        // @ts-ignore
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
      return (yield put({
        type: 'getEnvironments',
        payload: {},
      })) as IEnvironments;
    },
    *installPython(
      { payload: { force = false } }: DvaAction<{ force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installPython, force);
      return (yield put({
        type: 'getEnvironments',
        payload: {},
      })) as IEnvironments;
    },
    *installCpplint(
      { payload: { force = false } }: DvaAction<{ force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installCpplint, force);
      return (yield put({
        type: 'getEnvironments',
        payload: {},
      })) as IEnvironments;
    },
    *installVSCode(
      { payload: { force = false } }: DvaAction<{ force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installVSCode, force);
      return (yield put({
        type: 'getEnvironments',
        payload: {},
      })) as IEnvironments;
    },
    *installVsix(
      {
        payload: { vsixId, force = false },
      }: DvaAction<{ vsixId: SupportedVSIXId; force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installVsix, vsixId, force);
      return (yield put({
        type: 'getEnvironments',
        payload: {},
      })) as IEnvironments;
    },
  },
};
