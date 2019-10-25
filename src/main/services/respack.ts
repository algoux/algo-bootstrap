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

export interface IRespackManifestFile {
  id: string;
  name: string;
  version: string;
  format: string;
}

export interface IRespackManifest {
  id: string;
  description: string;
  version: string;
  platform: SupportedPlatform;
  files: IRespackManifestFile[];
}

interface IRespackCheckResult {
  _id: string;
  name: string;
  sha1: string;
}

function getFileId(id: string, platform: string, version: string) {
  return `${id}~${platform}~${version}`;
}

export default class Respack {
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

  private extractAll(to: string) {
    return new Promise((resolve, reject) => {
      try {
        this.zipInstance.extractAllToAsync(to, true, (_e) => {
          resolve();
        });
      } catch (e) {
        reject(generalError(Codes.respackExtractFailed, e));
      }
    });
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
    await this.extractAll(target);
    logMain.info('[respack] extract completed');
  }
}
