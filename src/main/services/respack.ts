import Respack from "@/utils/respack";
import { logMain, logRenderer } from "common/utils/logger";
import * as sha from 'sha';

export function validateRespack(filePath: string) {
  const respack = new Respack(filePath);
  const manifest = respack.getManifest();
  if (manifest.platform !== process.platform) {
    throw new Error(`Respack platform "${manifest.platform}" is incompatible with "${process.platform}"`);
  }
  logRenderer.info('[respack] manifest:', manifest);
  const sha1 = sha.getSync(filePath);
  logRenderer.info('[respack] sha1:', sha1);
}
