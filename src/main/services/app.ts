import { app } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { appConf } from '@/utils/store';
import { logMain } from '@/utils/logger';
import { getPath } from '@/utils/path';
import { PathKey } from 'common/configs/paths';
import { isMac, isWindows } from '@/utils/platform';
import { spawn } from '@/utils/child-process';
import { ensureExecutable } from '@/utils/fs';
import { appendToWindowsUserPath, refreshWindowsPath } from '@/utils/platform-windows';

export function getCompletionState(): { timestamp: number; version: string } | undefined {
  return appConf.get('completionState');
}

export function setCompletionState() {
  logMain.info('[appService.setCompletionState]');
  appConf.set('completionState', {
    timestamp: Date.now(),
    version: app.getVersion(),
  });
}

export function resetCompletionState() {
  logMain.info('[appService.resetCompletionState]');
  appConf.delete('completionState');
}

export async function installBin() {
  if (process.env.NODE_ENV === 'development') {
    logMain.info('[installBin] skip in development mode');
    return;
  }
  const binPath = getPath(PathKey.bin);
  if (isMac) {
    await spawn('[installBin.addUserBin]', 'bash', [
      `"${path.join(getPath(PathKey.staticUserlibSrc), 'tools', 'add-user-bin.sh')}"`,
    ]);
    const bins = await fs.readdir(binPath);
    const targetBinPath = path.join(os.homedir(), '.local', 'bin');
    for (const bin of bins) {
      if (path.extname(bin) !== '') {
        continue;
      }
      const sourceBinFilePath = path.join(binPath, bin);
      const targetBinFilePath = path.join(targetBinPath, bin);
      await ensureExecutable(sourceBinFilePath).catch((e) => {
        logMain.error('[installBin] failed to ensure executable:', bin, e);
      });
      logMain.info('[installBin] symlink:', sourceBinFilePath, '->', targetBinFilePath);
      await fs.ensureDir(targetBinPath);
      if (fs.existsSync(targetBinFilePath)) {
        fs.unlinkSync(targetBinFilePath);
      }
      await fs.symlink(sourceBinFilePath, targetBinFilePath);
    }
  } else if (isWindows) {
    logMain.info('[installBin] append PATH:', binPath);
    (await appendToWindowsUserPath(binPath)) && (await refreshWindowsPath());
  }
}
