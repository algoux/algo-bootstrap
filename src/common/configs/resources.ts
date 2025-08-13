export enum ResourceId {
  c_cpp = 'c_cpp',
  python = 'python',
  vscode = 'vscode',
  'vsix.divyanshuagrawal.competitive-programming-helper' = 'vsix.divyanshuagrawal.competitive-programming-helper',
  'vsix.editorconfig.editorconfig' = 'vsix.editorconfig.editorconfig',
  'vsix.formulahendry.code-runner' = 'vsix.formulahendry.code-runner',
  'vsix.ms-ceintl.vscode-language-pack-zh-hans' = 'vsix.ms-ceintl.vscode-language-pack-zh-hans',
  'vsix.ms-python.debugpy' = 'vsix.ms-python.debugpy',
  'vsix.ms-python.python' = 'vsix.ms-python.python',
  'vsix.ms-python.vscode-pylance' = 'vsix.ms-python.vscode-pylance',
  'vsix.ms-python.vscode-python-envs' = 'vsix.ms-python.vscode-python-envs',
  'vsix.ms-vscode.cpptools' = 'vsix.ms-vscode.cpptools',
  'vsix.qiumingge.cpp-check-lint' = 'vsix.qiumingge.cpp-check-lint',
  'vsix.streetsidesoftware.code-spell-checker' = 'vsix.streetsidesoftware.code-spell-checker',
  'vsix.usernamehw.errorlens' = 'vsix.usernamehw.errorlens',
  'vsix.vadimcn.vscode-lldb' = 'vsix.vadimcn.vscode-lldb',
  'deps.cppcheck' = 'deps.cppcheck',
  'deps.cpplint' = 'deps.cpplint',
}

export const resourceIds = Object.values(ResourceId);

export type SupportedResourceId = keyof typeof ResourceId;

export const resourcesIndexPathMap = {
  [ResourceId.c_cpp]: 'c_cpp/index.json',
  [ResourceId.python]: 'python/index.json',
  [ResourceId.vscode]: 'vscode/index.json',
  [ResourceId['vsix.divyanshuagrawal.competitive-programming-helper']]:
    'vsix/divyanshuagrawal.competitive-programming-helper/index.json',
  [ResourceId['vsix.editorconfig.editorconfig']]: 'vsix/editorconfig.editorconfig/index.json',
  [ResourceId['vsix.formulahendry.code-runner']]: 'vsix/formulahendry.code-runner/index.json',
  [ResourceId['vsix.ms-ceintl.vscode-language-pack-zh-hans']]:
    'vsix/ms-ceintl.vscode-language-pack-zh-hans/index.json',
  [ResourceId['vsix.ms-python.debugpy']]: 'vsix/ms-python.debugpy/index.json',
  [ResourceId['vsix.ms-python.python']]: 'vsix/ms-python.python/index.json',
  [ResourceId['vsix.ms-python.vscode-pylance']]: 'vsix/ms-python.vscode-pylance/index.json',
  [ResourceId['vsix.ms-python.vscode-python-envs']]: 'vsix/ms-python.vscode-python-envs/index.json',
  [ResourceId['vsix.ms-vscode.cpptools']]: 'vsix/ms-vscode.cpptools/index.json',
  [ResourceId['vsix.qiumingge.cpp-check-lint']]: 'vsix/qiumingge.cpp-check-lint/index.json',
  [ResourceId['vsix.streetsidesoftware.code-spell-checker']]:
    'vsix/streetsidesoftware.code-spell-checker/index.json',
  [ResourceId['vsix.usernamehw.errorlens']]: 'vsix/usernamehw.errorlens/index.json',
  [ResourceId['vsix.vadimcn.vscode-lldb']]: 'vsix/vadimcn.vscode-lldb/index.json',
  [ResourceId['deps.cppcheck']]: 'deps/cppcheck/index.json',
  [ResourceId['deps.cpplint']]: 'deps/cpplint/index.json',
};

export interface ResourceIndexValue {
  version: string;
  path: string;
  md5: string;
  size: number;
  updatedAt: string;
}

export type ResourceIndexItem = Record<string, ResourceIndexValue>;
