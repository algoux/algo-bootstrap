import React from 'react';
import { connect } from '@/utils/dva';
import router from 'umi/router';
import { Row, Col, Progress, Icon } from 'antd';
import ActionBar from '@/components/ActionBar';
import ExternalLink from '@/components/ExternalLink';
import sm from '@/utils/modules';
import c_cppIcon from '@/assets/icons/c_cpp.png';
import pythonIcon from '@/assets/icons/python.svg';
import cpplintIcon from '@/assets/icons/lint.svg';
import vscodeIcon from '@/assets/icons/vscode.svg';
import vscodeExtensionIcon from '@/assets/icons/vscode-extension.svg';
import languageIcon from '@/assets/icons/language.svg';
import EnvCard from '@/components/EnvCard';
import { getNextInstallerItemPage, getRequiredResourceIdsByEnvConfig } from '@/utils/env';
import { logRenderer } from '@/utils/logger';
import msg from '@/utils/msg';
import { formatMessage } from 'umi-plugin-locale';
import { DispatchProps } from '@/typings/props';
import { ipcRenderer as ipc } from 'electron-better-ipc';
import ipcKeys from 'common/configs/ipc';
import { PathKey } from 'common/configs/paths';
import * as path from 'path';
import { formatFileSize, formatPercentage } from 'common/utils/format';
import { ResourceId, ResourceIndexItem, VSIXIdMap } from 'common/configs/resources';
import { compare } from 'compare-versions';
import { EnvComponent } from 'common/configs/env';
import { EnvComponentAction, IEnvComponentUIOption } from '@/typings/env';
import { cloneDeep } from 'lodash';
import api from 'common/configs/apis';

enum ResourceStatus {
  PENDING = 'PENDING',
  DOWNLOADABLE = 'DOWNLOADABLE',
  DOWNLOADING = 'DOWNLOADING',
  READY = 'READY',
  ERROR = 'ERROR',
}

interface IEnvComponentUIConfig {
  enabled: boolean;
  installed: boolean | 'partial';
  version?: string;
  latestVersion?: string;
  updateAvailable?: boolean;
  options: IEnvComponentUIOption[];
  defaultOption: string;
}

interface IEnvComponentUIConfigState extends IEnvComponentUIConfig {
  selectedOption: string;
}

export interface IConfigurationProps {}

interface State {
  downloadTaskId: number;
  downloading: boolean;
  receivedSize: number;
  totalSize: number;
  speed: number;
  config: {
    [key in EnvComponent]: IEnvComponentUIConfigState;
  };
  usingResourceIds: ResourceId[];
  resourceStatusMap: Partial<Record<ResourceId, ResourceStatus>>;
  estimatedDownloadSize: number;
  validating: boolean;
}

type Props = IConfigurationProps & ReturnType<typeof mapStateToProps> & DispatchProps;

class Configuration extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const c_cppConfig = this.getC_CppConfig(props);
    const pythonConfig = this.getPythonConfig(props);
    const vscodeConfig = this.getVscodeConfig(props);
    const basicExtensionsConfig = this.getBasicExtensionsConfig(props);
    const codeStyleExtensionsConfig = this.getCodeStyleExtensionsConfig(props);
    const languagePackagesConfig = this.getLanguagePackagesConfig(props);

    this.state = {
      downloadTaskId: 0,
      downloading: false,
      receivedSize: 0,
      totalSize: 0,
      speed: 0,
      // @ts-ignore
      config: {
        [EnvComponent.c_cpp]: {
          ...c_cppConfig,
          selectedOption: c_cppConfig.defaultOption,
        },
        [EnvComponent.python]: {
          ...pythonConfig,
          selectedOption: pythonConfig.defaultOption,
        },
        [EnvComponent.vscode]: {
          ...vscodeConfig,
          selectedOption: vscodeConfig.defaultOption,
        },
        [EnvComponent.basicExtensions]: {
          ...basicExtensionsConfig,
          selectedOption: basicExtensionsConfig.defaultOption,
        },
        [EnvComponent.codeStyleExtensions]: {
          ...codeStyleExtensionsConfig,
          selectedOption: codeStyleExtensionsConfig.defaultOption,
        },
        [EnvComponent.languagePackages]: {
          ...languagePackagesConfig,
          selectedOption: languagePackagesConfig.defaultOption,
        },
      },
      usingResourceIds: [],
      resourceStatusMap: {},
      estimatedDownloadSize: 0,
      validating: false,
    };
  }

  getC_CppConfig(props?: Props) {
    const { environments, resourceIndex } = props ?? this.props;
    const gcc = environments.gcc;
    if (!gcc.installed) {
      return {
        enabled: true,
        installed: false,
        latestVersion:
          resourceIndex.c_cpp?.version ?? (sm.platform.isMac ? 'Xcode CLT' : undefined),
        options: [
          {
            type: EnvComponentAction.INSTALL,
            label: '安装',
            value: EnvComponentAction.INSTALL,
          },
        ],
        defaultOption: EnvComponentAction.INSTALL,
      };
    }

    const currentPlatformArch = sm.platform.currentPlatformArch;
    const currentSupportedGccType = {
      'win32-x64': 'gcc',
      'win32-arm64': 'clang',
      'darwin-x64': 'clang',
      'darwin-arm64': 'clang',
    }[currentPlatformArch];
    const isGccVerComparable =
      gcc.meta.type === currentSupportedGccType && resourceIndex.c_cpp?.version;
    const updateAvailable = isGccVerComparable
      ? compare(gcc.version, resourceIndex.c_cpp.version, '<')
      : false;
    const options: IEnvComponentUIOption[] = [];
    options.push({
      type: EnvComponentAction.SKIP,
      label: `使用默认 gcc: ${gcc.version} (${gcc.meta.type})`,
      value: EnvComponentAction.SKIP,
    });
    if (updateAvailable) {
      options.push({
        type: EnvComponentAction.UPDATE,
        label: `更新到：${resourceIndex.c_cpp.version} (${currentSupportedGccType})`,
        value: EnvComponentAction.UPDATE,
      });
    }
    if (gcc.meta.type !== currentSupportedGccType && resourceIndex.c_cpp?.version) {
      options.push({
        type: EnvComponentAction.REINSTALL,
        label: `替换安装：${resourceIndex.c_cpp.version} (${currentSupportedGccType})`,
        value: EnvComponentAction.REINSTALL,
      });
    }
    if (gcc.meta.alternatives.length > 0) {
      gcc.meta.alternatives.forEach((alt) => {
        options.push({
          type: EnvComponentAction.SWITCH_INSTALLED,
          label: `使用 ${alt.command}: ${alt.version} (${alt.type})`,
          value: `${EnvComponentAction.SWITCH_INSTALLED}-${alt.command}`,
          meta: {
            ...alt,
            desc: `${alt.command}: ${alt.version} (${alt.type})`,
          },
        });
      });
    }

    const gccConfig = {
      enabled: true,
      installed: true,
      version: `${gcc.version} (${gcc.meta.type})`,
      latestVersion: isGccVerComparable
        ? `${resourceIndex.c_cpp.version} (${currentSupportedGccType})`
        : undefined,
      updateAvailable,
      options,
      defaultOption: EnvComponentAction.SKIP,
    };
    return gccConfig;
  }

  getPythonConfig(props?: Props) {
    const { environments, resourceIndex } = props ?? this.props;
    const python = environments.python;
    if (!python.installed) {
      return {
        enabled: true,
        installed: false,
        latestVersion:
          resourceIndex.python?.version ?? (sm.platform.isMac ? 'Xcode CLT' : undefined),
        options: [
          {
            type: EnvComponentAction.INSTALL,
            label: '安装',
            value: EnvComponentAction.INSTALL,
          },
        ],
        defaultOption: EnvComponentAction.INSTALL,
      };
    }

    const updateAvailable = resourceIndex.python?.version
      ? compare(python.version, resourceIndex.python?.version, '<')
      : false;
    const options: IEnvComponentUIOption[] = [];
    options.push({
      type: EnvComponentAction.SKIP,
      label: `使用默认 ${python.meta.command}: ${python.version}`,
      value: EnvComponentAction.SKIP,
    });
    if (updateAvailable) {
      options.push({
        type: EnvComponentAction.UPDATE,
        label: `更新到：${resourceIndex.python.version}`,
        value: EnvComponentAction.UPDATE,
      });
    }

    const pythonConfig = {
      enabled: true,
      installed: true,
      version: python.version,
      latestVersion: updateAvailable ? resourceIndex.python.version : undefined,
      updateAvailable,
      options,
      defaultOption: EnvComponentAction.SKIP,
    };
    return pythonConfig;
  }

  getVscodeConfig(props?: Props) {
    const { environments, resourceIndex } = props ?? this.props;
    const vscode = environments.vscode;
    if (!vscode.installed) {
      return {
        enabled: true,
        installed: false,
        latestVersion: resourceIndex.vscode?.version,
        options: [
          {
            type: EnvComponentAction.INSTALL,
            label: '安装',
            value: EnvComponentAction.INSTALL,
          },
        ],
        defaultOption: EnvComponentAction.INSTALL,
      };
    }

    const updateAvailable = resourceIndex.vscode?.version
      ? compare(vscode.version, resourceIndex.vscode?.version, '<')
      : false;
    const options: IEnvComponentUIOption[] = [];
    options.push({
      type: EnvComponentAction.SKIP,
      label: `使用已安装: ${vscode.version}`,
      value: EnvComponentAction.SKIP,
    });
    if (updateAvailable) {
      options.push({
        type: EnvComponentAction.UPDATE,
        label: `更新到：${resourceIndex.vscode.version}`,
        value: EnvComponentAction.UPDATE,
      });
    }

    const vscodeConfig = {
      enabled: true,
      installed: true,
      version: vscode.version,
      latestVersion: updateAvailable ? resourceIndex.vscode.version : undefined,
      updateAvailable,
      options,
      defaultOption: EnvComponentAction.SKIP,
    };
    return vscodeConfig;
  }

  getBasicExtensionsConfig(props?: Props) {
    const { requiredVSIXIds, installedVSIXIds, needInstallVSIXIds } =
      this.getEnvComponentRelativeVSIXIds(EnvComponent.basicExtensions, props);
    const needInstall = needInstallVSIXIds.length > 0;
    const options: IEnvComponentUIOption[] = [];
    if (!needInstall) {
      options.push({
        type: EnvComponentAction.SKIP,
        label: '保持已安装的扩展',
        value: EnvComponentAction.SKIP,
      });
    } else {
      options.push({
        type: EnvComponentAction.INSTALL,
        label: '安装扩展',
        value: EnvComponentAction.INSTALL,
        meta: {
          installVSIXIds: needInstallVSIXIds,
        },
      });
    }

    return {
      enabled: true,
      installed: (installedVSIXIds.length === requiredVSIXIds.length
        ? true
        : installedVSIXIds.length > 0
          ? 'partial'
          : false) as boolean | 'partial',
      version: `${installedVSIXIds.length}/${requiredVSIXIds.length} 个扩展`,
      latestVersion: `${requiredVSIXIds.length - installedVSIXIds.length} 个扩展`,
      options,
      defaultOption: needInstall ? EnvComponentAction.INSTALL : EnvComponentAction.SKIP,
    };
  }

  getCodeStyleExtensionsConfig(props?: Props) {
    const { environments } = props ?? this.props;
    const cppcheck = environments.cppcheck;
    const cpplint = environments.cpplint;
    const requiredResourcesIds = sm.envComponents[EnvComponent.codeStyleExtensions].resources;
    const { installedVSIXIds, needInstallVSIXIds } = this.getEnvComponentRelativeVSIXIds(
      EnvComponent.codeStyleExtensions,
      props,
    );
    const needInstallCppcheck =
      requiredResourcesIds.includes(ResourceId['deps.cppcheck']) && !cppcheck.installed;
    const needInstallCpplint =
      requiredResourcesIds.includes(ResourceId['deps.cpplint']) && !cpplint.installed;
    const needInstall = needInstallCppcheck || needInstallCpplint || needInstallVSIXIds.length > 0;

    const options: IEnvComponentUIOption[] = [];
    if (!needInstall) {
      options.push({
        type: EnvComponentAction.SKIP,
        label: '保持已安装',
        value: EnvComponentAction.SKIP,
      });
    } else {
      options.push({
        type: EnvComponentAction.INSTALL,
        label: '选用此组件',
        value: EnvComponentAction.INSTALL,
        meta: {
          installCppcheck: needInstallCppcheck,
          installCpplint: needInstallCpplint,
          installVSIXIds: needInstallVSIXIds,
        },
      });
      options.push({
        type: EnvComponentAction.DISABLE,
        label: '略过此组件',
        value: EnvComponentAction.DISABLE,
      });
    }

    let versionItems: string[] = [];
    if (cppcheck.installed) {
      versionItems.push(`ch ${cppcheck.version}`);
    }
    if (cpplint.installed) {
      versionItems.push(`li ${cpplint.version}`);
    }
    if (installedVSIXIds.length > 0) {
      versionItems.push(`${installedVSIXIds.length} ext`);
    }

    const latestVersionItems: string[] = [];
    const depsCount = (needInstallCppcheck ? 1 : 0) + (needInstallCpplint ? 1 : 0);
    if (depsCount > 0) {
      latestVersionItems.push(`${depsCount} 个依赖`);
    }
    if (needInstallVSIXIds.length > 0) {
      latestVersionItems.push(`${needInstallVSIXIds.length} 个扩展`);
    }

    return {
      enabled: true,
      installed: (!needInstall
        ? true
        : needInstallCppcheck && needInstallCpplint && installedVSIXIds.length === 0
          ? false
          : 'partial') as boolean | 'partial',
      version: versionItems.join(', ') || undefined,
      latestVersion: latestVersionItems.join('、') || undefined,
      options,
      defaultOption: needInstall ? EnvComponentAction.INSTALL : EnvComponentAction.SKIP,
    };
  }

  getLanguagePackagesConfig(props?: Props) {
    const { requiredVSIXIds, installedVSIXIds, needInstallVSIXIds } =
      this.getEnvComponentRelativeVSIXIds(EnvComponent.languagePackages, props);
    const needInstall = needInstallVSIXIds.length > 0;
    const options: IEnvComponentUIOption[] = [];
    if (!needInstall) {
      options.push({
        type: EnvComponentAction.SKIP,
        label: '保持已安装的扩展',
        value: EnvComponentAction.SKIP,
      });
    } else {
      options.push({
        type: EnvComponentAction.INSTALL,
        label: '选用此组件',
        value: EnvComponentAction.INSTALL,
        meta: {
          installVSIXIds: needInstallVSIXIds,
        },
      });
      options.push({
        type: EnvComponentAction.DISABLE,
        label: '略过此组件',
        value: EnvComponentAction.DISABLE,
      });
    }

    return {
      enabled: true,
      installed: (installedVSIXIds.length === requiredVSIXIds.length
        ? true
        : installedVSIXIds.length > 0
          ? 'partial'
          : false) as boolean | 'partial',
      // version: `${installedVSIXIds.length}/${requiredVSIXIds.length} 个扩展`,
      latestVersion: `${requiredVSIXIds.length - installedVSIXIds.length} 个扩展`,
      options,
      defaultOption: needInstall ? EnvComponentAction.INSTALL : EnvComponentAction.SKIP,
    };
  }

  getEnvComponentRelativeVSIXIds(envComponent: EnvComponent, props?: Props) {
    const { environments } = props ?? this.props;
    const vsix = environments.vsix;
    const requiredResourcesIds = sm.envComponents[envComponent].resources;
    const requiredVSIXIds = requiredResourcesIds
      // @ts-ignore
      .map((id) => VSIXIdMap[id])
      .filter(Boolean) as SupportedVSIXId[];
    const installedVSIXIds = Object.keys(vsix).filter(
      (id) =>
        requiredVSIXIds.includes(id as SupportedVSIXId) && vsix[id as SupportedVSIXId].installed,
    ) as SupportedVSIXId[];
    const needInstallVSIXIds = requiredVSIXIds.filter((id) => !installedVSIXIds.includes(id));
    return {
      requiredVSIXIds,
      installedVSIXIds,
      needInstallVSIXIds,
    };
  }

  componentDidMount() {
    logRenderer.info('[Configuration] initial config:', this.state.config);
    this.syncConfig();

    ipc.answerMain(ipcKeys.downloadTotalProgress, async (res) => {
      this.setState({
        receivedSize: res.received,
        totalSize: res.total,
        speed: res.speed,
      });
    });
    ipc.answerMain(ipcKeys.downloadDone, async (res) => {
      if (res.downloadTaskId === this.state.downloadTaskId) {
        // do nothing
      }
    });
    ipc.answerMain(ipcKeys.downloadError, async (res) => {
      if (res.downloadTaskId === this.state.downloadTaskId) {
        logRenderer.error('[configuration] downloadError:', res);
        sm.track.event('download', 'error');
      }
    });
    ipc.answerMain(ipcKeys.downloadFinished, async (res) => {
      if (res.downloadTaskId === this.state.downloadTaskId) {
        logRenderer.info('[configuration] downloadFinished:', res);
        await this.checkResourcesStatus().catch((e) => {
          logRenderer.error('[downloadFinished] checkResourcesStatus error:', e);
        });
        this.setState({
          downloading: false,
        });
      }
    });
  }

  setConfigOption = (key: EnvComponent, optionValue: string) => {
    this.setState(
      {
        config: {
          ...this.state.config,
          [key]: { ...this.state.config[key], selectedOption: optionValue },
        },
      },
      () => {
        this.syncConfig();
      },
    );
  };

  syncConfig = async () => {
    const { config } = this.state;
    const findSelectedOption = (options: IEnvComponentUIOption[], selectedOption: string) => {
      return options.find((option) => option.value === selectedOption)!;
    };

    const c_cppOption = findSelectedOption(
      config[EnvComponent.c_cpp].options,
      config[EnvComponent.c_cpp].selectedOption,
    );
    const pythonOption = findSelectedOption(
      config[EnvComponent.python].options,
      config[EnvComponent.python].selectedOption,
    );
    const vscodeOption = findSelectedOption(
      config[EnvComponent.vscode].options,
      config[EnvComponent.vscode].selectedOption,
    );
    const basicExtensionsOption = findSelectedOption(
      config[EnvComponent.basicExtensions].options,
      config[EnvComponent.basicExtensions].selectedOption,
    );
    const codeStyleExtensionsOption = findSelectedOption(
      config[EnvComponent.codeStyleExtensions].options,
      config[EnvComponent.codeStyleExtensions].selectedOption,
    );
    const languagePackagesOption = findSelectedOption(
      config[EnvComponent.languagePackages].options,
      config[EnvComponent.languagePackages].selectedOption,
    );

    const envComponentConfig: EnvComponentConfig = {
      [EnvComponent.c_cpp]: {
        action: c_cppOption.type,
        options: {
          useGccAlt:
            c_cppOption.type === EnvComponentAction.SWITCH_INSTALLED
              ? {
                  command: c_cppOption.meta.command,
                  path: c_cppOption.meta.path,
                  type: c_cppOption.meta.type,
                }
              : undefined,
        },
      },
      [EnvComponent.python]: {
        action: pythonOption.type,
      },
      [EnvComponent.vscode]: {
        action: vscodeOption.type,
      },
      [EnvComponent.basicExtensions]: {
        action: basicExtensionsOption.type,
        options: {
          installVSIXIds: basicExtensionsOption.meta?.installVSIXIds,
        },
      },
      [EnvComponent.codeStyleExtensions]: {
        action: codeStyleExtensionsOption.type,
        options: {
          installCppcheck: codeStyleExtensionsOption.meta?.installCppcheck,
          installCpplint: codeStyleExtensionsOption.meta?.installCpplint,
          installVSIXIds: codeStyleExtensionsOption.meta?.installVSIXIds,
        },
      },
      [EnvComponent.languagePackages]: {
        action: languagePackagesOption.type,
        options: {
          installVSIXIds: languagePackagesOption.meta?.installVSIXIds,
        },
      },
    };

    logRenderer.info('[configuration] sync envComponentConfig:', envComponentConfig);
    await this.props.dispatch({
      type: 'env/setConfig',
      payload: { config: envComponentConfig },
    });

    const usingResourceIds = getRequiredResourceIdsByEnvConfig(envComponentConfig);
    logRenderer.info('[configuration] usingResourceIds:', usingResourceIds);
    this.setState({
      usingResourceIds,
    });

    await this.checkResourcesStatus();
  };

  checkResourcesStatus = async () => {
    const { resourceIndex } = this.props;
    const { usingResourceIds } = this.state;
    const newResourceStatusMap: Partial<Record<ResourceId, ResourceStatus>> = cloneDeep(
      this.state.resourceStatusMap,
    );
    const precheckResourceIds: ResourceId[] = [];
    for (const resourceId of usingResourceIds) {
      if (!newResourceStatusMap[resourceId]) {
        newResourceStatusMap[resourceId] = ResourceStatus.PENDING;
      }
      if (!resourceIndex[resourceId]) {
        newResourceStatusMap[resourceId] = ResourceStatus.ERROR;
        continue;
      }
      if (
        newResourceStatusMap[resourceId] === ResourceStatus.PENDING ||
        newResourceStatusMap[resourceId] === ResourceStatus.DOWNLOADABLE
      ) {
        precheckResourceIds.push(resourceId);
      }
    }

    if (precheckResourceIds.length > 0) {
      try {
        this.setState({
          validating: true,
        });
        const checkRes = await sm.resources.checkValidResourceDownloadCache(
          precheckResourceIds.map((resourceId) => ({
            resourceId,
            filename: path.basename(resourceIndex[resourceId].path),
            md5: resourceIndex[resourceId].md5,
          })),
        );
        for (const resourceId in checkRes) {
          if (checkRes[resourceId as ResourceId]) {
            newResourceStatusMap[resourceId as ResourceId] = ResourceStatus.READY;
          } else {
            newResourceStatusMap[resourceId as ResourceId] = ResourceStatus.DOWNLOADABLE;
          }
        }
      } catch (e) {
        precheckResourceIds.forEach((resourceId) => {
          newResourceStatusMap[resourceId] = ResourceStatus.ERROR;
        });
        logRenderer.error('[configuration] checkValidResourceDownloadCache error:', e);
        msg.error('资源校验失败，请重启应用或查看帮助');
      } finally {
        this.setState({
          validating: false,
        });
      }
    }

    let estimatedDownloadSize = 0;
    for (const resourceId of usingResourceIds) {
      if (newResourceStatusMap[resourceId] === ResourceStatus.DOWNLOADABLE) {
        estimatedDownloadSize += resourceIndex[resourceId as ResourceId].size;
      }
    }

    logRenderer.info('[configuration] resourceStatusMap:', newResourceStatusMap);
    this.setState({
      resourceStatusMap: newResourceStatusMap,
      estimatedDownloadSize,
    });
  };

  downloadResources = async () => {
    const { resourceIndex } = this.props;
    const { usingResourceIds, resourceStatusMap } = this.state;
    const needDownloadResourceIds = usingResourceIds.filter(
      (resourceId) => resourceStatusMap[resourceId] === ResourceStatus.DOWNLOADABLE,
    );
    if (needDownloadResourceIds.length === 0) {
      return;
    }
    const needDownloadResources = needDownloadResourceIds.map(
      (resourceId) => resourceIndex[resourceId as ResourceId],
    );

    if (needDownloadResources.some((resource) => !resource)) {
      logRenderer.error(
        '[downloadResources] get resource address failed',
        needDownloadResources.filter((resource) => !resource),
      );
      msg.error('获取资源地址失败，请重启应用或查看帮助');
      return;
    }

    logRenderer.info('[configuration] needDownloadResources:', needDownloadResources);
    const downloadRequests = needDownloadResources.map((resource) => ({
      url: api.res.base + resource.path,
      directory: PathKey.resourcesDownload,
    }));

    this.setState({
      downloading: true,
      receivedSize: 0,
      totalSize: 0,
      speed: 0,
    });

    try {
      const { downloadTaskId } = await ipc.callMain(ipcKeys.download, {
        requests: downloadRequests,
        errorTitle: '下载失败',
        errorMessage: '无法完成下载，因为网络错误',
        overwrite: true,
      });
      this.setState({
        downloadTaskId,
      });
    } catch (e) {
      logRenderer.error('[downloadResources] start download error:', e);
      this.setState({
        downloading: false,
      });
    }
  };

  startInstall = () => {
    router.push(getNextInstallerItemPage(this.props.environments));
  };

  renderDownloadInfo = () => {
    const state = this.state;
    const received = formatFileSize(state.receivedSize);
    const total = formatFileSize(state.totalSize);
    const percent = formatPercentage(state.receivedSize, state.totalSize);
    const speed = formatFileSize(state.speed);
    return `${received} / ${total} (${percent})，当前速度：${speed}/s`;
  };

  renderRespackLink = () => {
    return <ExternalLink href="https://ab.algoux.org/#respack">手动下载</ExternalLink>;
  };

  render() {
    const { receivedSize, totalSize, config, validating } = this.state;
    const downloading = this.state.downloading;
    const colProps = {
      className: '--mt-sm --mb-sm',
      md: 12,
      xl: 6,
    };

    const toDownloadResourceIds = this.state.usingResourceIds.filter((resourceId) =>
      [ResourceStatus.DOWNLOADABLE, ResourceStatus.DOWNLOADING, ResourceStatus.ERROR].includes(
        this.state.resourceStatusMap[resourceId] as ResourceStatus,
      ),
    );
    const readyResourceIds = this.state.usingResourceIds.filter(
      (resourceId) => this.state.resourceStatusMap[resourceId] === ResourceStatus.READY,
    );
    const isAllResourcesReady = readyResourceIds.length === this.state.usingResourceIds.length;

    return (
      <div>
        <div className="container --slide-left">
          <div className="content-block">
            <h1 className="top-title">配置清单</h1>
            <p>
              这是即将配置的组件列表。你可以通过 <Icon type="setting" /> 修改配置选项。
            </p>
            <Row gutter={8} className="--mt-sm">
              <Col {...colProps}>
                <EnvCard
                  name={formatMessage({ id: 'env.c_cpp' })}
                  icon={c_cppIcon}
                  installed={config[EnvComponent.c_cpp].installed}
                  version={config[EnvComponent.c_cpp].version}
                  updateAvailable={config[EnvComponent.c_cpp].updateAvailable}
                  latestVersion={config[EnvComponent.c_cpp].latestVersion}
                  options={config[EnvComponent.c_cpp].options}
                  selectedOption={config[EnvComponent.c_cpp].selectedOption}
                  onOptionChange={(option) => this.setConfigOption(EnvComponent.c_cpp, option)}
                />
              </Col>
              <Col {...colProps}>
                <EnvCard
                  name={formatMessage({ id: 'env.python' })}
                  icon={pythonIcon}
                  installed={config[EnvComponent.python].installed}
                  version={config[EnvComponent.python].version}
                  updateAvailable={config[EnvComponent.python].updateAvailable}
                  latestVersion={config[EnvComponent.python].latestVersion}
                  options={config[EnvComponent.python].options}
                  selectedOption={config[EnvComponent.python].selectedOption}
                  onOptionChange={(option) => this.setConfigOption(EnvComponent.python, option)}
                />
              </Col>
              <Col {...colProps}>
                <EnvCard
                  name={formatMessage({ id: 'env.vscode' })}
                  icon={vscodeIcon}
                  installed={config[EnvComponent.vscode].installed}
                  version={config[EnvComponent.vscode].version}
                  updateAvailable={config[EnvComponent.vscode].updateAvailable}
                  latestVersion={config[EnvComponent.vscode].latestVersion}
                  options={config[EnvComponent.vscode].options}
                  selectedOption={config[EnvComponent.vscode].selectedOption}
                  onOptionChange={(option) => this.setConfigOption(EnvComponent.vscode, option)}
                />
              </Col>
              <Col {...colProps}>
                <EnvCard
                  name={formatMessage({ id: 'env.basicExtensions' })}
                  icon={vscodeExtensionIcon}
                  installed={config[EnvComponent.basicExtensions].installed}
                  version={config[EnvComponent.basicExtensions].version}
                  latestVersion={config[EnvComponent.basicExtensions].latestVersion}
                  options={config[EnvComponent.basicExtensions].options}
                  selectedOption={config[EnvComponent.basicExtensions].selectedOption}
                  onOptionChange={(option) =>
                    this.setConfigOption(EnvComponent.basicExtensions, option)
                  }
                  tips={
                    <>
                      <p>将配置这些预设的 VS Code 扩展：</p>
                      <ul
                        className="--mb-none --user-select-text"
                        style={{ paddingInlineStart: '1em' }}
                      >
                        <li>C/C++</li>
                        {sm.platform.isMac && <li>CodeLLDB</li>}
                        <li>Python 扩展包（4 个扩展）</li>
                        <li>Code Runner</li>
                        <li>Code Spell Checker</li>
                        <li>Competitive Programming Helper</li>
                        <li>EditorConfig</li>
                        <li>Error Lens</li>
                      </ul>
                    </>
                  }
                />
              </Col>
              <Col {...colProps}>
                <EnvCard
                  name={formatMessage({ id: 'env.codeStyle' })}
                  icon={cpplintIcon}
                  optional
                  installed={config[EnvComponent.codeStyleExtensions].installed}
                  version={config[EnvComponent.codeStyleExtensions].version}
                  latestVersion={config[EnvComponent.codeStyleExtensions].latestVersion}
                  options={config[EnvComponent.codeStyleExtensions].options}
                  selectedOption={config[EnvComponent.codeStyleExtensions].selectedOption}
                  onOptionChange={(option) =>
                    this.setConfigOption(EnvComponent.codeStyleExtensions, option)
                  }
                  tips={
                    <>
                      <p>提供代码风格指导和潜在错误检查，适合初学者。</p>
                      <p>对于有经验的算竞选手，可跳过此组件。</p>
                      <p>
                        将自动配置{' '}
                        <ExternalLink href="https://github.com/danmar/cppcheck">
                          cppcheck
                        </ExternalLink>{' '}
                        和{' '}
                        <ExternalLink href="https://github.com/cpplint/cpplint">
                          cpplint
                        </ExternalLink>{' '}
                        服务使能。
                      </p>
                    </>
                  }
                />
              </Col>
              <Col {...colProps}>
                <EnvCard
                  name={formatMessage({ id: 'env.languagePackages' })}
                  icon={languageIcon}
                  optional
                  installed={config[EnvComponent.languagePackages].installed}
                  version={config[EnvComponent.languagePackages].version}
                  latestVersion={config[EnvComponent.languagePackages].latestVersion}
                  options={config[EnvComponent.languagePackages].options}
                  selectedOption={config[EnvComponent.languagePackages].selectedOption}
                  onOptionChange={(option) =>
                    this.setConfigOption(EnvComponent.languagePackages, option)
                  }
                />
              </Col>
            </Row>
          </div>

          <div className="content-block --mt-lg --fade-in-delay-1000">
            {validating ? (
              <>
                <p>正在校验资源…</p>
              </>
            ) : downloading ? (
              <>
                <p>向导正在下载组件资源…</p>
                <Progress
                  percent={(receivedSize / totalSize) * 100}
                  status="active"
                  showInfo={false}
                />
                <p>{this.renderDownloadInfo()}</p>
              </>
            ) : toDownloadResourceIds.length > 0 ? (
              <>
                <p>
                  向导将下载配置所需的组件资源。预估下载大小：
                  {formatFileSize(this.state.estimatedDownloadSize)}。
                </p>
              </>
            ) : isAllResourcesReady ? (
              <>
                <p>
                  所需资源已就绪。现在，向导已准备好智慧配置你的 {sm.platform.isMac ? 'Mac' : 'PC'}
                  。
                </p>
              </>
            ) : null}
          </div>
        </div>
        <ActionBar
          info={null}
          actions={
            toDownloadResourceIds.length > 0
              ? [
                  {
                    key: 'downloadResources',
                    type: 'primary',
                    text: '下载所选组件',
                    loading: downloading,
                    onClick: this.downloadResources,
                  },
                ]
              : [
                  {
                    key: 'startInstall',
                    type: 'primary',
                    text: '开始配置',
                    highlight: true,
                    disabled: downloading || validating,
                    onClick: this.startInstall,
                  },
                ]
          }
          delay={1000}
        />
      </div>
    );
  }
}

function mapStateToProps(state: IState) {
  return {
    environments: state.env.environments,
    resourceIndex: state.resources.resourceIndex as ResourceIndexItem<ResourceId>,
  };
}

export default connect(mapStateToProps)(Configuration);
