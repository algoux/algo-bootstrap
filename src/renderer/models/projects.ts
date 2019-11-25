import { DvaSagaEffect } from '@/utils/dva';
import sm from '@/utils/modules';
import localStorage from '@/utils/localStorage';
import LsKeys from '@/configs/lsKeys';

type CurrentState = IProjectsState;

function genInitialState(): CurrentState {
  return {
    list: [],
  };
}

export default {
  state: genInitialState(),
  reducers: {
    setProjects(state: CurrentState, { payload: { list } }: DvaAction<Pick<CurrentState, 'list'>>) {
      localStorage.set(LsKeys.projects, list);
      state.list = list;
    },
  },
  effects: {
    * getProjects({ payload: {} }: DvaAction<{}>, { call, put }: DvaSagaEffect) {
      const list = localStorage.get<IProject[]>(LsKeys.projects) || [];
      yield put({
        type: 'setProjects',
        payload: {
          list,
        },
      });
      return list;
    },
    * addProject({ payload: project }: DvaAction<IProject>, { put, select }: DvaSagaEffect) {
      const list: IProject[] = yield select(state => state.projects.list);
      if (list.find(p => p.id === project.id)) {
        return;
      }
      const newList = [...list];
      newList.push(project);
      yield put({
        type: 'setProjects',
        payload: {
          list: newList,
        },
      });
    },
    * deleteProject({ payload: { projectId } }: DvaAction<{ projectId: IProject['id'] }>, { put, select }: DvaSagaEffect) {
      const list: IProject[] = yield select(state => state.projects.list);
      const newList = list.filter(project => project.id !== projectId);
      yield put({
        type: 'setProjects',
        payload: {
          list: newList,
        },
      });
    },
  },
};
