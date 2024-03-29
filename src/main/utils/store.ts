import Store from 'electron-store';

export const appConf = new Store<IAppConf>({
  name: 'conf',
  fileExtension: 'abstorage',
  serialize: value => JSON.stringify(value, null, '  '),
  defaults: {
    uid: '',
  },
});
