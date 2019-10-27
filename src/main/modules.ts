// ** DO NOT use alias @ **
import req from './utils/request';
import * as envChecker from './services/env-checker';
import * as envInstaller from './services/env-installer';
import Respack from './services/respack';

const _modules = {
  req,
  envChecker,
  envInstaller,
  Respack,
};

export default _modules;
