import React from 'react';
import { connect } from '@/utils/dva';
import router from 'umi/router';
import ActionBar from '@/components/ActionBar';
import { logRenderer } from '@/utils/logger';
import msg from '@/utils/msg';
import { formatMessage } from 'umi-plugin-locale';
import { getRequiredResourceIdsByEnvComponentKey } from '@/utils/env';
import { DispatchProps } from '@/typings/props';
import sm from '@/utils/modules';
import { windowProgress } from '@/utils/native';
import { ResourceId, VSIXIdMap, VSIXIdMapReverse } from 'common/configs/resources';
import { EnvComponentModule, EnvComponentModuleConfigStatus } from '@/typings/env';
import { EnvComponent } from 'common/configs/env';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pages from '@/configs/pages';
import setStatePromise from '@/utils/misc';
import Terminal from '@/components/Terminal';
import Loading from '@/components/Loading';
import { Icon } from 'antd';
import { sleep } from 'common/utils/misc';

type ItemConfigStatus = 'pending' | 'processing' | 'done' | 'error';

export interface IExtensionsConfiguratorProps {}

interface State {
  requiredResourceIds: ResourceId[];
  vsixIds: SupportedVSIXId[];
  installingVsixIndex: number;
  vsixStataus: ItemConfigStatus;
  cppcheckStataus: ItemConfigStatus;
  cpplintStataus: ItemConfigStatus;
  terminalIdCppcheck: string;
  terminalIdCpplint: string;
  warnings: string[];
}

type Props = IExtensionsConfiguratorProps & ReturnType<typeof mapStateToProps> & DispatchProps;

function genInitialState(): State {
  return {
    requiredResourceIds: [],
    vsixIds: [],
    installingVsixIndex: -1,
    vsixStataus: 'pending',
    cppcheckStataus: 'pending',
    cpplintStataus: 'pending',
    terminalIdCppcheck: '',
    terminalIdCpplint: '',
    warnings: [],
  };
}

let cachedState = genInitialState();

class ExtensionsConfigurator extends React.Component<Props, State> {
  private setStatePromise = setStatePromise.bind(this);

  constructor(props: Props) {
    super(props);
    this.state = cachedState;
  }

  componentDidMount() {
    const requiredResourceIds = [
      ...getRequiredResourceIdsByEnvComponentKey(
        this.props.envConfig,
        EnvComponent.basicExtensions,
      ),
      ...getRequiredResourceIdsByEnvComponentKey(
        this.props.envConfig,
        EnvComponent.codeStyleExtensions,
      ),
      ...getRequiredResourceIdsByEnvComponentKey(
        this.props.envConfig,
        EnvComponent.languagePackages,
      ),
    ];
    logRenderer.info('[extensions.componentDidMount] requiredResourceIds:', requiredResourceIds);
    const vsixResourceIds = requiredResourceIds.filter((resourceId) =>
      resourceId.startsWith('vsix.'),
    );
    const vsixIds = vsixResourceIds.map((resourceId) => VSIXIdMap[resourceId]);
    logRenderer.info(`[extensions.componentDidMount] vsixIds:`, vsixIds);
    this.setState(
      {
        requiredResourceIds,
        vsixIds,
      },
      () => {
        if (this.props.moduleConfigStatus.extensions === EnvComponentModuleConfigStatus.PENDING) {
          this.autoConfigure();
        }
      },
    );
  }

  componentWillUnmount() {
    cachedState = {
      ...this.state,
      installingVsixIndex: -1,
      vsixStataus: 'pending',
      cppcheckStataus: 'pending',
      cpplintStataus: 'pending',
      warnings: [],
    };
  }

  autoConfigure = async () => {
    try {
      windowProgress.start();
      await this.setProcessing();
      await this.installAllVsixes();
      if (this.state.requiredResourceIds.includes(ResourceId['deps.cppcheck'])) {
        await this.installCppcheck();
      }
      if (this.state.requiredResourceIds.includes(ResourceId['deps.cpplint'])) {
        await this.installCpplint();
      }
      await sleep(2000);
      await this.complete();
    } catch (e) {
      logRenderer.error(`[extensions.autoConfigure] failed:`, e);
      // msg.error('自动配置扩展失败');
      await this.props.dispatch({
        type: 'env/setModuleConfigStatusItem',
        payload: {
          module: EnvComponentModule.extensions,
          status: EnvComponentModuleConfigStatus.PENDING,
        },
      });
    } finally {
      windowProgress.end();
    }
  };

  installVsix = async (vsixId: SupportedVSIXId) => {
    const { path: resourcePath } = this.props.resourceIndex[VSIXIdMapReverse[vsixId]];
    const resourceFilename = path.basename(resourcePath);
    await this.props.dispatch<any, Promise<IEnvironments>>({
      type: 'env/installVsix',
      payload: {
        vsixId,
        filename: resourceFilename,
        fetchEnvironments: false,
      },
    });
  };

  installAllVsixes = async () => {
    const { vsixIds } = this.state;
    try {
      const _startAt = Date.now();
      for (let i = 0; i < vsixIds.length; ++i) {
        const vsixId = vsixIds[i];
        this.setState({
          installingVsixIndex: i,
          vsixStataus: 'processing',
        });
        await this.installVsix(vsixId).catch((e) => {
          if (vsixId === 'ms-ceintl.vscode-language-pack-zh-hans') {
            this.setState({
              warnings: [
                ...this.state.warnings,
                '中文语言包扩展未能安装。配置完成后，你可以自行在 VS Code 中安装它。',
              ],
            });
            logRenderer.warn(
              '[installAllVsixes] failed to install "vscode-language-pack-zh-hans" and skipped:',
              e,
            );
            return;
          }
          throw e;
        });
      }
      await this.props.dispatch({
        type: 'env/getEnvironments',
        payload: {
          force: true,
        },
      });
      this.setState({
        installingVsixIndex: -1,
      });
      sm.track.timing('install', 'vsix', Date.now() - _startAt);
      this.setState({
        vsixStataus: 'done',
      });
    } catch (e) {
      logRenderer.error(`[installAllVsixes] failed:`, e);
      msg.error('安装扩展失败，请安装 VSCode 最新版本后重试');
      sm.track.event('install', 'error', 'vsix', 1);
      this.setState({
        vsixStataus: 'error',
      });
      throw e;
    }
  };

  installCppcheck = async () => {
    const { path: resourcePath } = this.props.resourceIndex[ResourceId['deps.cppcheck']];
    const resourceFilename = path.basename(resourcePath);
    const terminalId = `cppcheck-${uuidv4().slice(0, 6)}`;
    const promise = this.props.dispatch<any, Promise<IEnvironments>>({
      type: 'env/installCppcheck',
      payload: {
        srcFileName: resourceFilename,
        terminalId,
      },
    });
    this.setStatePromise({
      cppcheckStataus: 'processing',
      terminalIdCppcheck: terminalId,
    });
    try {
      await promise;
      this.setState({
        cppcheckStataus: 'done',
      });
    } catch (e) {
      this.setState({
        cppcheckStataus: 'error',
      });
      throw e;
    }
  };

  installCpplint = async () => {
    const { path: resourcePath } = this.props.resourceIndex[ResourceId['deps.cpplint']];
    const resourceFilename = path.basename(resourcePath);
    const terminalId = `cpplint-${uuidv4().slice(0, 6)}`;
    const promise = this.props.dispatch<any, Promise<IEnvironments>>({
      type: 'env/installCpplint',
      payload: {
        srcFileName: resourceFilename,
        terminalId,
      },
    });
    this.setStatePromise({
      cpplintStataus: 'processing',
      terminalIdCpplint: terminalId,
    });
    this.setStatePromise({
      terminalIdCpplint: terminalId,
    });
    try {
      await promise;
      this.setState({
        cpplintStataus: 'done',
      });
    } catch (e) {
      this.setState({
        cpplintStataus: 'error',
      });
      throw e;
    }
  };

  setProcessing = async () => {
    await this.props.dispatch({
      type: 'env/setModuleConfigStatusItem',
      payload: {
        module: EnvComponentModule.extensions,
        status: EnvComponentModuleConfigStatus.PROCESSING,
      },
    });
  };

  complete = async () => {
    await this.props.dispatch({
      type: 'env/setModuleConfigStatusItem',
      payload: {
        module: EnvComponentModule.extensions,
        status: EnvComponentModuleConfigStatus.DONE,
      },
    });
    router.push(pages.configurationModule.magic);
  };

  renderStatusIcon = (status: ItemConfigStatus) => {
    if (status === 'processing') {
      return <Loading size="small" className="--ml-md" style={{ position: 'relative' }} />;
    }
    if (status === 'error') {
      return <Icon type="close" className="--ml-md" />;
    }
    if (status === 'done') {
      return <Icon type="check" className="--ml-md" />;
    }
    return null;
  };

  renderVsixTaskStatus = () => {
    const { vsixIds, installingVsixIndex, vsixStataus } = this.state;
    if (vsixIds.length === 0 || vsixStataus === 'pending') {
      return null;
    }

    const currentNumber = installingVsixIndex === -1 ? vsixIds.length : installingVsixIndex + 1;
    const currentVsixId = installingVsixIndex === -1 ? undefined : vsixIds[installingVsixIndex];

    const warningArea =
      this.state.warnings.length > 0 ? (
        <div className="--mt-sm --ml-md" style={{ color: '#ff812e' }}>
          {this.state.warnings.map((warning, index) => (
            <div key={index}>⚠️ {warning}</div>
          ))}
        </div>
      ) : null;

    if (vsixStataus === 'processing') {
      return (
        <div>
          正在安装扩展（{currentNumber}/{vsixIds.length}）：
          {currentVsixId}
          {this.renderStatusIcon(vsixStataus)}
        </div>
      );
    }
    if (vsixStataus === 'error') {
      return (
        <div>
          无法安装扩展（{currentNumber}/{vsixIds.length}）：
          {currentVsixId}
          {this.renderStatusIcon(vsixStataus)}
          {warningArea}
        </div>
      );
    }
    return (
      <div>
        完成安装扩展（{vsixIds.length}/{vsixIds.length}）{this.renderStatusIcon(vsixStataus)}
        {warningArea}
      </div>
    );
  };

  renderTerminalTaskStatus = (title: string, status: ItemConfigStatus, terminalId: string) => {
    if (status === 'pending') {
      return null;
    }
    return (
      <div className="--mt-md-lg">
        {status === 'processing' && (
          <div>
            正在安装 {title}
            {this.renderStatusIcon(status)}
          </div>
        )}
        {status === 'error' && (
          <div>
            无法安装 {title}
            {this.renderStatusIcon(status)}
          </div>
        )}
        {status === 'done' && (
          <div>
            完成安装 {title}
            {this.renderStatusIcon(status)}
          </div>
        )}
        {status !== 'done' && (
          <Terminal
            terminalId={terminalId}
            className="--mt-sm"
            style={{ width: '100%', height: '196px' }}
          />
        )}
      </div>
    );
  };

  render() {
    const props = this.props;
    const { terminalIdCppcheck, terminalIdCpplint, cppcheckStataus, cpplintStataus } = this.state;
    return (
      <div className="--full-height">
        <div className="container --slide-left">
          <div className="content-block --pb-xl">
            <h1 className="top-title">安装{formatMessage({ id: 'env.extensions' })}</h1>

            {this.renderVsixTaskStatus()}
            {this.renderTerminalTaskStatus('cppcheck', cppcheckStataus, terminalIdCppcheck)}
            {this.renderTerminalTaskStatus('cpplint', cpplintStataus, terminalIdCpplint)}
          </div>
        </div>
        <ActionBar
          actions={[
            {
              key: 'install',
              type: 'primary',
              text: !props.loading ? '重试安装' : '正在安装',
              loading: props.loading,
              onClick: this.autoConfigure,
            },
          ]}
          delay={1000}
        />
      </div>
    );
  }
}

function mapStateToProps(state: IState) {
  return {
    environments: state.env.environments,
    loading:
      !!state.loading.effects['env/installVsix'] ||
      !!state.loading.effects['env/installCppcheck'] ||
      !!state.loading.effects['env/installCpplint'] ||
      state.env.moduleConfigStatus.extensions === EnvComponentModuleConfigStatus.PROCESSING,
    envConfig: state.env.config,
    moduleConfigStatus: state.env.moduleConfigStatus,
    resourceIndex: state.resources.resourceIndex,
  };
}

export default connect(mapStateToProps)(ExtensionsConfigurator);
