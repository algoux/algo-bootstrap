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
  tmpl: '/tmpl',
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
  [PathKey.staticTmpl]: path.join(__static, paths.tmpl),
  [PathKey.staticTmplProject]: path.join(__static, paths.tmplProject),
};

export function getPath(key: PathKey) {
  return pathMap[key];
}
