const path = require('path');
const os = require('os');
const fs = require('fs');
const { Command } = require('commander');
const { spawn } = require('promisify-child-process');
const ejs = require('ejs');

const appVersion = '0.0.0';
const isElectron = process.versions.electron !== undefined;
const isDev = process.env.NODE_ENV === 'development';
const applicationName = isDev ? 'Electron' : 'Algo Bootstrap';
const confFileName = 'conf.abstorage';
const commonSpawnOptions = {
  encoding: 'utf8',
  windowsHide: true,
  timeout: 0,
  shell: true,
};

let verbose = false;

function getConfigPath() {
  const platform = os.platform();
  if (platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Roaming', applicationName, confFileName);
  } else if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', applicationName, confFileName);
  }
  return path.join(os.homedir(), '.config', applicationName, confFileName);
}

function readConfig() {
  const configPath = getConfigPath();
  if (!configPath) {
    return null;
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('Cannot read config file:', error.message);
    return null;
  }
}

function matchOne(reg, str) {
  const regResult = reg.exec(str);
  if (regResult && regResult[1]) {
    return regResult[1].trim();
  }
  return null;
}

async function findCodePath() {
  const cmdMap = {
    win32: 'where',
    darwin: 'which',
    linux: 'which',
  };
  try {
    const { stdout, stderr, code } = await spawn(cmdMap[process.platform], ['code'], {
      cwd: process.cwd(),
      ...commonSpawnOptions,
    });
    return matchOne(/(.*)/, stdout || stderr || '');
  } catch (e) {
    if (process.platform === 'darwin') {
      const codePath = '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code';
      if (fs.existsSync(codePath)) {
        return codePath;
      }
    }
  }
  return null;
}

async function genProjectFiles(projectPath) {
  const resourcesPath = process.resourcesPath;
  if (!resourcesPath) {
    return;
  }
  const tmplProjectPath = path.join(resourcesPath, 'static', 'tmpl', 'project');
  const dirFiles = fs.readdirSync(tmplProjectPath);
  const files = dirFiles.filter(
    (f) => f !== '.DS_Store' && fs.statSync(path.join(tmplProjectPath, f)).isFile(),
  );
  const data = {
    appVersion,
  };
  for (const file of files) {
    const filePath = path.join(tmplProjectPath, file);
    const targetFilePath = path.join(projectPath, file);
    const tmpl = fs.readFileSync(filePath).toString();
    const content = ejs.render(tmpl, data);
    const existedContent = fs.existsSync(targetFilePath)
      ? fs.readFileSync(targetFilePath).toString()
      : '';
    if (content === existedContent) {
      continue;
    }
    verbose && console.log(`Writing template file: ${targetFilePath}`);
    fs.writeFileSync(targetFilePath, content);
  }
}

const program = new Command();

program
  .name('abc')
  .description('Algo Bootstrap CLI')
  .version(appVersion)
  .argument('<paths...>', 'paths to be opened')
  .option('-v, --verbose', 'show verbose output')
  .action(async (paths, options) => {
    verbose = options.verbose;
    let config = readConfig();
    const codePath = await findCodePath();
    const resolvedPaths = paths.map((p) => path.resolve(p));
    const dirs = [];
    for (const p of resolvedPaths) {
      if (fs.existsSync(p)) {
        if (fs.statSync(p).isDirectory()) {
          dirs.push(p);
        }
        continue;
      }
      if (path.extname(p) === '') {
        fs.mkdirSync(p, { recursive: true });
        dirs.push(p);
        verbose && console.log(`Created directory: ${p}`);
        continue;
      }
    }

    if (verbose) {
      if (!config) {
        console.log('No config found');
      } else {
        console.log(
          `Current config:\n${JSON.stringify(
            {
              uid: config?.uid,
              completionState: config?.completionState,
              vscProfileName: config?.vscProfileName,
              vscProfileDir: config?.vscProfileDir,
              gccAlternative: config?.gccAlternative,
            },
            null,
            2,
          )}`,
        );
      }
      console.log('\nEnvironments:');
      console.log(`- App Version: ${appVersion}`);
      console.log(`- Platform Arch: ${process.platform}-${process.arch}`);
      console.log(`- Node.js: ${process.version}`);
      console.log(`- Electron: ${isElectron ? `${process.versions.electron}` : 'No'}`);
      console.log(`- Config file: ${getConfigPath() || 'N/A'}`);
      console.log(`- VS Code Bin: ${codePath || 'N/A'}`);
      console.log(`- VS Code Profile Name: ${config?.vscProfileName || 'N/A'}`);
      console.log(`\nPaths to be opened:`);
      resolvedPaths.forEach((p) => {
        console.log(`- ${p}`);
      });
      console.log();
    }

    if (!codePath) {
      console.error(
        'VS Code is not installed or not found in PATH, please re-configure in Algo Bootstrap',
      );
      process.exit(1);
    }

    if (!config?.vscProfileName) {
      console.error('VS Code profile name is not set, please re-configure in Algo Bootstrap');
      process.exit(1);
    }

    if (dirs.length > 0) {
      for (const dir of dirs) {
        await genProjectFiles(dir);
      }
    }

    const args = [
      ...resolvedPaths.map((p) => `"${p}"`),
      '--profile',
      `"${config?.vscProfileName}"`,
    ];
    if (verbose) {
      console.log('Opening VS Code:', `"${codePath}"`, args.join(' '));
    }
    await spawn(`"${codePath}"`, args, {
      cwd: process.cwd(),
      ...commonSpawnOptions,
    }).catch((e) => {
      console.error('Failed to open VS Code', e);
      process.exit(1);
    });

    if (dirs.length > 0) {
      config = readConfig();
      const newProjects = [];
      const projectMap = new Map();
      for (const project of config.projects || []) {
        if (!dirs.includes(project.id)) {
          newProjects.push(project);
        } else {
          projectMap.set(project.id, project);
        }
      }
      for (const dir of dirs) {
        const project = projectMap.get(dir);
        if (project) {
          newProjects.push(project);
        } else {
          newProjects.push({ id: dir, path: dir, createdAt: Date.now() });
        }
      }
      config.projects = newProjects;
      fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2));
    }
  });

program.parse(process.argv, { from: 'node' });
