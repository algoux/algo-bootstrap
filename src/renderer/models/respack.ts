import { DvaAction, DvaSagaEffect } from '@/utils/dva';
import sm from '@/utils/modules';
import { purifyObject } from '@/../common/utils/format';

type CurrentState = IRespackState;

function genInitialState(): CurrentState {
  return {
    hasRespack: false,
    manifest: null,
  };
}

export default {
  state: genInitialState(),
  reducers: {
    setHasRespack(state: CurrentState, { payload: { hasRespack } }: DvaAction<Pick<CurrentState, 'hasRespack'>>) {
      state.hasRespack = purifyObject(hasRespack);
    },
    setManifest(state: CurrentState, { payload: { manifest } }: DvaAction<Pick<CurrentState, 'manifest'>>) {
      state.manifest = purifyObject(manifest);
    },
  },
  effects: {
    * getHasRespack({ payload: {} }: DvaAction<{}>, { call, put }: DvaSagaEffect) {
      const hasRespack: boolean = yield call(sm.Respack.hasLocalRespack);
      yield put({
        type: 'setHasRespack',
        payload: {
          hasRespack,
        },
      });
      return hasRespack;
    },
    * getManifest({ payload: {} }: DvaAction<{}>, { call, put }: DvaSagaEffect) {
      let manifest: IRespackManifest | null = null;
      try {
        manifest = yield call(sm.Respack.readLocalManifest);
      } catch (e) { }
      yield put({
        type: 'setManifest',
        payload: {
          manifest,
        },
      });
      return manifest;
    },
    * importRespack({ payload: { respackPath } }: DvaAction<{ respackPath: string }>, { call, put }: DvaSagaEffect) {
      const respack = new sm.Respack(respackPath);
      try {
        yield call(respack.loadManifest);
        yield call(respack.validate);
      } catch (e) {
        const err = e;
        err.msg = '验证资源包失败';
        throw err;
      }
      try {
        yield call(respack.extract);
      } catch (e) {
        const err = e;
        err.msg = '应用资源包失败';
        throw err;
      }
      yield put({
        type: 'getHasRespack',
        payload: {},
      });
      yield put({
        type: 'getManifest',
        payload: {},
      });
    },
  },
};
