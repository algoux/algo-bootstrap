import { app, BrowserWindow, systemPreferences, Menu, shell, dialog } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { ipcMain } from 'electron-better-ipc';
import ipcKeys from 'common/configs/ipc';
import _modules from '@/modules';
import { getEnvironments } from '@/services/env-checker';
import { logMain } from 'common/utils/logger';
import { isMac } from './utils/platform';
import constants from 'common/configs/constants';
import req from './utils/request';
import api from 'common/configs/apis';
import compareVersions from 'compare-versions';
import log from 'electron-log';

logMain.info('[app.start]');
// if (module.hot) {
//   module.hot.accept();
// }

const PATH = process.env.PATH!;
if (isMac && PATH.search('/usr/local/bin') === -1) {
  process.env.PATH = PATH + ':/usr/local/bin';
}

logMain.info('[env]', process.env);

// 将需要共享到渲染进程的模块暴露到 global
global.modules = _modules;


// console.log(1, systemPreferences.isDarkMode());
// console.log(2, systemPreferences.getEffectiveAppearance());
// console.log(3, systemPreferences.getAppLevelAppearance());
// systemPreferences.setAppLevelAppearance('light');

let mainWindow: Electron.BrowserWindow | null;

// console.log(path.join(__dirname, './preload.js'));
// console.log('ipc', ipcKeys);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 880,
    height: 660,
    webPreferences: {
      nodeIntegration: true,
      // preload: path.join(__dirname, './ preload.js'),
    },
    title: `${constants.appName} v${app.getVersion()}`,
    // show: false,
  });

  if (process.platform === 'darwin') {
    mainWindow.setVibrancy('sidebar');
  }

  updateAppTheme();

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8990/#/');
    mainWindow.webContents.openDevTools({
      mode: 'detach',
    });
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, './index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
    // mainWindow.webContents.openDevTools({
    //   mode: 'detach',
    // });
  }

  // mainWindow.once('ready-to-show', () => {
  //   mainWindow?.show();
  // });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function updateAppTheme() {
  if (process.platform === 'darwin') {
    const isDarkMode = systemPreferences.isDarkMode();
    const theme = isDarkMode ? 'dark' : 'light';
    console.log('[updateAppTheme] theme:', theme);
    // systemPreferences.setAppLevelAppearance(theme);
  }
}

if (process.platform === 'darwin') {
  systemPreferences.subscribeNotification(
    'AppleInterfaceThemeChangedNotification',
    () => updateAppTheme(),
  );
}

type MenuItem = Electron.MenuItemConstructorOptions | Electron.MenuItem;

const menuTemplate: MenuItem[] = [
  {
    label: '文件',
    role: 'fileMenu',
    submenu: [{
      label: '关闭窗口',
      accelerator: 'CmdOrCtrl+W',
      role: 'close',
    }],
  },
  {
    label: '编辑', // Edit
    role: 'editMenu',
    submenu: [{
      label: '撤销', // Undo
      accelerator: 'CmdOrCtrl+Z',
      role: 'undo'
    }, {
      label: '重做', // Redo
      accelerator: 'Shift+CmdOrCtrl+Z',
      role: 'redo'
    }, {
      type: 'separator'
    }, {
      label: '剪切', // Cut
      accelerator: 'CmdOrCtrl+X',
      role: 'cut'
    }, {
      label: isMac ? '拷贝' : '复制', // Copy
      accelerator: 'CmdOrCtrl+C',
      role: 'copy'
    }, {
      label: '粘贴', // Paste
      accelerator: 'CmdOrCtrl+V',
      role: 'paste'
    }, {
      label: '全选', // Select All
      accelerator: 'CmdOrCtrl+A',
      role: 'selectAll'
    }]
  },
  // {
  //   label: '显示', // View
  //   submenu: [{
  //     label: '进入全屏幕', // Toggle Full Screen
  //     accelerator: (() => {
  //       if (process.platform === 'darwin') {
  //         return 'Ctrl+Command+F';
  //       } else {
  //         return 'F11';
  //       }
  //     })(),
  //     click: (item, focusedWindow) => {
  //       if (focusedWindow) {
  //         focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
  //       }
  //     }
  //   }, {
  //     label: '切换开发者工具', // Toggle Developer Tools
  //     accelerator: (() => {
  //       if (process.platform === 'darwin') {
  //         return 'Alt+Command+I';
  //       } else {
  //         return 'Ctrl+Shift+I';
  //       }
  //     })(),
  //     click(_item, focusedWindow) {
  //       if (focusedWindow) {
  //         focusedWindow.webContents.toggleDevTools();
  //       }
  //     }
  //   }]
  // },
  {
    label: '调试',
    submenu: [{
      label: '打开日志目录',
      click: (_item, focusedWindow) => {
        if (focusedWindow) {
          openLogDir();
        }
      }
    }],
  },
  {
    label: '窗口', // Window
    role: 'window',
    submenu: [{
      label: '最小化', // Minimize
      accelerator: 'CmdOrCtrl+M',
      role: 'minimize'
    }]
  },
  {
    label: '帮助', // 帮助
    role: 'help',
    submenu: [{
      label: 'Algo Bootstrap 帮助',
      click: () => {
        shell.openExternal('https://algoux.org');
      }
    }]
  }];

function addUpdateMenuItems(items, position) {
  if (process.mas) {
    return;
  }

  const updateItems = [{
    label: '检查更新',
    key: 'checkForUpdate',
    click: () => {
      checkUpdate();
    }
  }];

  items.splice.apply(items, [position, 0].concat(updateItems));
}


if (process.platform === 'darwin') {
  const name = app.getName();
  menuTemplate.unshift({
    label: name,
    submenu: [{
      label: `关于 ${name}`,
      role: 'about'
    }, {
      type: 'separator'
    }, {
      type: 'separator'
    }, {
      label: `隐藏 ${name}`, // Hide
      accelerator: 'Command+H',
      role: 'hide'
    }, {
      label: '隐藏其他', // Hide Others
      accelerator: 'Command+Alt+H',
      role: 'hideothers'
    }, {
      label: '全部显示', // Show All
      role: 'unhide'
    }, {
      type: 'separator'
    }, {
      label: `退出 ${name}`, // Quit
      accelerator: 'Command+Q',
      click: () => {
        app.quit();
      },
    }]
  } as MenuItem);

  // Window menu.
  // @ts-ignore
  menuTemplate[4].submenu.push({
    type: 'separator',
  }, {
    label: '前置全部窗口', // Bring All to Front
    role: 'front'
  });

  addUpdateMenuItems(menuTemplate[0].submenu, 1);
}

if (process.platform === 'win32') {
  const helpMenu = menuTemplate[menuTemplate.length - 1].submenu;
  addUpdateMenuItems(helpMenu, 0);
}

app.on('ready', () => {
  // @ts-ignore
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
  createWindow();
  checkUpdate(true);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('gpu-process-crashed', function () {
  console.error('GPU进程崩溃，程序退出');
  app.exit(1);
});

app.on('quit', () => {
  logMain.info('[app.quit]');
});

ipcMain.answerRenderer(ipcKeys.getResPack, async (param) => {
  // const ret = await global.modules.req.get<{ apis: string[], help: string }>('https://acm.sdut.edu.cn/onlinejudge2/index.php/API_ng');
  // console.log('in main ret', ret);
  // return param + ' haha' + ret.data!.help;
  // console.log('modules', global.modules);
  // logMain.info('app.getLocale()', app.getLocale());
  return {
    checkEnvironment: await getEnvironments(true),
  };
});

async function checkUpdate(auto = false) {
  try {
    const res: { version: string, url: string } = await req.get(api.version);
    logMain.info('[checkUpdate]', res);
    if (compareVersions.compare(app.getVersion(), res.version, '<')) {
      const okText = isMac ? '好' : '确定';
      let clicked: Electron.MessageBoxReturnValue;
      const options = {
        type: 'info',
        message: `检查到新版本：${res.version}`,
        detail: `点击「${okText}」前往下载`,
        buttons: [okText, '取消'],
        defaultId: 0,
        cancelId: 1,
      };
      if (mainWindow) {
        clicked = await dialog.showMessageBox(mainWindow, options);
      } else {
        clicked = await dialog.showMessageBox(options);
      }
      if (clicked?.response === 0) {
        shell.openExternal(res.url);
      }
    } else if (!auto) {
      const options = {
        type: 'info',
        message: `当前版本已是最新`,
      };
      if (mainWindow) {
        await dialog.showMessageBox(mainWindow, options);
      } else {
        await dialog.showMessageBox(options);
      }
    }
  } catch (e) {
    logMain.error('[checkUpdate] error:', e);
    const options = {
      type: 'error',
      message: `检查更新失败`,
    };
    if (mainWindow) {
      await dialog.showMessageBox(mainWindow, options);
    } else {
      await dialog.showMessageBox(options);
    }
  }
}

async function openLogDir() {
  try {
    shell.openItem(path.dirname(log.transports.file.findLogPath()));
  } catch (e) {
    logMain.error('[openLog] error:', e);
  }
}
