// ** DO NOT use alias @ **
import req from './utils/request';
import * as envChecker from './services/env-checker';
import Respack from './services/respack';

const _modules = {
  req,
  envChecker,
  Respack,
};

export default _modules;
