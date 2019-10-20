import { spawn as _spawn, PromisifySpawnOptions, Output } from 'promisify-child-process';
import { logProcess } from 'common/utils/logger';

const SHELL_TIMEOUT = 10 * 1000;

const commonExecOptions = {
  encoding: 'utf8',
  timeout: SHELL_TIMEOUT,
  windowsHide: true,
  shell: true,
};

export type SpawnOptions = PromisifySpawnOptions;
export type SpawnOutput = Output;
export type ChildProcessOutput = string | Buffer | null | undefined;

export function spawn(type: string, cmd: string, args: string[], extraOptions: SpawnOptions = {}) {
  logProcess.info(type, '[spawn.start]', cmd, args.join(' '));
  return _spawn(cmd, args, {
    ...commonExecOptions,
    ...extraOptions,
  }).then(r => {
    logProcess.info(
      type, '[spawn.done]', cmd, args.join(' '),
      '\nstdout:', r.stdout,
      '\nstderr:', r.stderr
    );
    return r;
  }).catch(e => {
    logProcess.error(
      type, '[spawn.error]', cmd, args.join(' '),
      '\nerror:', e,
      '\ncode:', e.code,
      '\nsignal:', e.signal,
      '\nstdout:', e.stdout,
      '\nstderr:', e.stderr
    );
    throw e;
  });
}
