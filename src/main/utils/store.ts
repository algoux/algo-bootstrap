import Store from 'electron-store';

export const appConf = new Store<IAppConf>({
  name: 'conf',
  fileExtension: 'abstorage',
  serialize: (value) => JSON.stringify(value, null, 2),
  defaults: {
    uid: '',
    completionState: undefined,
    vscProfileDir: undefined,
    vscProfileName: undefined,
    gccAlternative: undefined,
    initTemplate: {},
  },
});
