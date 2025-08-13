import log from 'electron-log/main';
import { genAllLoggers } from 'common/utils/logger';

log.initialize();

export const logMain = genAllLoggers(log, '[main]');
export const logProcess = genAllLoggers(log, '[process]');
export { log };
