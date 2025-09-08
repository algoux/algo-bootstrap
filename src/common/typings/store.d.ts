interface IAppConf {
  uid: string;
  gccAlternative?: { command: string; path: string; type: 'gcc' | 'clang' };
  vscProfileDir?: string;
  vscProfileName?: string;
  initTemplate: Record</** lang */ string, /** content */ string>;
}
