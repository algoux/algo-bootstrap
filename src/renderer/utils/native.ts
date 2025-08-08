import sm from './modules';
import { getCurrentWindow } from '@electron/remote';

export const windowProgress = {
  start: () =>
    sm.platform.isWindows && getCurrentWindow().setProgressBar(0, { mode: 'indeterminate' }),
  end: () => sm.platform.isWindows && getCurrentWindow().setProgressBar(-1),
};
