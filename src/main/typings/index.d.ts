declare module NodeJS {
  interface Global {
    modules: _GlobalSharedModules;
    getMainWindow: () => Electron.BrowserWindow | null;
    getMainProcessDirectory: () => string;
  }
}

declare const __static: string;
