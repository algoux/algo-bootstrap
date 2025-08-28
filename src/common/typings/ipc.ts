import { PathKey } from 'common/configs/paths';

// download
export interface IIpcDownloadRequest {
  url: string;
  saveAsFilename?: string;
  /** PathKey or absolute path */
  directory?: PathKey | string;
}

export interface IIpcDownloadInput {
  requests: IIpcDownloadRequest[];
  // @see https://github.com/theogravity/electron-dl-manager
  overwrite?: boolean;
  errorTitle?: string;
  errorMessage?: string;
}

export interface IIpcDownloadOutput {
  downloadTaskId: number;
  downloadIds: string[];
}

// downloadProgress (every url)
export interface IIpcDownloadProgressInput {
  downloadTaskId: number;
  downloadId: string;
  itemIndex: number;
  percent: number;
  received: number;
  total: number;
  speed: number;
}

export type IIpcDownloadProgressOutput = void;

// downloadTotalProgress
export interface IIpcDownloadTotalProgressInput {
  downloadTaskId: number;
  percent: number;
  received: number;
  total: number;
  speed: number;
}

export type IIpcDownloadTotalProgressOutput = void;

// downloadDone (every url)
export interface IIpcDownloadDoneInput {
  downloadTaskId: number;
  downloadId: string;
  itemIndex: number;
  filename: string;
  time: number;
  size: number;
  speed: number;
}

export type IIpcDownloadDoneOutput = void;

// downloadError (every url)
export interface IIpcDownloadErrorInput {
  downloadTaskId: number;
  downloadId: string;
  itemIndex: number;
  error?: string;
}

export type IIpcDownloadErrorOutput = void;

export type IPCDownloadItemStatus = 'pending' | 'downloading' | 'done' | 'error' | 'cancelled';

// downloadFinished
export interface IIpcDownloadFinishedInput {
  downloadTaskId: number;
  itemStatuses: IPCDownloadItemStatus[];
}

export type IIpcDownloadFinishedOutput = void;

// terminalConnect
export interface IIpcTerminalConnectInput {
  terminalId: string;
}

export interface IIpcTerminalConnectOutput {
  terminalId: string;
  connected: boolean;
  data: string;
}

// terminalOutput

export interface IIpcTerminalOutputInput {
  terminalId: string;
  data: string;
}

export type IIpcTerminalOutputOutput = void;

// terminalClosed
export interface IIpcTerminalClosedInput {
  terminalId: string;
  exitCode: number;
  signal: number;
  error?: string;
  time: number;
}

export type IIpcTerminalClosedOutput = void;
