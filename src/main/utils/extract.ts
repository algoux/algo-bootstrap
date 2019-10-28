import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import { logMain } from 'common/utils/logger';

// TODO: ADM 只有同步 API 可用，改用异步的 zip 库
/**
 * Extract all files in zip
 * @param filePath zip file path
 * @param to where to extract
 * @param removeFolderFirst whether remove the "to" folder first
 */
export async function extractAll(filePath: string, to: string, removeFolderFirst = false) {
  logMain.info('[extractAll.start]', filePath, to, removeFolderFirst);
  try {
    const __start = Date.now();
    const zipInstance = new AdmZip(filePath);
    if (removeFolderFirst) {
      await fs.remove(to);
    }
    zipInstance.extractAllTo(to, true);
    logMain.info(`[extractAll.done ${Date.now() - __start + 'ms'}]`);
  } catch (e) {
    logMain.error('[extractAll.error]', e);
    throw e;
  }
}
