import sm from '@/utils/modules';
import pages from '@/configs/pages';

export function isEnvInstalled(environments: IEnvironments, envId: SupportedEnvId) {
  return environments[envId].installed;
}

export function isVsixInstalled(environments: IEnvironments, vsixId: SupportedVSIXId) {
  return environments.vsix[vsixId].installed;
}

export function isVsixAllInstalled(environments: IEnvironments) {
  let installed = true;
  for (const vsixId of sm.envChecker.VSIXIds) {
    if (!isVsixInstalled(environments, vsixId)) {
      installed = false;
      break;
    }
  }
  return installed;
}

export function isAllInstalled(environments: IEnvironments) {
  return environments.gcc.installed &&
    environments.python.installed &&
    environments.cpplint.installed &&
    environments.code.installed &&
    isVsixAllInstalled(environments);
}

export function getNextInstallerItem(environments: IEnvironments) {
  const envIds = sm.envChecker.EnvIds.filter(envId => envId !== 'gdb') as Array<Exclude<SupportedEnvId, 'gdb'>>;
  for (const envId of envIds) {
    if (!isEnvInstalled(environments, envId)) {
      return envId;
    }
  }
  if (!isVsixAllInstalled(environments)) {
    return 'vsix';
  }
  return null;
}

export function getNextInstallerItemPage(environments: IEnvironments) {
  const next = getNextInstallerItem(environments);
  if (next) {
    return pages.installer[next];
  }
  return pages.projects;
}
