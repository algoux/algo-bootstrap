// ** DO NOT use alias @ **
import req from './utils/request';
import * as platform from './utils/platform';
import * as envChecker from './services/env-checker';
import * as envInstaller from './services/env-installer';
import * as vsc from './services/vsc';
import Respack from './services/respack';
import track from './utils/track';

const _modules = {
  req,
  envChecker,
  envInstaller,
  Respack,
  platform,
  vsc,
  track,
};

export default _modules;
