import { History } from 'history';
import track from '@/utils/track';

type CurrentState = IGlobalState;

function genInitialState(): CurrentState {
  return {};
}

export default {
  state: genInitialState(),
  reducers: {},
  effects: {},
  subscriptions: {
    setup({ dispatch, history }: { dispatch: Function; history: History }) {
      return history.listen((location) => {
        track.pageview(location.pathname);
      });
    },
  },
};
