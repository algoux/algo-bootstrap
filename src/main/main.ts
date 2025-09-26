import 'source-map-support/register';
import { app, BrowserWindow, nativeTheme, Menu, shell, dialog } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { ipcMain as ipc } from 'electron-better-ipc';
import IPCKeys from 'common/configs/ipc';
import _modules from '@/modules';
import { checkRemainingDiskSpace } from '@/services/env-checker';
import { logMain, log } from '@/utils/logger';
import { currentPlatformArch, isMac, isPlatformArchIsSupported, isWindows } from '@/utils/platform';
import constants from 'common/configs/constants';
import req from '@/utils/request';
import api from 'common/configs/apis';
import { compare } from 'compare-versions';
import { filesize } from 'filesize';
import fs from 'fs-extra';
import track from './utils/track';
import { initialize, enable } from '@electron/remote/main';
import { getPath } from './utils/path';
import { PathKey } from 'common/configs/paths';
import { ElectronDownloadManager } from 'electron-dl-manager';
import { IPCDownloadItemStatus } from 'common/typings/ipc';

logMain.info('[app.start]', process.env.NODE_ENV);
logMain.info('[app.info]', app.getVersion(), currentPlatformArch, {
  versions: process.versions,
});

// if (module.hot) {
//   module.hot.accept();
// }

// DEBUG TEMP
if (isWindows) {
  const nativeRegRoot = path.dirname(require.resolve('native-reg/package.json'));
  logMain.info('native-reg root =', nativeRegRoot);

  const buildRelease = path.join(nativeRegRoot, 'build', 'Release', 'reg.node');
  const prebuildDir = path.join(nativeRegRoot, 'prebuilds', `${process.platform}-${process.arch}`);

  logMain.info('Looking for:', buildRelease);
  logMain.info('Exists?    ', fs.existsSync(buildRelease));
  logMain.info(
    'Prebuilds? ',
    fs.existsSync(prebuildDir) ? fs.readdirSync(prebuildDir) : 'no prebuild dir',
  );

  try {
    logMain.info('Trying direct require of build/Release/reg.node...');
    const reg = require(buildRelease);
    logMain.info('SUCCESS: Loaded reg.node directly!', reg);
  } catch (err) {
    console.error('FAILED direct require:', err);
  }

  try {
    logMain.info("Trying normal require('native-reg')...");
    const reg = require('native-reg');
    logMain.info('SUCCESS: Loaded native-reg!', reg);
  } catch (err) {
    logMain.error('FAILED normal require:', err);
  }
}

const PATH = process.env.PATH!;
if (isMac && PATH.search('/usr/local/bin') === -1) {
  process.env.PATH = PATH + ':/usr/local/bin';
}

logMain.info('[env]', process.env);

// 将需要共享到渲染进程的模块暴露到 global
global.modules = _modules;

let downloadTaskIdNum = 1;

logMain.info('[nativeTheme]', {
  shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
  themeSource: nativeTheme.themeSource,
});
// TODO 暂不支持 dark theme
nativeTheme.themeSource = 'light';

let mainWindow: Electron.BrowserWindow | null = null;
global.getMainWindow = () => mainWindow;
global.getMainProcessDirectory = () => __dirname;

logMain.info('[path]', {
  cwd: process.cwd(),
  __dirname: path.join(__dirname),
  __static: path.join(__static),
  'process.resourcesPath': process.resourcesPath,
  'global.getMainProcessDirectory()': global.getMainProcessDirectory(),
  'app.getPath("exe")': app.getPath('exe'),
  'app.getPath("userData")': app.getPath('userData'),
  'app.getPath("temp")': app.getPath('temp'),
  'app.getPath("appData")': app.getPath('appData'),
  'app.getPath("home")': app.getPath('home'),
});

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 880,
    height: 660,
    resizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, './preload.js'),
    },
    title: `${constants.appName} v${app.getVersion()}`,
    // show: false,
    ...(process.platform === 'darwin' && {
      vibrancy: 'sidebar',
      transparent: true,
      titleBarStyle: 'hiddenInset',
    }),
  });

  // 启用 remote 模块
  enable(mainWindow.webContents);

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
      }),
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
  const isDarkMode = nativeTheme.shouldUseDarkColors;
  const theme = isDarkMode ? 'dark' : 'light';
  track.event('app', 'setTheme', theme);
  logMain.info('[updateAppTheme] theme:', theme);
  // nativeTheme.themeSource = theme;
}

nativeTheme.on('updated', () => updateAppTheme());

type MenuItem = Electron.MenuItemConstructorOptions | Electron.MenuItem;

const menuTemplate: MenuItem[] = [
  {
    label: '文件',
    role: 'fileMenu',
    submenu: [
      {
        label: '关闭窗口',
        accelerator: 'CmdOrCtrl+W',
        role: 'close',
      },
    ],
  },
  {
    label: '编辑', // Edit
    role: 'editMenu',
    submenu: [
      {
        label: '撤销', // Undo
        accelerator: 'CmdOrCtrl+Z',
        role: 'undo',
      },
      {
        label: '重做', // Redo
        accelerator: 'Shift+CmdOrCtrl+Z',
        role: 'redo',
      },
      {
        type: 'separator',
      },
      {
        label: '剪切', // Cut
        accelerator: 'CmdOrCtrl+X',
        role: 'cut',
      },
      {
        label: isMac ? '拷贝' : '复制', // Copy
        accelerator: 'CmdOrCtrl+C',
        role: 'copy',
      },
      {
        label: '粘贴', // Paste
        accelerator: 'CmdOrCtrl+V',
        role: 'paste',
      },
      {
        label: '全选', // Select All
        accelerator: 'CmdOrCtrl+A',
        role: 'selectAll',
      },
    ],
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
    submenu: [
      {
        label: '打开日志目录',
        click: (_item, focusedWindow) => {
          track.event('app', 'openLogDir');
          openLogDir();
        },
      },
    ],
  },
  {
    label: '窗口', // Window
    role: 'window',
    submenu: [
      {
        label: '最小化', // Minimize
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize',
      },
    ],
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
            type: 'info' as const,
            message: '加入 QQ 群聊',
            detail: '搜索群号码 445813999 以加入',
          };
          focusedWindow && dialog.showMessageBox(focusedWindow || null, options);
        },
      },
    ],
  },
];

function addUpdateMenuItems(items, position) {
  if (process.mas) {
    return;
  }

  const updateItems = [
    {
      label: '检查更新',
      key: 'checkForUpdate',
      click: () => {
        track.event('app', 'checkUpdate');
        checkUpdate();
      },
    },
  ];

  items.splice.apply(items, [position, 0].concat(updateItems));
}

if (process.platform === 'darwin') {
  const name = app.getName();
  menuTemplate.unshift({
    label: name,
    submenu: [
      {
        label: `关于 ${name}`,
        role: 'about',
      },
      {
        type: 'separator',
      },
      {
        type: 'separator',
      },
      {
        label: `隐藏 ${name}`, // Hide
        accelerator: 'Command+H',
        role: 'hide',
      },
      {
        label: '隐藏其他', // Hide Others
        accelerator: 'Command+Alt+H',
        role: 'hideothers',
      },
      {
        label: '全部显示', // Show All
        role: 'unhide',
      },
      {
        type: 'separator',
      },
      {
        label: `退出 ${name}`, // Quit
        accelerator: 'Command+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  } as MenuItem);

  // Window menu.
  // @ts-ignore
  menuTemplate[4].submenu.push(
    {
      type: 'separator',
    },
    {
      label: '前置全部窗口', // Bring All to Front
      role: 'front',
    },
  );

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

  app.on('ready', async () => {
    // 设置应用语言为简体中文
    app.commandLine.appendSwitch('lang', 'zh-CN');

    // 初始化 remote 模块
    initialize();

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
    createWindow();

    if (!isPlatformArchIsSupported()) {
      const okText = isMac ? '好' : '确定';
      const options = {
        type: 'error' as const,
        message: `当前平台未支持：${currentPlatformArch}`,
        detail: `点击「${okText}」转到官方网站查看最新版本说明`,
        buttons: [okText, '退出'],
        defaultId: 0,
        cancelId: 1,
      };
      const promise = mainWindow
        ? dialog.showMessageBox(mainWindow, options)
        : dialog.showMessageBox(options);
      const clicked = await promise;
      if (clicked?.response === 0) {
        await shell.openExternal(constants.site);
      }
      app.quit();
      return;
    }

    checkUpdate(true);

    checkRemainingDiskSpace().then((res) => {
      logMain.info('[checkRemainingDiskSpace]', res);
      if (res.free < 1000 * 1000 * 1000 * 2.5) {
        const options = {
          type: 'error' as const,
          message: `剩余空间不足 2.5 GB，配置环节可能出现问题`,
        };
        mainWindow ? dialog.showMessageBox(mainWindow, options) : dialog.showMessageBox(options);
      }
    });
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

app.on('quit', () => {
  logMain.info('[app.quit]');
});

const dlManager = new ElectronDownloadManager();

ipc.answerRenderer(IPCKeys.download, async (options, bw) => {
  const commOptions = { ...options };
  const requests = commOptions.requests;
  // @ts-ignore
  delete commOptions.requests;
  const curDownloadTaskId = downloadTaskIdNum++;
  let lastAllReceivedSize = 0;
  let lastAllProgressTime = 0;
  logMain.info(`[download.start #${curDownloadTaskId}]`, options);
  const __start = Date.now();
  const directorySet = new Set<string>(
    requests.map((req) => getPath(req.directory as PathKey)).filter(Boolean),
  );
  for (const directory of directorySet) {
    await fs.ensureDir(directory);
  }

  const downloadIds: string[] = new Array(requests.length).fill('');
  const itemStatuses: IPCDownloadItemStatus[] = new Array(requests.length).fill('pending');
  const itemDownloadProgress: { received: number; total: number }[] = new Array(requests.length)
    .fill(undefined)
    .map(() => ({
      received: 0,
      total: 0,
    }));
  const checkFinished = () => {
    if (
      itemStatuses.every((state) => state === 'done' || state === 'error' || state === 'cancelled')
    ) {
      ipc.callRenderer(bw, IPCKeys.downloadFinished, {
        downloadTaskId: curDownloadTaskId,
        itemStatuses,
      });
      if (itemStatuses.some((state) => state === 'error')) {
        dialog.showMessageBox(bw, {
          buttons: [],
          type: 'error',
          message: options.errorTitle,
          detail: options.errorMessage,
        });
      }
    }
  };

  for (let itemIndex = 0; itemIndex < requests.length; itemIndex++) {
    const req = requests[itemIndex];
    logMain.info(`[download.start #${curDownloadTaskId}:${itemIndex}]`, req.url, {
      filename: req.saveAsFilename,
      directory: getPath(req.directory as PathKey),
    });

    try {
      const id = await dlManager.download({
        window: bw,
        url: req.url,
        saveAsFilename: req.saveAsFilename,
        directory: getPath(req.directory as PathKey) || req.directory,
        overwrite: commOptions.overwrite,
        callbacks: {
          onDownloadStarted() {
            itemStatuses[itemIndex] = 'downloading';
          },
          onDownloadProgress({
            id,
            item,
            percentCompleted,
            downloadRateBytesPerSecond,
            estimatedTimeRemainingSeconds,
          }) {
            const totalBytes = item.getTotalBytes();
            const receivedSize = item.getReceivedBytes();
            itemDownloadProgress[itemIndex].received = receivedSize;
            itemDownloadProgress[itemIndex].total = totalBytes;
            ipc.callRenderer(bw, IPCKeys.downloadProgress, {
              downloadTaskId: curDownloadTaskId,
              downloadId: id,
              itemIndex,
              percent: percentCompleted / 100,
              received: receivedSize,
              total: totalBytes,
              speed: downloadRateBytesPerSecond,
            });

            const now = Date.now();
            const allReceivedSize = itemDownloadProgress.reduce(
              (acc, cur) => acc + cur.received,
              0,
            );
            const allTotalSize = itemDownloadProgress.reduce((acc, cur) => acc + cur.total, 0);
            let speed = 0;
            if (!lastAllProgressTime) {
              lastAllProgressTime = now;
              lastAllReceivedSize = allReceivedSize;
            } else if (now - lastAllProgressTime > 400) {
              const duration = now - lastAllProgressTime;
              const size = allReceivedSize - lastAllReceivedSize;
              speed = (size / duration) * 1000 || 0;
              lastAllReceivedSize = allReceivedSize;
              lastAllProgressTime = now;
              ipc.callRenderer(bw, IPCKeys.downloadTotalProgress, {
                downloadTaskId: curDownloadTaskId,
                percent: allReceivedSize / allTotalSize,
                received: allReceivedSize,
                total: allTotalSize,
                speed,
              });
            }
          },
          onDownloadInterrupted({ id, interruptedVia }) {
            logMain.error(
              `[download.interrupted #${curDownloadTaskId}:${itemIndex} ${id}] interruptedVia: ${interruptedVia}`,
            );
            itemStatuses[itemIndex] = 'error';
            checkFinished();
            ipc.callRenderer(bw, IPCKeys.downloadError, {
              downloadTaskId: curDownloadTaskId,
              downloadId: id,
              itemIndex,
            });
          },
          onError(error, { id }) {
            logMain.error(`[download.error #${curDownloadTaskId}:${itemIndex} ${id}]`, error);
            itemStatuses[itemIndex] = 'error';
            checkFinished();
            ipc.callRenderer(bw, IPCKeys.downloadError, {
              downloadTaskId: curDownloadTaskId,
              downloadId: id,
              itemIndex,
              error: error.toString(),
            });
          },
          onDownloadCompleted({ id, item }) {
            const time = Date.now() - __start;
            const size = item.getTotalBytes();
            const speed = (size / time) * 1000;
            logMain.info(
              `[download.done #${curDownloadTaskId}:${itemIndex}]`,
              `time:`,
              `${time + 'ms'}`,
              'size:',
              size,
              'avgSpeed:',
              `${filesize(speed, { standard: 'iec' })}/s`,
            );
            itemStatuses[itemIndex] = 'done';
            ipc.callRenderer(bw, IPCKeys.downloadDone, {
              downloadTaskId: curDownloadTaskId,
              downloadId: id,
              itemIndex,
              filename: item.getFilename(),
              time,
              size,
              speed,
            });
            checkFinished();
          },
        },
      });
      downloadIds[itemIndex] = id;
    } catch (e) {
      logMain.error(`[download.error #${curDownloadTaskId}:${itemIndex}]`, e);
      itemStatuses[itemIndex] = 'error';
      ipc.callRenderer(bw, IPCKeys.downloadError, {
        downloadTaskId: curDownloadTaskId,
        downloadId: '',
        itemIndex,
        error: e.toString(),
      });
      checkFinished();
    }
  }

  return {
    downloadTaskId: curDownloadTaskId,
    downloadIds,
  };
});

ipc.answerRenderer(IPCKeys.showResetConfigDialog, async (_, bw) => {
  const options: Electron.MessageBoxOptions = {
    type: 'warning' as const,
    buttons: ['确认', '取消'],
    defaultId: 1,
    cancelId: 1,
    message: '开始重新配置',
    detail: '这将重置状态并返回准备阶段。',
    checkboxLabel: '复用 VS Code 配置和代码模板',
    checkboxChecked: false,
  };

  const window = bw || mainWindow;
  if (!window) {
    throw new Error('No window available for dialog');
  }

  try {
    const result = await dialog.showMessageBox(window, options);
    logMain.info('[resetConfigDialog]', {
      response: result.response,
      checkboxChecked: result.checkboxChecked,
    });

    return {
      confirmed: result.response === 0,
      reuseVscProfile: result.checkboxChecked,
    };
  } catch (error) {
    logMain.error('[resetConfigDialog]', error);
    throw error;
  }
});

async function checkUpdate(auto = false) {
  try {
    const res: ICheckAppVersion = await req.get(api.version);
    const latestVersion = res.version;
    const versionInfo = res[currentPlatformArch];
    logMain.info('[checkUpdate]', latestVersion, res);
    if (compare(app.getVersion(), latestVersion, '<')) {
      const okText = isMac ? '好' : '确定';
      let clicked: Electron.MessageBoxReturnValue;
      const options = {
        type: 'info' as const,
        message: `检查到新版本：${latestVersion}`,
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
        type: 'info' as const,
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
      type: 'error' as const,
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
    shell.openPath(path.dirname(log.transports.file.getFile().path));
  } catch (e) {
    logMain.error('[openLog] error:', e);
  }
}

track.event('app', 'start', app.getVersion(), 1);
