import * as path from 'path';
import fs from 'fs-extra';
import paths from 'common/configs/paths';
import { logMain } from 'common/utils/logger';
import ejs from 'ejs';
import { getEnvironments, isEnvInstalled, getEnvironment } from './env-checker';
import { isWindows, isMac, isLinux, Platform } from '@/utils/platform';
import { spawn } from '@/utils/child-process';
import { app } from 'electron';

export async function isDirEmpty(dirPath: string) {
  const dirFiles = await fs.readdir(dirPath);
  const files = dirFiles.filter(f => f !== '.DS_Store');
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

async function genTmplData() {
  const environments = await getEnvironments();
  if (!environments.gcc.installed) {
    throw Error('gcc not installed');
  }
  if (!environments.cpplint.installed) {
    throw Error('cpplint not installed');
  }
  const data = {
    appVersion: app.getVersion(),
    gccPath: {
      [Platform.win32]: fmt(isWindows ? environments.gcc.path : undefined, 'C:\\MinGW64\\bin\\g++.exe'),
      [Platform.darwin]: fmt(isMac ? environments.gcc.path : undefined, '/usr/bin/gcc'),
      [Platform.linux]: fmt(isLinux ? environments.gcc.path : undefined, '/usr/bin/gcc'),
    },
    gdbPath: {
      [Platform.win32]: fmt(isWindows ? (environments.gdb as ICheckEnvironmentResultInstalled).path : undefined, 'C:\\MinGW64\\bin\\gdb.exe'),
      [Platform.linux]: fmt(isLinux ? (environments.gdb as ICheckEnvironmentResultInstalled).path : undefined, '/usr/bin/gdb'),
    },
    cpplintPath: fmt(environments.cpplint.path, ''),
  };
  logMain.info('[genTmplData]', data);
  return data;
}

export async function genProjectFiles(projectPath: string) {
  logMain.info('[genProjectFiles]', projectPath);
  // TODO 递归遍历目录文件拷贝
  // 读取模板文件列表
  const tmplProjectPath = path.join(__static, paths.tmplProject);
  const tmplProjectVscodePath = path.join(tmplProjectPath, '.vscode');
  const dirFiles = await fs.readdir(tmplProjectVscodePath);
  const files = dirFiles.filter(f => f !== '.DS_Store' && fs.statSync(path.join(tmplProjectVscodePath, f)).isFile());
  logMain.info('[genProjectFiles] files:', files);
  // 向项目目录写入文件
  const data = await genTmplData();
  const targetVscodePath = path.join(projectPath, '.vscode');
  await fs.ensureDir(targetVscodePath);
  for (const file of files) {
    const filePath = path.join(tmplProjectVscodePath, file);
    const targetFilePath = path.join(targetVscodePath, file);
    const tmpl = (await fs.readFile(filePath)).toString();
    await fs.writeFile(targetFilePath, ejs.render(tmpl, data));
  }
}

export async function openProject(projectPath: string) {
  const code = await getEnvironment('code');
  if (!code.installed) {
    throw Error('VS Code not installed');
  }
  await spawn('[openProject]', `"${code.path}"`, [projectPath]);
}
