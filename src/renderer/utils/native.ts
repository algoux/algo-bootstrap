import sm from './modules';
import { remote } from 'electron';

export const windowProgress = {
  start: () => sm.platform.isWindows && remote.getCurrentWindow().setProgressBar(0, { mode: 'indeterminate' }),
  end: () => sm.platform.isWindows && remote.getCurrentWindow().setProgressBar(-1),
};
