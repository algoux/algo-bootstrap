import sm from '@/utils/modules';

export function isVsixAllInstalled(environments: IEnvironments) {
  let installed = true;
  for (const vsixId of sm.envChecker.VSIXIds) {
    if (!environments.vsix[vsixId].installed) {
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
