import { app } from 'electron';
import { appConf } from '@/utils/store';
import { logMain } from '@/utils/logger';

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
