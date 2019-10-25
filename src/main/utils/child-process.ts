import { ExecFileOptions } from 'child_process';
import { spawn as _spawn, execFile as _execFile, PromisifySpawnOptions, Output } from 'promisify-child-process';
import { logProcess } from 'common/utils/logger';

const SHELL_TIMEOUT = 10 * 1000;

const commonSpawnOptions = {
  encoding: 'utf8',
  timeout: SHELL_TIMEOUT,
  windowsHide: true,
  shell: true,
};

const commonExecFileOptions = {
  encoding: 'utf8',
  timeout: SHELL_TIMEOUT,
  windowsHide: true,
};

export type SpawnOptions = PromisifySpawnOptions;
export type ExecFileOptions = ExecFileOptions;
export type SpawnOutput = Output;
export type ExecFileOutput = Output;
export type ChildProcessOutput = string | Buffer | null | undefined;

export function spawn(type: string, cmd: string, args: string[], extraOptions: SpawnOptions = {}) {
  logProcess.info(type, '[spawn.start]', cmd, args.join(' '));
  return _spawn(cmd, args, {
    ...commonSpawnOptions,
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

export function execFile(type: string, file: string, args: string[], extraOptions: ExecFileOptions = {}) {
  logProcess.info(type, '[execFile.start]', file, args.join(' '));
  return _execFile(file, args, {
    ...commonExecFileOptions,
    ...extraOptions,
  }).then(r => {
    logProcess.info(
      type, '[execFile.done]', file, args.join(' '),
      '\nstdout:', r.stdout,
      '\nstderr:', r.stderr
    );
    return r;
  }).catch(e => {
    logProcess.error(
      type, '[execFile.error]', file, args.join(' '),
      '\nerror:', e,
      '\ncode:', e.code,
      '\nsignal:', e.signal,
      '\nstdout:', e.stdout,
      '\nstderr:', e.stderr
    );
    throw e;
  });
}
