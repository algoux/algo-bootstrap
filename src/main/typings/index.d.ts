declare module NodeJS {
  interface Global {
    modules: _GlobalSharedModules;
  }
}

declare const __static: string;
