// ** DO NOT use alias @ **
import req from './utils/request';
import * as platform from './utils/platform';
import * as envChecker from './services/env-checker';
import * as envInstaller from './services/env-installer';
import * as vsc from './services/vsc';
import * as resources from './services/resources';
import track from './utils/track';
import { getEnvComponents } from 'common/configs/env';
import { appConf } from './utils/store';
import * as appService from './services/app';

const _modules = {
  req,
  envComponents: getEnvComponents({
    platform: platform.currentPlatform,
    arch: platform.currentArch,
  }),
  envChecker,
  envInstaller,
  platform,
  vsc,
  appService,
  track,
  resources,
  appConf,
};

export default _modules;
