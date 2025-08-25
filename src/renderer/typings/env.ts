import { EnvComponent } from 'common/configs/env';

export enum EnvComponentAction {
  DISABLE = 'DISABLE',
  SKIP = 'SKIP',
  INSTALL = 'INSTALL',
  UPDATE = 'UPDATE',
  REINSTALL = 'REINSTALL',
  SWITCH_INSTALLED = 'SWITCH_INSTALLED',
}

export interface IEnvComponentUIOption {
  type: EnvComponentAction;
  label: string;
  value: string; // unique value for each option
  meta?: any;
}

interface EnvComponentOptionsBase {
  useGccAlt?: {
    command: string;
    path: string;
    type: 'gcc' | 'clang';
  };
  installVSIXIds?: SupportedVSIXId[];
  installCppcheck?: boolean;
  installCpplint?: boolean;
}

export type EnvComponentOptions<
  K extends keyof EnvComponentOptionsBase = keyof EnvComponentOptionsBase,
> = Pick<EnvComponentOptionsBase, K>;

export interface EnvComponentConfigItem<
  K extends keyof EnvComponentOptionsBase = keyof EnvComponentOptionsBase,
> {
  action: EnvComponentAction;
  options?: EnvComponentOptions<K>;
}

export interface EnvComponentConfig {
  [EnvComponent.c_cpp]: EnvComponentConfigItem<'useGccAlt'>;
  [EnvComponent.python]: EnvComponentConfigItem<never>;
  [EnvComponent.vscode]: EnvComponentConfigItem<never>;
  [EnvComponent.basicExtensions]: EnvComponentConfigItem<'installVSIXIds'>;
  [EnvComponent.codeStyleExtensions]: EnvComponentConfigItem<
    'installCppcheck' | 'installCpplint' | 'installVSIXIds'
  >;
  [EnvComponent.languagePackages]: EnvComponentConfigItem<'installVSIXIds'>;
}

export enum EnvComponentModule {
  c_cpp = 'c_cpp',
  python = 'python',
  vscode = 'vscode',
  extensions = 'extensions',
  magic = 'magic',
}

export enum EnvComponentModuleConfigStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
}
