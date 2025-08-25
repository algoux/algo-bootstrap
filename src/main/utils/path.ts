import { app } from 'electron';
import path from 'path';
import os from 'os';
import { logMain, log } from './logger';
import paths, { PathKey } from 'common/configs/paths';

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
};

export function getPath(key: PathKey) {
  return pathMap[key];
}
