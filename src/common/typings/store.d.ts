interface IAppConf {
  uid: string;
  completionState?: {
    timestamp: number; // ms timestamp,
    version: string;
  };
  vscProfileDir?: string;
  vscProfileName?: string;
  gccAlternative?: { command: string; path: string; type: 'gcc' | 'clang' };
  initTemplate: Record</** lang */ string, /** content */ string>;
  projects: {
    id: string;
    path: string;
    createdAt: number; // ms timestamp
  }[];
}
