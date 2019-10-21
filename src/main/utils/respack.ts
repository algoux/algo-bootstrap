import AdmZip from 'adm-zip';
import { SupportedPlatform } from '@/utils/platform';

export interface RespackManifestFile {
  id: string;
  name: string;
  version: string;
  format: string;
}

export interface RespackManifest {
  id: string;
  description: string;
  version: string;
  platform: SupportedPlatform;
  files: RespackManifestFile[];
}

export default class Respack {
  private readonly zipInstance: AdmZip;
  private readonly manifest: RespackManifest;

  constructor(filePath: string) {
    this.zipInstance = new AdmZip(filePath);
    this.manifest = JSON.parse(this.zipInstance.getEntry('manifest.json').getData().toString());
  }

  getManifest() {
    return this.manifest;
  }
}
