import Respack from "@/utils/respack";
import { logMain, logRenderer } from "common/utils/logger";
import * as sha from 'sha';
import req from '@/utils/request';
import api from "common/configs/apis";

interface IRespackCheckResult {
  _id: string;
  name: string;
  sha1: string;
}

function getFileId(id: string, platform: string, version: string) {
  return `${id}~${platform}~${version}`;
}

export async function validateRespack(filePath: string) {
  try {
    const respack = new Respack(filePath);
    const manifest = respack.getManifest();
    if (manifest.platform !== process.platform) {
      throw new Error(`Respack platform "${manifest.platform}" is incompatible with "${process.platform}"`);
    }
    logMain.info('[respack] manifest:', manifest);
    const fileId = getFileId(manifest.id, manifest.platform, manifest.version);
    const checkInfo = await req.get<IRespackCheckResult>(`${api.respack.info}/${fileId}.json`);
    logMain.info('[respack] respack checkInfo:', checkInfo);
    sha.checkSync(filePath, checkInfo.sha1);
    return true;
  } catch (e) {
    logMain.error('[respack] validateRespack', e);
  }
  return false;
}
