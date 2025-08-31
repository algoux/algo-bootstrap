import fs from 'fs-extra';
import unzipper from 'unzipper';
import { logMain } from '@/utils/logger';

/**
 * Extract all files in zip
 * @param filePath zip file path
 * @param targetDir where to extract
 * @param clearTargetDir whether remove the targetDir first
 */
export function extractAll(
  filePath: string,
  targetDir: string,
  clearTargetDir = false,
): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      logMain.info('[extractAll.start]', filePath, targetDir, clearTargetDir);
      const __start = Date.now();
      // defunct
      // const directory = await unzipper.Open.file(filePath);
      // clearTargetDir && await fs.emptyDir(targetDir);
      // for (const file of directory.files) {
      //   file.type === 'File' && await extractEntry(file, targetDir);
      // }
      // logMain.info('[extractAll.done]', filePath, targetDir);
      // resolve();
      clearTargetDir && (await fs.emptyDir(targetDir));
      const directory = await unzipper.Open.file(filePath);
      await directory.extract({ path: targetDir });
      logMain.info(`[extractAll.done ${Date.now() - __start + 'ms'}]`, filePath, targetDir);
      resolve();
    } catch (e) {
      logMain.error('[extractAll.error]', filePath, targetDir, e);
      reject(e);
    }
  });
}

/**
 * Get uncompressed size of zip file
 * @param filePath zip file path
 */
export function getUncompressedSize(filePath: string): Promise<number> {
  return new Promise(async (resolve, reject) => {
    try {
      const directory = await unzipper.Open.file(filePath);
      const size = directory.files.reduce((acc, cur) => acc + cur.uncompressedSize, 0);
      logMain.info(`[getUncompressedSize.done]`, filePath, size);
      resolve(size);
    } catch (e) {
      logMain.error('[getUncompressedSize.error]', filePath, e);
      reject(e);
    }
  });
}

/**
 * Get top dir name of zip file
 * @param filePath zip file path
 */
export function getTopDirName(filePath: string): Promise<string | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const directory = await unzipper.Open.file(filePath);
      if (directory.files[0]?.type === 'Directory') {
        if (directory.files.every((file) => file.path.startsWith(directory.files[0].path))) {
          resolve(directory.files[0].path.split('/')[0]);
          return;
        }
      }
      resolve(null);
    } catch (e) {
      logMain.error('[getTopDirName.error]', filePath, e);
      reject(e);
    }
  });
}

/**
 * Load one entry content in zip
 * @param filePath zip file path
 * @param entry entry path
 * @param format return format
 */
export function loadOne(filePath: string, entry: string, format?: 'buffer'): Promise<Buffer>;
export function loadOne(filePath: string, entry: string, format: 'string'): Promise<string>;
export function loadOne<T = any>(filePath: string, entry: string, format: 'json'): Promise<T>;
export function loadOne(
  filePath: string,
  entry: string,
  format: 'buffer' | 'string' | 'json' = 'buffer',
): Promise<Buffer | string | any> {
  return new Promise(async (resolve, reject) => {
    try {
      logMain.info('[loadOne]', filePath, entry);
      const directory = await unzipper.Open.file(filePath);
      const file = directory.files.find((f) => f.type === 'File' && f.path === entry);
      if (!file) {
        reject(Error('No such entry: ' + entry));
        return;
      }
      const content = await file.buffer();
      switch (format) {
        case 'string':
          resolve(content.toString());
          break;
        case 'json':
          resolve(JSON.parse(content.toString()));
          break;
        default:
          resolve(content);
      }
      logMain.info('[loadOne.done]', filePath, entry, format);
    } catch (e) {
      logMain.error('[loadOne.error]', filePath, entry, format, e);
      reject(e);
    }
  });
}
