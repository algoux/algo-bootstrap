type ipcKeys = typeof import('common/configs/ipc').default;

// download
// @see https://github.com/theogravity/electron-dl-manager
interface IIpcDownloadInput {
  requests: {
    url: string;
    saveAsFilename?: string;
    directory?: string; /** PathKey */
  }[];
  overwrite?: boolean;
  errorTitle?: string;
  errorMessage?: string;
}

type IIpcDownloadOutput = {
  downloadTaskId: number;
  downloadIds: string[];
};

// downloadProgress (every url)
interface IIpcDownloadProgressInput {
  downloadTaskId: number;
  downloadId: string;
  itemIndex: number;
  percent: number;
  received: number;
  total: number;
  speed: number;
}

type IIpcDownloadProgressOutput = void;

// downloadTotalProgress
interface IIpcDownloadTotalProgressInput {
  downloadTaskId: number;
  percent: number;
  received: number;
  total: number;
  speed: number;
}

type IIpcDownloadProgressOutput = void;

// downloadDone (every url)
interface IIpcDownloadDoneInput {
  downloadTaskId: number;
  downloadId: string;
  itemIndex: number;
  filename: string;
  time: number;
  size: number;
  speed: number;
}

type IIpcDownloadDoneOutput = void;

// downloadError (every url)
interface IIpcDownloadErrorInput {
  downloadTaskId: number;
  downloadId: string;
  itemIndex: number;
  error?: string;
}

type IIpcDownloadErrorOutput = void;


type IPCDownloadItemStatus = 'pending' | 'downloading' | 'done' | 'error' | 'cancelled';

// downloadFinished
interface IIpcDownloadFinishedInput {
  downloadTaskId: number;
  itemStatuses: DownloadItemStatus[];
}

type IIpcDownloadFinishedOutput = void;

declare module 'electron-better-ipc' {
  export interface MainProcessIpc {
    answerRenderer(
      channel: ipcKeys['getResPack'],
      cb: (data: string, bw: Electron.BrowserWindow) => Promise<IEnvironments>,
    ): () => void;
    answerRenderer(
      channel: ipcKeys['download'],
      cb: (data: IIpcDownloadInput, bw: Electron.BrowserWindow) => Promise<IIpcDownloadOutput>,
    ): () => void;

    callRenderer(
      bw: Electron.BrowserWindow,
      channel: ipcKeys['downloadProgress'],
      data: IIpcDownloadProgressInput,
    ): Promise<IIpcDownloadProgressOutput>;
    callRenderer(
      bw: Electron.BrowserWindow,
      channel: ipcKeys['downloadTotalProgress'],
      data: IIpcDownloadTotalProgressInput,
    ): Promise<IIpcDownloadTotalProgressOutput>;
    callRenderer(
      bw: Electron.BrowserWindow,
      channel: ipcKeys['downloadDone'],
      data: IIpcDownloadDoneInput,
    ): Promise<IIpcDownloadDoneOutput>;
    callRenderer(
      bw: Electron.BrowserWindow,
      channel: ipcKeys['downloadFinished'],
      data: IIpcDownloadFinishedInput,
    ): Promise<IIpcDownloadFinishedOutput>;
    callRenderer(
      bw: Electron.BrowserWindow,
      channel: ipcKeys['downloadError'],
      data: IIpcDownloadErrorInput,
    ): Promise<IIpcDownloadErrorOutput>;
  }

  export interface RendererProcessIpc {
    callMain(channel: ipcKeys['getResPack'], data: string): Promise<IEnvironments>;
    callMain(channel: ipcKeys['download'], data: IIpcDownloadInput): Promise<IIpcDownloadOutput>;

    answerMain(
      channel: ipcKeys['downloadProgress'],
      cb: (data: IIpcDownloadProgressInput) => Promise<IIpcDownloadProgressOutput>,
    ): () => void;
    answerMain(
      channel: ipcKeys['downloadTotalProgress'],
      cb: (data: IIpcDownloadTotalProgressInput) => Promise<IIpcDownloadTotalProgressOutput>,
    ): () => void;
    answerMain(
      channel: ipcKeys['downloadDone'],
      cb: (data: IIpcDownloadDoneInput) => Promise<IIpcDownloadDoneOutput>,
    ): () => void;
    answerMain(
      channel: ipcKeys['downloadFinished'],
      cb: (data: IIpcDownloadFinishedInput) => Promise<IIpcDownloadFinishedOutput>,
    ): () => void;
    answerMain(
      channel: ipcKeys['downloadError'],
      cb: (data: IIpcDownloadErrorInput) => Promise<IIpcDownloadErrorOutput>,
    ): () => void;
  }

  export const ipcMain: MainProcessIpc;
  export const ipcRenderer: RendererProcessIpc;
}
