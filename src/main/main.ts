import { app, BrowserWindow, systemPreferences, Menu, shell, dialog } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { ipcMain as ipc } from 'electron-better-ipc';
import ipcKeys from 'common/configs/ipc';
import _modules from '@/modules';
import { getEnvironments } from '@/services/env-checker';
import { logMain } from 'common/utils/logger';
import { isMac } from '@/utils/platform';
import constants from 'common/configs/constants';
import req from '@/utils/request';
import api from 'common/configs/apis';
import compareVersions from 'compare-versions';
import log from 'electron-log';
import { currentPlatform } from '@/utils/platform';
import { download } from 'electron-dl';
import filesize from 'filesize';
import fs from 'fs-extra';
import track from './utils/track';

logMain.info('[app.start]');
logMain.info('[app.info]', app.getVersion(), currentPlatform, process.versions);
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

let downloadTaskId = 1;

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
    track.event('app', 'setTheme', theme);
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
        track.event('app', 'openLogDir');
        openLogDir();
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
    submenu: [
      {
        label: 'Algo Bootstrap 官方网站',
        click: () => {
          track.event('app', 'openSite');
          shell.openExternal(constants.site);
        },
      },
      {
        label: '加入 QQ 群聊',
        click: (_item, focusedWindow) => {
          track.event('app', 'openQQGroup');
          const options = {
            type: 'info',
            message: '加入 QQ 群聊',
            detail: '搜索群号码 445813999 以加入',
          };
          dialog.showMessageBox(focusedWindow || null, options);
        }
      },
    ]
  }];

function addUpdateMenuItems(items, position) {
  if (process.mas) {
    return;
  }

  const updateItems = [{
    label: '检查更新',
    key: 'checkForUpdate',
    click: () => {
      track.event('app', 'checkUpdate');
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

// app start

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, _commandLine, _workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.on('ready', () => {
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
    createWindow();
    checkUpdate(true);
  });
}

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
  track.exception('gpuProcessCrashed', true);
  app.exit(1);
});

app.on('renderer-process-crashed', function () {
  track.exception('rendererProcessCrashed', true);
});

app.on('quit', () => {
  logMain.info('[app.quit]');
});

ipc.answerRenderer(ipcKeys.getResPack, async (param) => {
  // const ret = await global.modules.req.get<{ apis: string[], help: string }>('https://acm.sdut.edu.cn/onlinejudge2/index.php/API_ng');
  // console.log('in main ret', ret);
  // return param + ' haha' + ret.data!.help;
  // console.log('modules', global.modules);
  // logMain.info('app.getLocale()', app.getLocale());
  return getEnvironments(true);
});

ipc.answerRenderer(ipcKeys.download, async (options, bw) => {
  const opt = { ...options };
  delete opt.url;
  const id = downloadTaskId++;
  let lastReceivedSize = 0;
  let lastProgressTime = 0;
  logMain.info(`[download.start #${id}]`, options);
  const __start = Date.now();
  if (opt.directory) {
    if (opt.clearDir) {
      await fs.emptyDir(opt.directory);
    } else {
      await fs.ensureDir(opt.directory);
    }
  }
  download(bw, options.url, {
    ...opt,
    onStarted(item) {
      item.on('updated', (_event, state) => {
        if (state === 'interrupted') {
          setTimeout(() => {
            item.cancel();
          }, 0);
        }
      });
      item.once('done', (_event, state) => {
        if (state === 'interrupted') {
          setTimeout(() => {
            item.cancel();
          }, 0);
        }
      });
    },
    onProgress({ percent, transferredBytes, totalBytes }) {
      const receivedSize = transferredBytes;
      const now = Date.now();
      let speed = 0;
      if (lastProgressTime) {
        const duration = now - lastProgressTime;
        const size = receivedSize - lastReceivedSize;
        speed = (size / duration * 1000) || 0;
      }
      lastReceivedSize = receivedSize;
      lastProgressTime = now;
      ipc.callRenderer(bw, ipcKeys.downloadProgress, {
        downloadTaskId: id,
        percent,
        received: transferredBytes,
        total: totalBytes,
        speed,
      });
    },
    onCancel(_item) {
      logMain.error(`[download.cancel #${id}]`);
      dialog.showMessageBox(bw, {
        buttons: [],
        type: 'error',
        message: options.errorTitle,
        detail: options.errorMessage,
      });
      ipc.callRenderer(bw, ipcKeys.downloadError, {
        downloadTaskId: id,
      });
    }
  }).then(downloadedItem => {
    const time = Date.now() - __start;
    const size = downloadedItem.getTotalBytes();
    const speed = size / time * 1000;
    logMain.info(`[download.done #${id}]`, `time:`, `${time + 'ms'}`, 'size:', size, 'avgSpeed:', `${filesize(speed, { standard: "iec" })}/s`);
    ipc.callRenderer(bw, ipcKeys.downloadDone, {
      downloadTaskId: id,
      filename: downloadedItem.getFilename(),
      time,
      size,
      speed,
    });
  }).catch(e => {
    logMain.error(`[download.error #${id}]`, e);
    ipc.callRenderer(bw, ipcKeys.downloadError, {
      downloadTaskId: id,
      error: e.toString(),
    });
  });
  return id;
});

async function checkUpdate(auto = false) {
  try {
    const res: ICheckAppVersion = await req.get(api.version);
    logMain.info('[checkUpdate]', res);
    const versionInfo: ICheckVersionInfo = res[currentPlatform];
    if (compareVersions.compare(app.getVersion(), versionInfo.version, '<')) {
      const okText = isMac ? '好' : '确定';
      let clicked: Electron.MessageBoxReturnValue;
      const options = {
        type: 'info',
        message: `检查到新版本：${versionInfo.version}`,
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
        shell.openExternal(versionInfo.url);
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

track.event('app', 'start', app.getVersion(), 1);
