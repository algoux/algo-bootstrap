import AdmZip from 'adm-zip';
import fs from 'fs-extra';

/**
 * Extract all files in zip
 * @param filePath zip file path
 * @param to where to extract
 * @param removeFolderFirst whether remove the "to" folder first
 */
export function extractAll(filePath: string, to: string, removeFolderFirst = false) {
  return new Promise(async (resolve, reject) => {
    try {
      const zipInstance = new AdmZip(filePath);
      if (removeFolderFirst) {
        await fs.remove(to);
      }
      zipInstance.extractAllToAsync(to, true, e => {
        e ? reject(e) : resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
}
