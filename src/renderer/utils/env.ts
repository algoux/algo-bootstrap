import sm from '@/utils/modules';
import pages from '@/configs/pages';
import { EnvIds, ResourceId, VSIXIdMap } from 'common/configs/resources';
import {
  EnvComponentAction,
  EnvComponentOptions,
  EnvComponentModule,
  EnvComponentModuleConfigStatus,
} from '@/typings/env';
import { EnvComponent } from 'common/configs/env';

export function isEnvInstalled(environments: IEnvironments, envId: SupportedEnvId) {
  return environments[envId].installed;
}

export function isVsixInstalled(environments: IEnvironments, vsixId: SupportedVSIXId) {
  return environments.vsix[vsixId].installed;
}

export function isVsixesInstalled(environments: IEnvironments, vsixIds: SupportedVSIXId[]) {
  let installed = true;
  for (const vsixId of vsixIds) {
    if (!isVsixInstalled(environments, vsixId)) {
      installed = false;
      break;
    }
  }
  return installed;
}

export function isAllInstalled(environments: IEnvironments) {
  // TODO
  return (
    environments.gcc.installed && environments.python.installed && environments.vscode.installed
  );
}

// export function getNextInstallerItem(environments: IEnvironments) {
//   const envIds = EnvIds.filter((envId) => envId !== 'gdb') as Array<Exclude<SupportedEnvId, 'gdb'>>;
//   for (const envId of envIds) {
//     if (!isEnvInstalled(environments, envId)) {
//       return envId;
//     }
//   }
//   if (!isVsixAllInstalled(environments)) {
//     return 'vsix';
//   }
//   return null;
// }

// export function getNextInstallerItemPage(environments: IEnvironments) {
//   const next = getNextInstallerItem(environments);
//   if (next) {
//     return pages.installer[next];
//   }
//   return pages.board;
// }

export function getNextConfigurationModuleItem(
  envConfigStatus: Record<EnvComponentModule, EnvComponentModuleConfigStatus>,
) {
  for (const module of Object.keys(envConfigStatus) as EnvComponentModule[]) {
    if (envConfigStatus[module] === EnvComponentModuleConfigStatus.PENDING) {
      return module;
    }
  }
  return null;
}

export function getNextConfigurationModulePage(
  envConfigStatus: Record<EnvComponentModule, EnvComponentModuleConfigStatus>,
) {
  const next = getNextConfigurationModuleItem(envConfigStatus);
  if (next) {
    return pages.configurationModule[next];
  }
  return pages.board;
}

export function needInstallEnvComponent(envConfig: EnvComponentConfig, envComponent: EnvComponent) {
  return [
    EnvComponentAction.INSTALL,
    EnvComponentAction.UPDATE,
    EnvComponentAction.REINSTALL,
  ].includes(envConfig[envComponent].action);
}

export function getRequiredResourceIdsByEnvComponentKey(
  envConfig: EnvComponentConfig,
  envComponent: EnvComponent,
) {
  if (needInstallEnvComponent(envConfig, envComponent)) {
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
          !resourceId.startsWith('vsix.') ||
          options.installVSIXIds!.includes(VSIXIdMap[resourceId]),
      );
    }
    return componentResourceIds;
  }
  return [];
}

export function getRequiredResourceIdsByEnvConfig(envConfig: EnvComponentConfig) {
  const resourceIds: ResourceId[] = [];
  for (const envComponent of Object.keys(envConfig) as EnvComponent[]) {
    resourceIds.push(...getRequiredResourceIdsByEnvComponentKey(envConfig, envComponent));
  }
  return resourceIds;
}
