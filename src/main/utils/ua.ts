import * as os from 'os';
import uag from 'useragent-generator';
import { isMac, isWindows } from './platform';
import { app } from 'electron';

// @see https://en.wikipedia.org/wiki/Darwin_%28operating_system%29#Release_history
const macKernelMap: Record<string, string> = {
  '10.0': '10.6.0',
  '10.8': '10.6.8',
  '11.0.0': '10.7.0',
  '11.4.2': '10.7.5',
  '12.0.0': '10.8.0',
  '12.6.0': '10.8.5',
  '13.0.0': '10.9.0',
  '13.4.0': '10.9.5',
  '14.0.0': '10.10.0',
  '14.5.0': '10.10.5',
  '15.0.0': '10.11.0',
  '15.6.0': '10.11.6',
  '16.0.0': '10.12.0',
  '16.5.0': '10.12.4',
  '16.6.0': '10.12.6',
  '17.0.0': '10.13.0',
  '17.5.0': '10.13.4',
  '17.6.0': '10.13.5',
  '17.7.0': '10.13.6',
  '18.0.0': '10.14.0',
  '18.2.0': '10.14.1',
  '19.0.0': '10.15.0',
  '19.2.0': '10.15.0',
};

export function genUA() {
  const arch = os.arch();
  const release = os.release();
  let osVersion = '';
  if (isMac) {
    const ver = macKernelMap[release] || '';
    osVersion = `Macintosh; Intel Mac OS X ${ver.replace(/\./g, '_')}`;
  } else if (isWindows) {
    if (arch === 'x64') {
      osVersion = `Windows NT ${release}; Win64; x64`;
    } else {
      osVersion = `Windows NT ${release}`;
    }
  }
  return uag.chrome({
    version: process.versions.chrome,
    os: osVersion,
  }) + ` Electron/${process.versions.electron} AlgoBootstrap/${app.getVersion()}`;
}
