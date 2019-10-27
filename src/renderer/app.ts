import { createLogger } from 'redux-logger';
import { logRenderer } from '../common/utils/logger';

let extraConfig = {};

if (process.env.NODE_ENV === 'development') {
  extraConfig = {
    onAction: createLogger(),
  };
}

export const dva = {
  config: {
    onError(e: ErrorEvent) {
      e.preventDefault();
      logRenderer.error('[app.onError]', e);
    },
    ...extraConfig,
  },
};
