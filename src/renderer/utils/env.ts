import sm from '@/utils/modules';
import pages from '@/configs/pages';
import { EnvIds, ResourceId, VSIXIdMap, VSIXIds } from 'common/configs/resources';
import { EnvComponentAction, EnvComponentOptions } from '@/typings/env';
import { EnvComponent } from 'common/configs/env';

export function isEnvInstalled(environments: IEnvironments, envId: SupportedEnvId) {
  return environments[envId].installed;
}

export function isVsixInstalled(environments: IEnvironments, vsixId: SupportedVSIXId) {
  return environments.vsix[vsixId].installed;
}

export function isVsixAllInstalled(environments: IEnvironments) {
  let installed = true;
  for (const vsixId of VSIXIds) {
    if (!isVsixInstalled(environments, vsixId)) {
      installed = false;
      break;
    }
  }
  return installed;
}

export function isAllInstalled(environments: IEnvironments) {
  return (
    environments.gcc.installed &&
    environments.python.installed &&
    environments.cpplint.installed &&
    environments.vscode.installed &&
    isVsixAllInstalled(environments)
  );
}

export function getNextInstallerItem(environments: IEnvironments) {
  const envIds = EnvIds.filter((envId) => envId !== 'gdb') as Array<Exclude<SupportedEnvId, 'gdb'>>;
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
  return pages.board;
}

export function getRequiredResourceIdsByEnvConfig(envConfig: EnvComponentConfig) {
  const resourceIds: ResourceId[] = [];
  for (const envComponent of Object.keys(envConfig) as EnvComponent[]) {
    if (
      [
        EnvComponentAction.INSTALL,
        EnvComponentAction.UPDATE,
        EnvComponentAction.REINSTALL,
      ].includes(envConfig[envComponent].action)
    ) {
      let componentResourceIds = sm.envComponents[envComponent as EnvComponent].resources;
      const options = (envConfig[envComponent].options || {}) as EnvComponentOptions;
      if (envComponent === EnvComponent.codeStyleExtensions && !options.installCppcheck) {
        componentResourceIds = componentResourceIds.filter(
          (resourceId) => resourceId !== ResourceId['deps.cppcheck'],
        );
      }
      if (envComponent === EnvComponent.codeStyleExtensions && !options.installCpplint) {
        componentResourceIds = componentResourceIds.filter(
          (resourceId) => resourceId !== ResourceId['deps.cpplint'],
        );
      }
      if (Array.isArray(options.installVSIXIds)) {
        componentResourceIds = componentResourceIds.filter(
          (resourceId) =>
            resourceId.startsWith('vsix.') &&
            options.installVSIXIds!.includes(VSIXIdMap[resourceId]),
        );
      }
      resourceIds.push(...componentResourceIds);
    }
  }
  return resourceIds;
}
