import path from 'path';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import { logMain } from '@/utils/logger';

export type WatchTopLevelDirCreationEvent =
  | {
      type: 'topLevelDirCreated';
      name: string;
      stats: fs.Stats;
    }
  | {
      type: 'targetDeleted';
      path: string;
    };

export async function watchTopLevelDirCreation(
  dir: string,
  onEvent: (evt: WatchTopLevelDirCreationEvent) => void | Promise<void>,
) {
  const root = path.resolve(dir);

  let exists = false;
  let stat;
  try {
    stat = await fs.stat(root);
    if (!stat.isDirectory()) {
      throw new Error(`watchTopLevelDirCreation: target is not a directory: ${root}`);
    }
    exists = true;
  } catch (e: any) {
    if (e.code === 'ENOENT') {
      exists = false;
    } else {
      throw e;
    }
  }

  if (!exists) {
    logMain.info('[watchTopLevelDirCreation] polling', root);
    const foundDirs = new Map();
    const pollDirs = async () => {
      try {
        const files = await fs.readdir(root);
        for (const file of files) {
          if (!foundDirs.has(file)) {
            const stats = await fs.stat(path.join(root, file));
            if (stats.isDirectory()) {
              onEvent({ type: 'topLevelDirCreated', name: file, stats });
            }
            foundDirs.set(file, true);
          }
        }
      } catch (e: any) {
        if (e.code === 'ENOENT') {
          return;
        }
        throw e;
      }
    };
    pollDirs();
    const interval = setInterval(pollDirs, 200);

    return async function close() {
      clearInterval(interval);
    };
  } else {
    logMain.info('[watchTopLevelDirCreation] watching', root);
    const watcher = chokidar.watch(root, {
      ignoreInitial: true,
      persistent: true,
      depth: 1,
      awaitWriteFinish: false,
      alwaysStat: true,
    });

    watcher.on('addDir', (p, stats) => {
      const parent = path.dirname(path.resolve(p));
      if (parent === root) {
        onEvent({ type: 'topLevelDirCreated', name: path.basename(p), stats: stats! });
      }
    });

    watcher.on('unlinkDir', (p) => {
      if (path.resolve(p) === root) {
        onEvent({ type: 'targetDeleted', path: root });
      }
    });

    // 某些平台的低级错误
    watcher.on('error', (err) => {
      // 这里不抛错，避免中断，交给调用方观察日志
      logMain.error('[watchTopLevelDirCreation] watcher error:', err);
    });

    return async function close() {
      await watcher.close();
    };
  }
}

export async function ensureExecutable(filePath: string) {
  if (process.platform === 'win32') {
    return;
  }
  const stat = await fs.stat(filePath);
  if (stat.isFile()) {
    const newMode = stat.mode | 0o111;
    stat.mode !== newMode && (await fs.chmod(filePath, newMode));
  }
}
