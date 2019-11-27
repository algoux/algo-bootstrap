import { SpawnOptions as _SpawnOptions, ExecFileOptions as _ExecFileOptions } from 'child_process';
import { spawn as _spawn, execFile as _execFile, PromisifySpawnOptions, Output } from 'promisify-child-process';
import { logProcess } from 'common/utils/logger';
import constants from 'common/configs/constants';
import sudo from 'sudo-prompt';
import * as path from 'path';
import { isMac } from './platform';

const SHELL_TIMEOUT = 20 * 1000;

const commonSpawnOptions = {
  encoding: 'utf8',
  windowsHide: true,
  timeout: SHELL_TIMEOUT,
  shell: true,
};

const commonExecFileOptions = {
  encoding: 'utf8',
  windowsHide: true,
};

const commonSudoExecOptions: SudoExecOptions = {
  name: constants.appName,
  icns: isMac ? path.join(__static, 'icon.icns') : undefined,
};

export type SpawnOptions = PromisifySpawnOptions;
export type ExecFileOptions = _ExecFileOptions;
export type SpawnOutput = Output;
export type ExecFileOutput = Output;
export type ChildProcessOutput = string | Buffer | null | undefined;

export interface SudoExecOptions {
  name?: string;
  icns?: string;
  env?: NodeJS.ProcessEnv;
}

export interface SudoExecResult {
  stdout: string;
  stderr: string;
}

export function spawn(type: string, cmd: string, args: string[] = [], extraOptions: SpawnOptions = {}) {
  logProcess.info(type, '[spawn.start]', cmd, args.join(' '));
  const __start = Date.now();
  return _spawn(cmd, args, {
    ...commonSpawnOptions,
    ...extraOptions,
  }).then(r => {
    logProcess.info(
      type, `[spawn.done ${Date.now() - __start + 'ms'}]`, cmd, args.join(' '),
      '\nstdout:', r.stdout,
      '\nstderr:', r.stderr,
    );
    return r;
  }).catch(e => {
    logProcess.error(
      type, `[spawn.error ${Date.now() - __start + 'ms'}]`, cmd, args.join(' '),
      '\nerror:', e,
      '\ncode:', e.code,
      '\nsignal:', e.signal,
      '\nstdout:', e.stdout,
      '\nstderr:', e.stderr,
    );
    throw e;
  });
}

export function execFile(type: string, file: string, args: string[] = [], extraOptions: ExecFileOptions = {}) {
  logProcess.info(type, '[execFile.start]', file, args.join(' '));
  const __start = Date.now();
  return _execFile(file, args, {
    ...commonExecFileOptions,
    ...extraOptions,
  }).then(r => {
    logProcess.info(
      type, `[execFile.done ${Date.now() - __start + 'ms'}]`, file, args.join(' '),
      '\nstdout:', r.stdout,
      '\nstderr:', r.stderr,
    );
    return r;
  }).catch(e => {
    logProcess.error(
      type, `[execFile.error ${Date.now() - __start + 'ms'}]`, file, args.join(' '),
      '\nerror:', e,
      '\ncode:', e.code,
      '\nsignal:', e.signal,
      '\nstdout:', e.stdout,
      '\nstderr:', e.stderr,
    );
    throw e;
  });
}

export async function sudoExec(type: string, cmd: string, extraOptions: SudoExecOptions = {}): Promise<SudoExecResult> {
  logProcess.info(type, '[sudoExec.start]', cmd);
  const __start = Date.now();
  return new Promise((resolve, reject) => {
    sudo.exec(
      cmd,
      {
        ...commonSudoExecOptions,
        ...extraOptions,
      },
      function (e: string, stdout: string, stderr: string) {
        if (e) {
          logProcess.error(
            type, `[sudoExec.error ${Date.now() - __start + 'ms'}]`, cmd,
            '\nerror:', e,
          );
          reject(e);
        } else {
          logProcess.info(
            type, `[sudoExec.done ${Date.now() - __start + 'ms'}]`, cmd,
            '\nstdout:', stdout,
            '\nstderr:', stderr,
          );
          resolve({
            stdout,
            stderr,
          });
        }
      }
    );
  });
}
