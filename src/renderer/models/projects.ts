import { DvaSagaEffect } from '@/utils/dva';
import sm from '@/utils/modules';

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
      sm.appConf.set('projects', list);
      state.list = list;
    },
  },
  effects: {
    *getProjects({ payload: {} }: DvaAction<{}>, { call, put }: DvaSagaEffect) {
      const list = sm.appConf.get('projects') || [];
      yield put({
        type: 'setProjects',
        payload: {
          list,
        },
      });
      return list;
    },
    *addProject({ payload: project }: DvaAction<IProject>, { put, select }: DvaSagaEffect) {
      const list: IProject[] = yield select((state) => state.projects.list);
      const newList = list.filter((p) => p.id !== project.id);
      newList.push(project);
      yield put({
        type: 'setProjects',
        payload: {
          list: newList,
        },
      });
    },
    *accessProject(
      { payload: { id } }: DvaAction<{ id: IProject['id'] }>,
      { put, select }: DvaSagaEffect,
    ) {
      const list: IProject[] = yield select((state) => state.projects.list);
      const project = list.find((p) => p.id === id);
      if (project) {
        const newList = list.filter((p) => p.id !== id);
        newList.push(project);
        yield put({
          type: 'setProjects',
          payload: {
            list: newList,
          },
        });
      }
    },
    *deleteProject(
      { payload: { projectId } }: DvaAction<{ projectId: IProject['id'] }>,
      { put, select }: DvaSagaEffect,
    ) {
      const list: IProject[] = yield select((state) => state.projects.list);
      const newList = list.filter((p) => p.id !== projectId);
      yield put({
        type: 'setProjects',
        payload: {
          list: newList,
        },
      });
    },
  },
};
