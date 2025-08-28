declare module NodeJS {
  interface Global {
    modules: _GlobalSharedModules;
    getMainWindow: () => Electron.BrowserWindow | null;
  }
}

declare const __static: string;
