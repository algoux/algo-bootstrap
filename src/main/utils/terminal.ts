import { spawn, IPty } from 'node-pty';
import { EventEmitter } from 'events';
import { logMain, logProcess } from './logger';
import { ipcMain as ipc } from 'electron-better-ipc';
import IPCKeys from 'common/configs/ipc';
import util from 'util';

export interface TerminalOptions {
  id: string;
}

export interface TerminalOutput {
  data: string;
  timestamp: number;
}

export interface ExecResult {
  output: string;
  exitCode: number;
  signal?: number;
}

export class TerminalExecError extends Error {
  output: string;
  exitCode: number;
  signal?: number;

  constructor(options: { output: string; exitCode: number; signal?: number }) {
    const message = `Command exited with code ${options.exitCode}, signal: ${options.signal}`;
    super(message);
    this.output = options.output;
    this.exitCode = options.exitCode;
    this.signal = options.signal;
  }
}

export type CommandExecOptions = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  cols?: number;
  rows?: number;
  encoding?: string;
};

export class CommandTerminal extends EventEmitter {
  private pty?: IPty;
  private execStartTime = 0;
  public outputHistory: TerminalOutput[] = [];
  public buf = '';
  public executed = false;
  public closed = false;

  public constructor(public readonly id: string) {
    super();
  }

  exec(cmd: string, args: string[] = [], opt: CommandExecOptions = {}): Promise<ExecResult> {
    if (this.pty || this.executed) {
      return Promise.reject(new Error('A command is already running or has been executed'));
    }
    this.executed = true;
    const env = { ...(process.env as NodeJS.ProcessEnv), ...(opt.env || {}) };
    this.execStartTime = Date.now();
    this.pty = spawn(cmd, args, {
      name: 'xterm-color',
      cols: opt.cols ?? 80,
      rows: opt.rows ?? 24,
      cwd: opt.cwd ?? process.cwd(),
      env,
      encoding: (opt.encoding as any) ?? 'utf8',
    });

    this.buf = '';
    this.outputHistory = [];

    return new Promise<ExecResult>((resolve, reject) => {
      this.pty!.onData((d) => {
        this.buf += d;
        const output: TerminalOutput = {
          data: d,
          timestamp: Date.now(),
        };
        this.outputHistory.push(output);
        this.emit('data', output);
      });

      this.pty!.onExit(({ exitCode, signal }) => {
        const execDuration = Date.now() - this.execStartTime;
        const result: ExecResult = { output: this.buf, exitCode, signal };
        this.closed = true;
        logProcess.info(
          '[CommandTerminal]',
          `[exec.done ${execDuration + 'ms'}]`,
          cmd,
          args.join(' '),
          '\noutput:',
          result.output,
          '\nexitCode:',
          result.exitCode,
          '\nsignal:',
          result.signal,
        );
        try {
          this.pty?.kill();
        } catch {}
        this.pty = undefined;

        if (exitCode === 0) {
          resolve(result);
          this.emit('closed', { exitCode, signal, time: execDuration });
        } else {
          const err = new TerminalExecError({ output: this.buf, exitCode, signal });
          reject(err);
          this.emit('closed', { exitCode, signal, error: err.message, time: execDuration });
        }
      });
    });
  }

  public resize(cols: number, rows: number): void {
    if (this.pty) {
      this.pty.resize(cols, rows);
    }
  }

  public destroy(): void {
    if (this.pty) {
      this.pty.kill();
      this.pty = undefined;
    }
  }

  [util.inspect.custom](depth, options) {
    const head = options.stylize(`${this.constructor.name}<${this.id}>`, 'special');
    if (depth < 0) return head;
    const inner = util.inspect(
      {
        outputHistory: this.outputHistory,
        buf: this.buf,
        executed: this.executed,
        closed: this.closed,
      },
      { ...options, depth: depth - 1 },
    );
    return `${head} ${inner}`;
  }
}

export class TerminalManager {
  private cmdTerminals = new Map<string, CommandTerminal>();
  private static instance: TerminalManager;

  private constructor() {
    this.setupIpcHandlers();
  }

  public static getInstance(): TerminalManager {
    if (!TerminalManager.instance) {
      TerminalManager.instance = new TerminalManager();
    }
    return TerminalManager.instance;
  }

  private setupIpcHandlers(): void {
    ipc.answerRenderer(IPCKeys.terminalConnect, async (options, bw) => {
      const terminalId = options.terminalId;
      const terminal = this.cmdTerminals.get(terminalId);
      if (!terminal) {
        return {
          terminalId,
          connected: false,
          data: '',
        };
      }

      return {
        terminalId,
        connected: true,
        data: terminal.outputHistory.map((output) => output.data).join(''),
      };
    });
  }

  public createCommandTerminal(options: TerminalOptions): CommandTerminal {
    if (this.cmdTerminals.has(options.id)) {
      throw new Error(`Terminal with ID ${options.id} already exists`);
    }

    const terminal = new CommandTerminal(options.id);
    this.cmdTerminals.set(options.id, terminal);

    terminal.on('data', (output) => {
      this.emitDataToRenderer(options.id, output);
    });

    terminal.on('closed', ({ exitCode, signal, error, time }) => {
      this.cmdTerminals.delete(options.id);
      this.emitClosedToRenderer(options.id, { exitCode, signal, error, time });
      this.destroyCommandTerminal(options.id);
    });

    logMain.info(`[TerminalManager] terminal ${options.id} created`);
    return terminal;
  }

  public execCommand(
    terminalId: string,
    cmd: string,
    args: string[] = [],
    opt: CommandExecOptions = {},
  ): Promise<ExecResult> {
    const terminal = this.cmdTerminals.get(terminalId);
    if (!terminal) {
      throw new Error(`Terminal ${terminalId} not found`);
    }
    return terminal.exec(cmd, args, opt);
  }

  public getCommandTerminal(terminalId: string): CommandTerminal | undefined {
    return this.cmdTerminals.get(terminalId);
  }

  public destroyCommandTerminal(terminalId: string): boolean {
    const terminal = this.cmdTerminals.get(terminalId);
    if (terminal) {
      terminal.destroy();
      logMain.info(`[TerminalManager] terminal ${terminalId} destroyed by manager`);
      return true;
    }
    return false;
  }

  private emitDataToRenderer(terminalId: string, output: TerminalOutput): void {
    try {
      const mainWindow = global.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
        ipc.callRenderer(mainWindow, IPCKeys.terminalOutput, {
          terminalId,
          data: output.data,
        });
      }
    } catch (error) {
      logMain.error(
        `[TerminalManager] failed to emit terminal ${terminalId} output to renderer:`,
        error,
      );
    }
  }

  private emitClosedToRenderer(
    terminalId: string,
    data: { exitCode: number; signal: number; error?: string; time: number },
  ): void {
    try {
      const mainWindow = global.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
        ipc.callRenderer(mainWindow, IPCKeys.terminalClosed, {
          terminalId,
          ...data,
        });
      }
    } catch (error) {
      logMain.error(`[TerminalManager] failed to emit terminal ${terminalId} closed:`, error);
    }
  }
}

export const terminalManager = TerminalManager.getInstance();
