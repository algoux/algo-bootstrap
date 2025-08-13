import log from 'electron-log/renderer';
import { genAllLoggers } from 'common/utils/logger';

export const logRenderer = genAllLoggers(log, '[renderer]');
