import { logMain } from 'common/utils/logger';
import req from '@/utils/request';
import api from 'common/configs/apis';
import * as sha from 'sha';
import { app } from 'electron';
import paths from 'common/configs/paths';
import fs from 'fs-extra';
import { loadOne, extractAll } from '@/utils/extract';
import * as path from 'path';
import { currentPlatform } from '@/utils/platform';

interface IRespackCheckResult {
  _id: string;
  name: string;
  sha1: string;
}

function getFileId(id: string, platform: string, version: string) {
  return `${id}~${platform}~${version}`;
}

export default class Respack {
  public static defaultResPath = path.join(app.getPath('userData'), paths.respack);

  public static async readLocalManifest(filePath: string = '') {
    const usedPath = filePath || path.join(this.defaultResPath, 'manifest.json');
    return await fs.readJson(usedPath) as IRespackManifest;
  }

  public static async hasLocalRespack(respackDirPath: string = '') {
    const dirPath = respackDirPath || path.join(this.defaultResPath);
    const manifestPath = path.join(dirPath, 'manifest.json');
    let has = true;
    try {
      const manifest = await this.readLocalManifest(manifestPath);
      for (const file of manifest.files) {
        has = has && await fs.pathExists(path.join(dirPath, file.name));
      }
    } catch (e) {
      has = false;
    }
    return has;
  }

  public static async readResFromLocalManifest(id: string, prefix: string = '', filePath: string = '') {
    const manifest = await this.readLocalManifest(filePath);
    for (const file of manifest.files) {
      const usedId = prefix ? `${prefix}/${id}` : id;
      if (file.id === usedId) {
        return file;
      }
    }
    return null;
  }

  public static async readResFromLocalManifestOrThrow(id: string, prefix: string = '', filePath: string = '') {
    const res = await this.readResFromLocalManifest(id, prefix, filePath);
    if (res) {
      return res;
    }
    throw new Error(`Resource {prefix: "${prefix}", id: "${id}"} not found in manifest`);
  }

  public static async getOnlineVersion(): Promise<ICheckVersionInfo> {
    const versionInfo = await req.get<ICheckRespackVersion>(api.respack.version);
    logMain.info('[Respack] [getOnlineVersion]', versionInfo);
    return versionInfo[currentPlatform];
  }


  private readonly filePath: string;
  private manifest: IRespackManifest | null;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.manifest = null;
  }

  public async loadManifest() {
    this.manifest = (await loadOne(this.filePath, 'manifest.json', 'json')) as IRespackManifest;
    logMain.info('[Respack] [loadManifest]', this.manifest);
  }

  public getManifest() {
    return this.manifest;
  }

  public async validate() {
    const manifest = this.manifest;
    if (!manifest) {
      throw Error('No manifest');
    }
    if (manifest.platform !== process.platform) {
      throw Error(`Respack platform "${manifest.platform}" is incompatible with "${process.platform}"`);
    }
    let sha1 = '';
    try {
      const fileId = getFileId(manifest.id, manifest.platform, manifest.version);
      const checkInfo = await req.get<IRespackCheckResult>(`${api.respack.info}/${fileId}.json`);
      logMain.info('[Respack] [validate] respack checkInfo:', checkInfo);
      sha1 = checkInfo.sha1;
    } catch (e) {
      throw e;
    }
    try {
      sha.checkSync(this.filePath, sha1);
    } catch (e) {
      throw e;
    }
    return true;
  }

  public async extract() {
    const target = path.join(app.getPath('userData'), paths.respack);
    logMain.info('[Respack] [extract]', target);
    await extractAll(this.filePath, target, true);
  }
}
