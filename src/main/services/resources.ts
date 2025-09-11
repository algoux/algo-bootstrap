import path from 'path';
import fs from 'fs-extra';
import req from '@/utils/request';
import api from 'common/configs/apis';
import { ResourceId, ResourceIndexItem, resourcesIndexPathMap } from 'common/configs/resources';
import { PathKey } from 'common/configs/paths';
import { getPath } from '@/utils/path';
import { spawn } from '@/utils/child-process';

export async function getRemoteResourceIndexItem(
  resourceId: ResourceId,
): Promise<ResourceIndexItem> {
  const res = (await req.get(
    api.res.base + resourcesIndexPathMap[resourceId],
  )) as ResourceIndexItem;
  return res;
}

export async function getResourceDownloadCacheFilenames() {
  const dirPath = getPath(PathKey.resourcesDownload);
  await fs.ensureDir(dirPath);
  return await fs.readdir(dirPath);
}

export async function checkValidResourceDownloadCache(
  resources: {
    resourceId: ResourceId;
    filename: string;
    md5: string;
  }[],
): Promise<Record<string, boolean>> {
  const cacheFilenames = await getResourceDownloadCacheFilenames();
  const resultMap: Record<string, boolean> = {};
  resources.forEach((r) => {
    resultMap[r.resourceId] = false;
  });
  const checkMd5Resources = resources.filter((r) =>
    cacheFilenames.find((filename) => filename === r.filename),
  );
  if (checkMd5Resources.length === 0) {
    return resultMap;
  }

  const workerScriptPath = path.join(getPath(PathKey.mainProcess), 'utils', 'md5-worker.js');
  if (!(await fs.pathExists(workerScriptPath))) {
    throw new Error('md5-worker.js not found');
  }
  const { stdout } = await spawn(
    '[checkMD5]',
    `"${process.execPath}" "${workerScriptPath}"`,
    checkMd5Resources.map((r) => `"${r.filename}"`),
    {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
      },
      cwd: getPath(PathKey.resourcesDownload),
    },
  );
  const results = JSON.parse(stdout.toString().trim());
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const resource = checkMd5Resources[i];
    resultMap[resource.resourceId] = result.md5 === resource.md5;
  }

  return resultMap;
}
