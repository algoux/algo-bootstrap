import React from 'react';
import { connect } from '@/utils/dva';
import router from 'umi/router';
import ActionBar from '@/components/ActionBar';
import sm from '@/utils/modules';
import { logRenderer } from '@/utils/logger';
import msg from '@/utils/msg';
import { formatMessage } from 'umi-plugin-locale';
import windowsStep_1 from '@/assets/guides/python/python-win32-light-step-1.png';
import windowsStep_2 from '@/assets/guides/python/python-win32-light-step-2.png';
import windowsStep_3 from '@/assets/guides/python/python-win32-light-step-3.png';
import { isEnvInstalled, getNextConfigurationModulePage } from '@/utils/env';
import { DispatchProps } from '@/typings/props';
import { windowProgress } from '@/utils/native';
import { EnvComponentModule, EnvComponentModuleConfigStatus } from '@/typings/env';
import path from 'path';
import { ResourceId } from 'common/configs/resources';

export interface IPythonConfigurator {}

interface State {
  checkCompleteLoading: boolean;
  showSkipButton: boolean;
}

type Props = IPythonConfigurator & ReturnType<typeof mapStateToProps> & DispatchProps;

function genInitialState(): State {
  return {
    checkCompleteLoading: false,
    showSkipButton: false,
  };
}

let cachedState = genInitialState();

class PythonConfigurator extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = cachedState;
  }

  componentWillUnmount() {
    cachedState = {
      ...this.state,
      checkCompleteLoading: false,
    };
  }

  installPython = async () => {
    if (this.props.loading) {
      return;
    }
    await this.props.dispatch({
      type: 'env/setModuleConfigStatusItem',
      payload: {
        module: EnvComponentModule.python,
        status: EnvComponentModuleConfigStatus.PROCESSING,
      },
    });
    try {
      const _startAt = Date.now();
      windowProgress.start();
      const environments = await this.props.dispatch<any, Promise<IEnvironments>>({
        type: 'env/installPython',
        payload: {
          filename: path.basename(this.props.resourceIndex[ResourceId.python].path),
        },
      });
      windowProgress.end();
      sm.track.timing('install', 'python', Date.now() - _startAt);
      await this.complete(environments);
    } catch (e) {
      windowProgress.end();
      logRenderer.error(`[installPython]`, e);
      msg.error('安装环境失败');
      this.setState({
        showSkipButton: true,
      });
      sm.track.event('install', 'error', 'python', 1);
    }
  };

  skipInstall = async () => {
    await this.props.dispatch({
      type: 'env/setModuleConfigStatusItem',
      payload: {
        module: EnvComponentModule.python,
        status: EnvComponentModuleConfigStatus.DONE,
      },
    });
    router.push(getNextConfigurationModulePage(this.props.moduleConfigStatus));
  };

  checkComplete = async () => {
    this.setState({
      checkCompleteLoading: true,
    });
    const environments = await this.props.dispatch<any, Promise<IEnvironments>>({
      type: 'env/getEnvironments',
      payload: {
        force: true,
      },
    });
    this.setState({
      checkCompleteLoading: false,
    });
    await this.complete(environments);
  };

  complete = async (environments: IEnvironments | undefined) => {
    if (environments && isEnvInstalled(environments, 'python')) {
      await this.props.dispatch({
        type: 'env/setModuleConfigStatusItem',
        payload: {
          module: EnvComponentModule.python,
          status: EnvComponentModuleConfigStatus.DONE,
        },
      });
      router.push(getNextConfigurationModulePage(this.props.moduleConfigStatus));
    } else {
      this.setState({
        showSkipButton: true,
      });
      msg.error(
        sm.platform.isWindows
          ? '未检测到安装完成，这可能是由于 WindowsApps 环境变量作祟，请重试或跳过安装'
          : '未检测到安装完成，请重试',
      );
    }
  };

  renderWindows = () => {
    const props = this.props;
    const state = this.state;

    if (
      props.moduleConfigStatus[EnvComponentModule.python] === EnvComponentModuleConfigStatus.DONE
    ) {
      return (
        <div className="--full-height">
          <div className="container --slide-left">
            <div className="content-block --pb-xl">
              <h1 className="top-title">安装 {formatMessage({ id: 'env.python' })}</h1>
              <p>你已安装了 Python，因此这只是一个仪式。请轻点「完成安装」。</p>
            </div>
          </div>
          <ActionBar
            actions={[
              {
                key: 'installPython',
                type: 'primary',
                text: '完成安装',
                loading: state.checkCompleteLoading,
                onClick: this.checkComplete,
              },
            ]}
            delay={1000}
          />
        </div>
      );
    }

    return (
      <div className="--full-height">
        <div className="container --slide-left">
          <div className="content-block --pb-xl">
            <h1 className="top-title">安装 {formatMessage({ id: 'env.python' })}</h1>
            <p>{formatMessage({ id: 'env.installer.desc' })}</p>
            <p className="color-secondary">{formatMessage({ id: 'env.installer.tips' })}</p>
            <div className="article">
              <h3 className="section-header">
                1. 勾选「Add python.exe to PATH」并点击「Install Now」
              </h3>
              <p>
                <img src={windowsStep_1} />
              </p>
              <h3 className="section-header">2. 等待安装完成</h3>
              <p>
                <img src={windowsStep_2} />
              </p>
              <h3 className="section-header">3. 点击「Close」关闭安装器</h3>
              <p className="color-secondary">
                * 如果按钮「Disable path length limit」存在，请在关闭安装器前先点击它。
              </p>
              <p>
                <img src={windowsStep_3} />
              </p>
            </div>
          </div>
        </div>
        <ActionBar
          actions={[
            ...(state.showSkipButton
              ? [
                  {
                    key: 'skipInstall',
                    type: 'default' as const,
                    text: '跳过安装',
                    onClick: this.skipInstall,
                  },
                ]
              : []),
            {
              key: 'installPython',
              type: 'primary',
              text: !props.loading ? '开始安装' : '正在安装',
              loading: props.loading,
              onClick: this.installPython,
            },
          ]}
          delay={1000}
        />
      </div>
    );
  };

  renderMac = () => {
    const state = this.state;
    return (
      <div className="--full-height">
        <div className="container --slide-left">
          <div className="content-block --pb-xl">
            <h1 className="top-title">安装 {formatMessage({ id: 'env.python' })}</h1>
            <p>Python 已内置于 macOS，因此这只是一个仪式。请轻点「完成安装」。</p>
            <p>如果此环境在你的系统上缺失，请尝试自行安装。</p>
          </div>
        </div>
        <ActionBar
          actions={[
            {
              key: 'installPython',
              type: 'primary',
              text: '完成安装',
              loading: state.checkCompleteLoading,
              onClick: this.checkComplete,
            },
          ]}
          delay={1000}
        />
      </div>
    );
  };

  render() {
    if (sm.platform.isWindows) {
      return this.renderWindows();
    } else if (sm.platform.isMac) {
      return this.renderMac();
    }
    return null;
  }
}

function mapStateToProps(state: IState) {
  return {
    environments: state.env.environments,
    loading: !!state.loading.effects['env/installPython'],
    resourceIndex: state.resources.resourceIndex,
    moduleConfigStatus: state.env.moduleConfigStatus,
  };
}

export default connect(mapStateToProps)(PythonConfigurator);
