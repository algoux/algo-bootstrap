import log from 'electron-log';
import { purifyObject } from './format';

const genLogger = (type: string, f: (...params: any) => void) => (...params: any[]) => {
  f(type, ...params.map(param => purifyObject(param)));
};

const genAllLoggers = (type: string) => ({
  info: genLogger(type, log.info),
  warn: genLogger(type, log.warn),
  error: genLogger(type, log.error),
  verbose: genLogger(type, log.verbose),
  debug: genLogger(type, log.debug),
  silly: genLogger(type, log.silly),
});

export const logMain = genAllLoggers('[main]');
export const logProcess = genAllLoggers('[process]');
export const logRenderer = genAllLoggers('[renderer]');
