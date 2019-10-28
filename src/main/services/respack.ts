import AdmZip from 'adm-zip';
import { SupportedPlatform } from '@/utils/platform';
import { logMain } from 'common/utils/logger';
import Codes from 'common/configs/codes';
import generalError from 'common/utils/general-error';
import req from '@/utils/request';
import api from 'common/configs/apis';
import * as sha from 'sha';
import { app } from 'electron';
import paths from 'common/configs/paths';
import fs from 'fs-extra';

interface IRespackCheckResult {
  _id: string;
  name: string;
  sha1: string;
}

function getFileId(id: string, platform: string, version: string) {
  return `${id}~${platform}~${version}`;
}

export default class Respack {
  public static defaultResPath = app.getPath('userData') + paths.respack;

  public static async readLocalManifest(filePath: string = '') {
    const usedPath = filePath || this.defaultResPath + '/manifest.json';
    return await fs.readJSON(usedPath) as IRespackManifest;
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


  private readonly filePath: string;
  private readonly zipInstance: AdmZip;
  private readonly manifest: IRespackManifest;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.zipInstance = new AdmZip(filePath);
    this.manifest = JSON.parse(this.zipInstance.getEntry('manifest.json').getData().toString());
    logMain.info('[respack] manifest:', this.manifest);
  }

  public getManifest() {
    return this.manifest;
  }

  public async validate() {
    const manifest = this.manifest;
    if (manifest.platform !== process.platform) {
      throw generalError(Codes.respackIncompatible, Error(`Respack platform "${manifest.platform}" is incompatible with "${process.platform}"`));
    }
    let sha1 = '';
    try {
      const fileId = getFileId(manifest.id, manifest.platform, manifest.version);
      const checkInfo = await req.get<IRespackCheckResult>(`${api.respack.info}/${fileId}.json`);
      logMain.info('[respack] respack checkInfo:', checkInfo);
      sha1 = checkInfo.sha1;
    } catch (e) {
      throw generalError(Codes.respackInfoFetchFailed, e);
    }
    try {
      sha.checkSync(this.filePath, sha1);
    } catch (e) {
      throw generalError(Codes.respackChecksumError, e);
    }
    return true;
  }

  public async extract() {
    const target = app.getPath('userData') + paths.respack;
    logMain.info('[respack] extract to:', target);
    await fs.remove(target);
    this.zipInstance.extractAllTo(target, true);
    logMain.info('[respack] extract completed');
  }
}
