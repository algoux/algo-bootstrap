import { app } from 'electron';
import path from 'path';
import os from 'os';
import { logMain, log } from './logger';
import { PathKey } from 'common/configs/paths';

const paths = {
  respack: '/respack',
  respackTemp: '/respack_temp',
  respackDownload: '/respack_download',
  resourcesDownload: '/ab-resources-dl',
  resourcesTemp: '/ab-resources-temp',
  userlibSrc: '/userlib',
  magicWelcomeConfig: '/magic-welcome.json',
  tmpl: '/tmpl',
  tmplMagic: '/tmpl/magic',
  tmplProfile: '/tmpl/profile',
  tmplProject: '/tmpl/project',
};

function getMainProcessDirectory() {
  logMain.info(
    'getMainProcessDirectory:',
    process.env.NODE_ENV,
    process.resourcesPath,
    app.getPath('exe'),
  );
  if (process.env.NODE_ENV === 'development') {
    return path.resolve(__dirname, '..');
  } else {
    return process.resourcesPath
      ? path.join(process.resourcesPath, '..')
      : path.dirname(app.getPath('exe'));
  }
}

const pathMap: Record<PathKey, string> = {
  [PathKey.mainProcess]: getMainProcessDirectory(),
  [PathKey.log]: path.dirname(log.transports.file.getFile().path),
  [PathKey.resourcesDownload]: path.join(app.getPath('userData'), paths.resourcesDownload),
  [PathKey.resourcesTemp]: path.join(os.tmpdir(), 'ab-resources-temp'),
  [PathKey.staticUserlibSrc]: path.join(__static, paths.userlibSrc),
  [PathKey.staticMagicWelcomeConfig]: path.join(__static, paths.magicWelcomeConfig),
  [PathKey.staticTmpl]: path.join(__static, paths.tmpl),
  [PathKey.staticTmplMagic]: path.join(__static, paths.tmplMagic),
  [PathKey.staticTmplProfile]: path.join(__static, paths.tmplProfile),
  [PathKey.staticTmplProject]: path.join(__static, paths.tmplProject),
};

export function getPath(key: PathKey) {
  return pathMap[key];
}
