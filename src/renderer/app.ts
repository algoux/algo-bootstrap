import { createLogger } from 'redux-logger';

export const dva = {
  config: {
    onError(err: ErrorEvent) {
      err.preventDefault();
      console.error(err.message);
    },
    onAction: createLogger(),
  },
};
