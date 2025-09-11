import { EnvComponentModule } from '@/typings/env';

const pages = {
  index: '/',
  preparation: {
    index: '/preparation',
    configuration: '/preparation/configuration',
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
