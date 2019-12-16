import { History } from 'history';
import sm from '@/utils/modules';

type CurrentState = IGlobalState;

function genInitialState(): CurrentState {
  return {};
}

export default {
  state: genInitialState(),
  reducers: {
  },
  effects: {
  },
  subscriptions: {
    setup({ dispatch, history }: { dispatch: Function, history: History }) {
      return history.listen((location) => {
        sm.track.pageview(location.pathname);
      });
    },
  },
};
