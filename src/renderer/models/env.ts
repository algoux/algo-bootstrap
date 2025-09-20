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
      { payload: { moduleConfigStatus } }: DvaAction<Pick<CurrentState, 'moduleConfigStatus'>>,
    ) {
      state.moduleConfigStatus = moduleConfigStatus;
    },
    setModuleConfigStatusItem(
      state: CurrentState,
      {
        payload: { module, status },
      }: DvaAction<{ module: EnvComponentModule; status: EnvComponentModuleConfigStatus }>,
    ) {
      state.moduleConfigStatus[module] = status;
    },
    resetAllModuleConfigStatus(state: CurrentState, { payload: {} }: DvaAction<{}>) {
      state.moduleConfigStatus = {
        [EnvComponentModule.c_cpp]: EnvComponentModuleConfigStatus.PENDING,
        [EnvComponentModule.python]: EnvComponentModuleConfigStatus.PENDING,
        [EnvComponentModule.vscode]: EnvComponentModuleConfigStatus.PENDING,
        [EnvComponentModule.extensions]: EnvComponentModuleConfigStatus.PENDING,
        [EnvComponentModule.magic]: EnvComponentModuleConfigStatus.PENDING,
      };
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
    // no need any param
    *initModuleConfigStatusByConfig(
      { payload }: DvaAction<{}>,
      { call, put, select }: DvaSagaEffect,
    ) {
      const env: IEnvironments = yield select((state: IState) => state.env.environments);
      const config: EnvComponentConfig = yield select((state: IState) => state.env.config);
      const cppConfig = config[EnvComponent.c_cpp];
      const pythonConfig = config[EnvComponent.python];
      const vscodeConfig = config[EnvComponent.vscode];
      const extensionsConfig = config[EnvComponent.basicExtensions];
      const codeStyleExtensionsConfig = config[EnvComponent.codeStyleExtensions];
      const languagePackagesConfig = config[EnvComponent.languagePackages];

      const needProcess = (action: EnvComponentAction) => {
        return [
          EnvComponentAction.INSTALL,
          EnvComponentAction.UPDATE,
          EnvComponentAction.REINSTALL,
          // EnvComponentAction.SWITCH_INSTALLED,
        ].includes(action);
      };

      const moduleConfigStatus: Record<EnvComponentModule, EnvComponentModuleConfigStatus> = {
        [EnvComponentModule.c_cpp]: !needProcess(cppConfig.action)
          ? EnvComponentModuleConfigStatus.DONE
          : EnvComponentModuleConfigStatus.PENDING,
        [EnvComponentModule.python]: !needProcess(pythonConfig.action)
          ? EnvComponentModuleConfigStatus.DONE
          : EnvComponentModuleConfigStatus.PENDING,
        [EnvComponentModule.vscode]: !needProcess(vscodeConfig.action)
          ? EnvComponentModuleConfigStatus.DONE
          : EnvComponentModuleConfigStatus.PENDING,
        [EnvComponentModule.extensions]:
          !needProcess(extensionsConfig.action) &&
          !needProcess(codeStyleExtensionsConfig.action) &&
          !needProcess(languagePackagesConfig.action)
            ? EnvComponentModuleConfigStatus.DONE
            : EnvComponentModuleConfigStatus.PENDING,
        [EnvComponentModule.magic]: env.vscodeProfile.installed
          ? EnvComponentModuleConfigStatus.DONE
          : EnvComponentModuleConfigStatus.PENDING,
      };

      yield put({
        type: 'setModuleConfigStatus',
        payload: { moduleConfigStatus },
      });
    },
    *installGcc(
      { payload: { filename, force = false } }: DvaAction<{ filename?: string; force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installGcc, { filename, force });
      return (yield put({
        type: 'getEnvironments',
        payload: {},
      })) as IEnvironments;
    },
    *installPython(
      { payload: { filename, force = false } }: DvaAction<{ filename?: string; force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installPython, { filename, force });
      return (yield put({
        type: 'getEnvironments',
        payload: {},
      })) as IEnvironments;
    },
    // *installCpplint(
    //   { payload: { force = false } }: DvaAction<{ force?: boolean }>,
    //   { call, put }: DvaSagaEffect,
    // ) {
    //   yield call(sm.envInstaller.installCpplint, force);
    //   return (yield put({
    //     type: 'getEnvironments',
    //     payload: {},
    //   })) as IEnvironments;
    // },
    *installVSCode(
      { payload: { filename, force = false } }: DvaAction<{ filename: string; force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installVSCode, { filename, force });
      return (yield put({
        type: 'getEnvironments',
        payload: {},
      })) as IEnvironments;
    },
    *installVsix(
      {
        payload: { vsixId, filename, force = false, fetchEnvironments = false },
      }: DvaAction<{
        vsixId: SupportedVSIXId;
        filename: string;
        force?: boolean;
        fetchEnvironments?: boolean;
      }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installVsix, { vsixId, filename, force, fetchEnvironments });
      return (yield put({
        type: 'getEnvironments',
        payload: {},
      })) as IEnvironments;
    },
    *installVsixes(
      {
        payload: { vsixes, force = false },
      }: DvaAction<{ vsixes: { vsixId: SupportedVSIXId; filename: string }[]; force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installVsixes, { vsixes, force });
      return (yield put({
        type: 'getEnvironments',
        payload: {},
      })) as IEnvironments;
    },
    *installCppcheck(
      {
        payload: { srcFileName, terminalId, force = false },
      }: DvaAction<{ srcFileName: string; terminalId?: string; force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installCppcheckFromSrc, { srcFileName, terminalId, force });
      return (yield put({
        type: 'getEnvironments',
        payload: {},
      })) as IEnvironments;
    },
    *installCpplint(
      {
        payload: { srcFileName, terminalId, force = false },
      }: DvaAction<{ srcFileName: string; terminalId?: string; force?: boolean }>,
      { call, put }: DvaSagaEffect,
    ) {
      yield call(sm.envInstaller.installCpplintV2FromSrc, { srcFileName, terminalId, force });
      return (yield put({
        type: 'getEnvironments',
        payload: {},
      })) as IEnvironments;
    },
    *injectMagic(
      {
        payload: { vsixIds, gccAlt },
      }: DvaAction<{
        vsixIds: SupportedVSIXId[];
        gccAlt?: { command: string; path: string; type: 'gcc' | 'clang' };
      }>,
      { call, put, take }: DvaSagaEffect,
    ) {
      const res: { hasScriptError: boolean } = yield call(sm.vsc.injectMagic, { vsixIds, gccAlt });
      yield put({
        type: 'getEnvironments',
        payload: {},
      });
      yield take('getEnvironments/@@end');
      return res;
    },
  },
};
