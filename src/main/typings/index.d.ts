declare module NodeJS {
  interface Global {
    modules: _SharedModules;
  }
}
