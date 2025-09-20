import { IpcMain, IpcRenderer } from 'electron';
import 'electron-better-ipc';
import {
  IIpcDownloadInput,
  IIpcDownloadOutput,
  IIpcDownloadProgressInput,
  IIpcDownloadProgressOutput,
  IIpcDownloadTotalProgressInput,
  IIpcDownloadTotalProgressOutput,
  IIpcDownloadDoneInput,
  IIpcDownloadDoneOutput,
  IIpcDownloadFinishedInput,
  IIpcDownloadFinishedOutput,
  IIpcDownloadErrorInput,
  IIpcDownloadErrorOutput,
  IIpcTerminalConnectInput,
  IIpcTerminalConnectOutput,
  IIpcTerminalOutputInput,
  IIpcTerminalOutputOutput,
  IIpcTerminalClosedInput,
  IIpcTerminalClosedOutput,
  IIpcShowResetConfigDialogInput,
  IIpcShowResetConfigDialogOutput,
} from './ipc';

type IPCKeys = typeof import('common/configs/ipc').default;

declare module 'electron-better-ipc' {
  export interface MainProcessIpc extends IpcMain {
    answerRenderer(
      channel: IPCKeys['download'],
      cb: (data: IIpcDownloadInput, bw: Electron.BrowserWindow) => Promise<IIpcDownloadOutput>,
    ): () => void;
    answerRenderer(
      channel: IPCKeys['terminalConnect'],
      cb: (
        data: IIpcTerminalConnectInput,
        bw: Electron.BrowserWindow,
      ) => Promise<IIpcTerminalConnectOutput>,
    ): () => void;
    answerRenderer(
      channel: IPCKeys['showResetConfigDialog'],
      cb: (
        data: IIpcShowResetConfigDialogInput,
        bw: Electron.BrowserWindow,
      ) => Promise<IIpcShowResetConfigDialogOutput>,
    ): () => void;

    callRenderer(
      bw: Electron.BrowserWindow,
      channel: IPCKeys['downloadProgress'],
      data: IIpcDownloadProgressInput,
    ): Promise<IIpcDownloadProgressOutput>;
    callRenderer(
      bw: Electron.BrowserWindow,
      channel: IPCKeys['downloadTotalProgress'],
      data: IIpcDownloadTotalProgressInput,
    ): Promise<IIpcDownloadTotalProgressOutput>;
    callRenderer(
      bw: Electron.BrowserWindow,
      channel: IPCKeys['downloadDone'],
      data: IIpcDownloadDoneInput,
    ): Promise<IIpcDownloadDoneOutput>;
    callRenderer(
      bw: Electron.BrowserWindow,
      channel: IPCKeys['downloadFinished'],
      data: IIpcDownloadFinishedInput,
    ): Promise<IIpcDownloadFinishedOutput>;
    callRenderer(
      bw: Electron.BrowserWindow,
      channel: IPCKeys['downloadError'],
      data: IIpcDownloadErrorInput,
    ): Promise<IIpcDownloadErrorOutput>;
    callRenderer(
      bw: Electron.BrowserWindow,
      channel: IPCKeys['terminalOutput'],
      data: IIpcTerminalOutputInput,
    ): Promise<IIpcTerminalOutputOutput>;
    callRenderer(
      bw: Electron.BrowserWindow,
      channel: IPCKeys['terminalClosed'],
      data: IIpcTerminalClosedInput,
    ): Promise<IIpcTerminalClosedOutput>;
  }

  export interface RendererProcessIpc extends IpcRenderer {
    callMain(channel: IPCKeys['download'], data: IIpcDownloadInput): Promise<IIpcDownloadOutput>;
    callMain(
      channel: IPCKeys['terminalConnect'],
      data: IIpcTerminalConnectInput,
    ): Promise<IIpcTerminalConnectOutput>;
    callMain(
      channel: IPCKeys['showResetConfigDialog'],
      data: IIpcShowResetConfigDialogInput,
    ): Promise<IIpcShowResetConfigDialogOutput>;

    answerMain(
      channel: IPCKeys['downloadProgress'],
      cb: (data: IIpcDownloadProgressInput) => Promise<IIpcDownloadProgressOutput>,
    ): () => void;
    answerMain(
      channel: IPCKeys['downloadTotalProgress'],
      cb: (data: IIpcDownloadTotalProgressInput) => Promise<IIpcDownloadTotalProgressOutput>,
    ): () => void;
    answerMain(
      channel: IPCKeys['downloadDone'],
      cb: (data: IIpcDownloadDoneInput) => Promise<IIpcDownloadDoneOutput>,
    ): () => void;
    answerMain(
      channel: IPCKeys['downloadFinished'],
      cb: (data: IIpcDownloadFinishedInput) => Promise<IIpcDownloadFinishedOutput>,
    ): () => void;
    answerMain(
      channel: IPCKeys['downloadError'],
      cb: (data: IIpcDownloadErrorInput) => Promise<IIpcDownloadErrorOutput>,
    ): () => void;
    answerMain(
      channel: IPCKeys['terminalOutput'],
      cb: (data: IIpcTerminalOutputInput) => Promise<IIpcTerminalOutputOutput>,
    ): () => void;
    answerMain(
      channel: IPCKeys['terminalClosed'],
      cb: (data: IIpcTerminalClosedInput) => Promise<IIpcTerminalClosedOutput>,
    ): () => void;
  }
}
