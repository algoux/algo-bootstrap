import { app, BrowserWindow, systemPreferences } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { ipcMain } from 'electron-better-ipc';
import ipcKeys from 'common/configs/ipc';
import _modules from '@/modules';
import { getEnvironments } from '@/services/env-checker';
import { logMain } from 'common/utils/logger';
import { isMac } from './utils/platform';
import constants from 'common/configs/constants';

// if (module.hot) {
//   module.hot.accept();
// }

const PATH = process.env.PATH!;
if (isMac && PATH.search('/usr/local/bin') === -1) {
  process.env.PATH = PATH + ':/usr/local/bin';
}

logMain.info('PATH', process.env.PATH);

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
    width: 800,
    height: 600,
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

app.on('ready', createWindow);

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
