import { EnvComponentModule } from '@/typings/env';

const pages = {
  index: '/',
  test: '/test',
  preparation: {
    index: '/preparation',
    configuration: '/preparation/configuration',
    respack: '/preparation/respack',
  },
  installer: {
    gcc: '/installer/gcc',
    python: '/installer/python',
    cpplint: '/installer/cpplint',
    vscode: '/installer/vscode',
    vsix: '/installer/vsix',
    ext: '/installer/ext',
    magic: '/installer/magic',
  },
  configurationModule: {
    [EnvComponentModule.c_cpp]: '/configuration/c_cpp',
    [EnvComponentModule.python]: '/configuration/python',
    [EnvComponentModule.vscode]: '/configuration/vscode',
    [EnvComponentModule.extensions]: '/configuration/extensions',
    [EnvComponentModule.magic]: '/configuration/magic',
  },
  board: '/board',
  settings: '/settings',
};

export default pages;
