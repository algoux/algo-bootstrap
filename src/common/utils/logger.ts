import { Logger } from 'electron-log';
// import { purifyObject } from './format';

const genLogger =
  (type: string, f: (...params: any) => void) =>
  (...params: any[]) =>
    f(type, ...params);

export const genAllLoggers = (logger: Logger, type: string) => ({
  info: genLogger(type, logger.info),
  warn: genLogger(type, logger.warn),
  error: genLogger(type, logger.error),
  verbose: genLogger(type, logger.verbose),
  debug: genLogger(type, logger.debug),
  silly: genLogger(type, logger.silly),
});
