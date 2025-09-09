import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import ejs from 'ejs';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import { logMain } from '@/utils/logger';
import { getEnvironments, getEnvironment } from './env-checker';
import { isWindows, isMac } from '@/utils/platform';
import { Platform } from 'common/configs/platform';
import { spawn } from '@/utils/child-process';
import { getMingwInstallPath } from './env-installer';
import { getPath } from '@/utils/path';
import { PathKey } from 'common/configs/paths';
import { appConf } from '@/utils/store';
import { watchTopLevelDirCreation } from '@/utils/fs';
import {
  getUserProfilesDirPath,
  getVscProfileDirConfig,
  getVscProfileNameConfig,
  setVscProfileDirConfig,
  setVscProfileNameConfig,
} from '@/utils/vsc';

export async function isDirEmpty(dirPath: string) {
  const dirFiles = await fs.readdir(dirPath);
  const files = dirFiles.filter((f) => f !== '.DS_Store');
  return files.length === 0;
}

function fmt(str: string | undefined | null, defaultValue = '') {
  let s = str;
  if (typeof s !== 'string') {
    s = defaultValue;
  }
  const es = JSON.stringify(s);
  return es.substring(1, es.length - 1);
}

export async function genProjectFiles(projectPath: string) {
  logMain.info('[genProjectFiles]', projectPath);
  // TODO 递归遍历目录文件拷贝
  // 读取模板文件列表
  const tmplProjectPath = getPath(PathKey.staticTmplProject);
  const dirFiles = await fs.readdir(tmplProjectPath);
  const files = dirFiles.filter(
    (f) => f !== '.DS_Store' && fs.statSync(path.join(tmplProjectPath, f)).isFile(),
  );
  // 向项目目录写入文件
  const data = {
    appVersion: app.getVersion(),
  };
  await fs.ensureDir(projectPath);
  for (const file of files) {
    const filePath = path.join(tmplProjectPath, file);
    const targetFilePath = path.join(projectPath, file);
    const tmpl = (await fs.readFile(filePath)).toString();
    logMain.info(`[genProjectFiles] writing file ${targetFilePath}`);
    await fs.writeFile(targetFilePath, ejs.render(tmpl, data));
  }
}

export async function openProject(projectPath: string) {
  const vscode = await getEnvironment('vscode');
  if (!vscode.installed) {
    throw Error('VS Code not installed');
  }
  const profileName = getVscProfileNameConfig();
  await spawn('[openProject]', `"${vscode.path}"`, [
    `"${projectPath}"`,
    profileName ? `--profile "${profileName}"` : '',
  ]);
}

export async function validateVscProfileDirConfig() {
  const vscProfileDir = getVscProfileDirConfig();
  if (!vscProfileDir) {
    return false;
  }
  try {
    if (!(await fs.stat(path.join(getUserProfilesDirPath(), vscProfileDir))).isDirectory()) {
      return false;
    }
    return true;
  } catch (e: any) {
    return false;
  }
}

/**
 * 等待获取新创建的 profile 目录名
 */
export function waitNewVscProfileDir(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let close: () => Promise<void>;
    const timeout = setTimeout(() => {
      reject(new Error('waitNewVscProfileDir timeout'));
      close?.();
    }, 10000);
    try {
      close = await watchTopLevelDirCreation(getUserProfilesDirPath(), async (evt) => {
        logMain.info('[pollVscProfileDirCreation]', evt);
        if (evt.type === 'topLevelDirCreated') {
          clearTimeout(timeout);
          resolve(evt.name);
          await close();
        }
      });
      // TODO clear
    } catch (e: any) {
      clearTimeout(timeout);
      reject(e);
    }
  });
}

function getProfileName() {
  return appConf.get('vscProfileName');
}

function newProfileName(suffix: string) {
  return `AC (Algo Bootstrap) ${suffix}`;
}

const MAGIC_WELCOME_FILE_NAME = 'welcome';

async function initMagicDir(suffix: string) {
  const magicDir = getPath(PathKey.staticTmplMagic);
  const tempMagicDir = path.join(os.tmpdir(), `ab-tmp-${suffix}`, 'FinaleMagic');
  await fs.copy(magicDir, tempMagicDir);
  await fs.writeFile(path.join(tempMagicDir, MAGIC_WELCOME_FILE_NAME), '', { encoding: 'utf-8' });
  return tempMagicDir;
}

export async function injectMagic(options: {
  vsixIds: SupportedVSIXId[];
  gccAlt?: { command: string; path: string; type: 'gcc' | 'clang' };
}) {
  logMain.info(`[magic] inject magic:`, options);
  const workerScriptPath = path.join(getPath(PathKey.mainProcess), 'services', 'magic-worker.js');
  if (!(await fs.pathExists(workerScriptPath))) {
    throw new Error('md5-worker.js not found');
  }

  const suffix = uuidv4().slice(0, 8);
  const magicConfigPath = getPath(PathKey.staticMagicWelcomeConfig);
  const magicDir = await initMagicDir(suffix);
  const welcomeFilePath = path.join(magicDir, MAGIC_WELCOME_FILE_NAME);
  await fs.writeFile(welcomeFilePath, '');
  const baseSpeed = 5;
  const profileName = newProfileName(suffix);

  logMain.info(`[magic] prepared profile name: ${profileName}, magic dir: ${magicDir}`);

  // 启动 profile 新目录名监听
  logMain.info('[magic] waiting for new profile dir');
  const profileDirPromise = waitNewVscProfileDir();

  // 打开 vscode
  const vscode = await getEnvironment('vscode');
  if (!vscode.installed) {
    throw Error('VS Code not installed');
  }
  await spawn('[magic]', `"${vscode.path}"`, [
    `"${magicDir}"`,
    // '-w',
    `"${welcomeFilePath}"`,
    '--profile',
    `"${profileName}"`,
  ]);

  const profileDir = await profileDirPromise;
  logMain.info(`[magic] got new profile dir: ${profileDir}`);
  const profileDirPath = path.join(getUserProfilesDirPath(), profileDir);

  // 执行魔法脚本
  let scriptStage = 1;
  const magicScriptExec = (stage: number) =>
    spawn(
      '[magic]',
      `"${process.execPath}" "${workerScriptPath}"`,
      [magicConfigPath, welcomeFilePath, `${baseSpeed}`, `${stage}`],
      {
        timeout: 0,
      },
    );
  const stage1Promise = magicScriptExec(scriptStage);

  // 拷贝预置配置
  logMain.info(`[magic] copy profile ${getPath(PathKey.staticTmplProfile)} to ${profileDirPath}`);
  const tmplDirPath = getPath(PathKey.staticTmplProfile);
  await fs.copy(tmplDirPath, profileDirPath);

  // 生成预置配置的渲染数据
  const tmplRenderFiles = ['extensions.json', 'settings.json', 'tasks.json'];
  const { gcc: gccEnv, vsix: vsixEnv } = await getEnvironments();
  if (!gccEnv.installed) {
    throw Error('gcc not installed');
  }

  const vsixApproximateInstalledTimestamp = Date.now();
  const vsix: Record<string, { version: string; path: string; relativePath: string }> = {};
  for (const vsixId of options.vsixIds) {
    const vsixEnvValue = vsixEnv[vsixId];
    if (vsixEnvValue.installed) {
      vsix[vsixId] = {
        version: vsixEnvValue.version,
        path: vsixEnvValue.path,
        relativePath: path.basename(vsixEnvValue.path),
      };
    }
  }

  const formatGpp = (alt?: typeof options.gccAlt): { command: string; path: string } => {
    if (!alt) {
      return {
        command: 'g++',
        path: gccEnv.path.replace('gcc', 'g++'),
      };
    }
    if (alt.type === 'clang') {
      return {
        command: alt.command.replace('clang', 'clang++'),
        path: alt.path.replace('clang', 'clang++'),
      };
    }
    return {
      command: alt.command.replace('gcc', 'g++'),
      path: alt.path.replace('gcc', 'g++'),
    };
  };

  const data: {
    appVersion: string;
    vsixApproximateInstalledTimestamp: number;
    vsix: Record<string, { version: string; path: string; relativePath: string }>;
    gcc: { command: string; path: string };
    gpp: { command: string; path: string };
  } = {
    appVersion: app.getVersion(),
    vsixApproximateInstalledTimestamp,
    vsix,
    gcc: { command: options.gccAlt?.command || 'gcc', path: options.gccAlt?.path || gccEnv.path },
    gpp: formatGpp(options.gccAlt),
  };
  logMain.info(`[magic] tmpl render data:`, data);

  // 渲染预置配置
  for (const file of tmplRenderFiles) {
    const filePath = path.join(tmplDirPath, file);
    const targetFilePath = path.join(profileDirPath, file);
    const tmpl = (await fs.readFile(filePath)).toString();
    logMain.info(`[magic] writing rendered file ${targetFilePath}`);
    await fs.writeFile(targetFilePath, ejs.render(tmpl, data));
  }

  // 完成注入
  setVscProfileDirConfig(profileDir);
  setVscProfileNameConfig(profileName);
  if (options.gccAlt) {
    appConf.set('gccAlternative', options.gccAlt);
  }
  await getEnvironments(true);
  logMain.info('[magic] magic injection completed, waiting for magic script to complete');

  // 等待魔法仪式结束
  let scriptError: Error | null = null;
  try {
    await stage1Promise;
    scriptStage = 2;
    await magicScriptExec(scriptStage);
  } catch (e) {
    logMain.error(`[magic] failed to execute magic script at stage ${scriptStage}:`, e);
    scriptError = e;
  }

  fs.remove(magicDir);

  // 完成
  appConf.set('completionState', {
    timestamp: Date.now(),
    version: app.getVersion(),
  });

  return {
    hasScriptError: !!scriptError,
  };
}
