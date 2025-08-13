import { ResourceId } from './resources';

export interface SystemEnvInfo {
  platform: 'win32' | 'darwin';
  arch: 'x64' | 'arm64';
}

type EnvComponentCondition = (env: SystemEnvInfo) => boolean;

type EnvComponentConfig = Record<
  EnvComponent,
  {
    resources: ResourceId[];
    required?: boolean;
    conditionalResources?: {
      condition: EnvComponentCondition;
      resources: ResourceId[];
    }[];
  }
>;

export type EnvComponentConfigParsed = Record<
  EnvComponent,
  {
    resources: ResourceId[];
    required?: boolean;
  }
>;

export enum EnvComponent {
  c_cpp = 'c_cpp',
  python = 'python',
  vscode = 'vscode',
  basicExtensions = 'basicExtensions',
  codeStyleExtensions = 'codeStyleExtensions',
  languagePackages = 'languagePackages',
}

const envComponents: EnvComponentConfig = {
  [EnvComponent.c_cpp]: {
    resources: [],
    conditionalResources: [
      {
        condition: (env) => env.platform === 'win32',
        resources: [ResourceId.c_cpp],
      },
    ],
    required: true,
  },
  [EnvComponent.python]: {
    resources: [],
    conditionalResources: [
      {
        condition: (env) => env.platform === 'win32',
        resources: [ResourceId.python],
      },
    ],
    required: true,
  },
  [EnvComponent.vscode]: {
    resources: [ResourceId.vscode],
    required: true,
  },
  [EnvComponent.basicExtensions]: {
    resources: [
      ResourceId['vsix.divyanshuagrawal.competitive-programming-helper'],
      ResourceId['vsix.editorconfig.editorconfig'],
      ResourceId['vsix.formulahendry.code-runner'],
      ResourceId['vsix.ms-python.debugpy'],
      ResourceId['vsix.ms-python.python'],
      ResourceId['vsix.ms-python.vscode-pylance'],
      ResourceId['vsix.ms-python.vscode-python-envs'],
      ResourceId['vsix.ms-vscode.cpptools'],
      ResourceId['vsix.streetsidesoftware.code-spell-checker'],
      ResourceId['vsix.usernamehw.errorlens'],
    ],
    conditionalResources: [
      {
        condition: (env) => env.platform === 'darwin',
        resources: [ResourceId['vsix.vadimcn.vscode-lldb']],
      },
    ],
    required: true,
  },
  [EnvComponent.codeStyleExtensions]: {
    resources: [
      ResourceId['vsix.qiumingge.cpp-check-lint'],
      ResourceId['deps.cppcheck'],
      ResourceId['deps.cpplint'],
    ],
  },
  [EnvComponent.languagePackages]: {
    resources: [ResourceId['vsix.ms-ceintl.vscode-language-pack-zh-hans']],
  },
};

export function getEnvComponents(env: SystemEnvInfo): EnvComponentConfigParsed {
  // @ts-ignore
  const result: EnvComponentConfigParsed = {};
  Object.entries(envComponents).forEach(([component, config]) => {
    const resources = [...config.resources];
    if (config.conditionalResources) {
      resources.push(
        ...config.conditionalResources
          .filter(({ condition }) => condition(env))
          .flatMap(({ resources }) => resources),
      );
    }
    result[component] = {
      resources,
      required: config.required,
    };
  });
  return result;
}
