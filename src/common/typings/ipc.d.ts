type ipcKeys = typeof import('common/configs/ipc').default;

// download
// @see https://github.com/sindresorhus/electron-dl
interface IIpcDownloadInput {
  url: string
  saveAs?: boolean
  directory?: string
  filename?: string
  errorTitle: string
  errorMessage: string
  openFolderWhenDone?: boolean
  showBadge?: boolean
  /**
   * Clear the dir first (only if "directory" is specified).
   * @default false
   */
  clearDir?: boolean
}

type IIpcDownloadOutput = number

// downloadProgress
interface IIpcDownloadProgressInput {
  downloadTaskId: number
  percent: number
  received: number
  total: number
  speed: number
}

type IIpcDownloadProgressOutput = void

// downloadDone
interface IIpcDownloadDoneInput {
  downloadTaskId: number
  filename: string
  time: number
  size: number
  speed: number
}

type IIpcDownloadDoneOutput = void

// downloadError
interface IIpcDownloadErrorInput {
  downloadTaskId: number
  error?: string
}

type IIpcDownloadErrorOutput = void

declare module 'electron-better-ipc' {
  export interface MainProcessIpc {
    answerRenderer(channel: ipcKeys['getResPack'], cb: (data: string, bw: Electron.BrowserWindow) => Promise<IEnvironments>): () => void;
    answerRenderer(channel: ipcKeys['download'], cb: (data: IIpcDownloadInput, bw: Electron.BrowserWindow) => Promise<IIpcDownloadOutput>): () => void;

    callRenderer(bw: Electron.BrowserWindow, channel: ipcKeys['downloadProgress'], data: IIpcDownloadProgressInput): Promise<IIpcDownloadProgressOutput>;
    callRenderer(bw: Electron.BrowserWindow, channel: ipcKeys['downloadDone'], data: IIpcDownloadDoneInput): Promise<IIpcDownloadDoneOutput>;
    callRenderer(bw: Electron.BrowserWindow, channel: ipcKeys['downloadError'], data: IIpcDownloadErrorInput): Promise<IIpcDownloadErrorOutput>;
  }

  export interface RendererProcessIpc {
    callMain(channel: ipcKeys['getResPack'], data: string): Promise<IEnvironments>;
    callMain(channel: ipcKeys['download'], data: IIpcDownloadInput): Promise<IIpcDownloadOutput>;

    answerMain(channel: ipcKeys['downloadProgress'], cb: (data: IIpcDownloadProgressInput) => Promise<IIpcDownloadProgressOutput>): () => void;
    answerMain(channel: ipcKeys['downloadDone'], cb: (data: IIpcDownloadDoneInput) => Promise<IIpcDownloadDoneOutput>): () => void;
    answerMain(channel: ipcKeys['downloadError'], cb: (data: IIpcDownloadErrorInput) => Promise<IIpcDownloadErrorOutput>): () => void;
  }

  export const ipcMain: MainProcessIpc;
  export const ipcRenderer: RendererProcessIpc;
}
