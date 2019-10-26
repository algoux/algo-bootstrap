import { remote } from "electron";

function error(message: string, detail?: string) {
  remote.dialog.showMessageBox(remote.getCurrentWindow(), {
    buttons: [],
    type: 'error',
    message,
    detail: detail === undefined ? '在「菜单 > 调试 > 控制台」中可以获取详细信息' : detail,
  });
}

const msg = {
  error,
};

export default msg;
