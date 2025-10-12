import { app } from 'electron';
import { logMain } from './logger';

export function setupGracefulExit(asyncCleanup: Function) {
  if (typeof asyncCleanup !== 'function') {
    throw new TypeError('setupGracefulExit requires an async function');
  }

  let quitting = false;

  async function cleanupAndQuit(reason: string) {
    if (quitting) return;
    quitting = true;

    logMain.info(`[graceful-exit] preparing to quit (${reason})...`);
    try {
      await Promise.resolve(asyncCleanup(reason));
    } catch (err) {
      logMain.error('[graceful-exit] cleanup failed:', err);
    } finally {
      logMain.info('[graceful-exit] cleanup complete, quitting now');
      app.quit();
    }
  }

  app.on('before-quit', (e) => {
    if (!quitting) {
      e.preventDefault();
      cleanupAndQuit('before-quit');
    }
  });

  process.on('SIGINT', () => cleanupAndQuit('SIGINT'));
  process.on('SIGTERM', () => cleanupAndQuit('SIGTERM'));
}
