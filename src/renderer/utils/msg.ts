import { remote } from "electron";
import sm from './modules';

const Platform = sm.platform.Platform;

function success(message: string, detail?: string) {
  remote.dialog.showMessageBox(remote.getCurrentWindow(), {
    buttons: [],
    type: 'info',
    message,
    detail,
  });
}

function error(message: string, detail?: string) {
  remote.dialog.showMessageBox(remote.getCurrentWindow(), {
    buttons: [],
    type: 'error',
    message,
    detail: detail === undefined ? '在「菜单 > 调试 > 打开日志目录」可以查看或发送日志' : detail,
  });
}

function confirm(message: string, detail?: string) {
  const buttonsMap = {
    [Platform.win32]: ['确定', '取消'],
    [Platform.darwin]: ['好', '取消'],
    [Platform.linux]: ['确定', '取消'],
  };
  return remote.dialog.showMessageBox(remote.getCurrentWindow(), {
    buttons: buttonsMap[sm.platform.currentPlatform],
    type: 'question',
    message,
    detail,
    defaultId: 0,
    cancelId: 1,
  }).then(r => r.response === 0);
}

const msg = {
  success,
  error,
  confirm,
};

export default msg;
