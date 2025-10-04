import { createLogger } from 'redux-logger';
import track from './utils/track';

let extraConfig = {};

if (process.env.NODE_ENV === 'development') {
  extraConfig = {
    onAction: createLogger(),
  };
}

export const dva = {
  config: {
    onError(e: ErrorEvent) {
      // e.preventDefault();
      // logRenderer.error('[app.onError]', e);
    },
    ...extraConfig,
  },
};

track.init();
