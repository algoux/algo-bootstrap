import React from 'react';
import { connect } from '@/utils/dva';
import router from 'umi/router';
import ActionBar from '@/components/ActionBar';
import sm from '@/utils/modules';
import { logRenderer } from 'common/utils/logger';
import msg from '@/utils/msg';
import { formatMessage } from 'umi-plugin-locale';
import windowsStep_1 from '@/assets/guides/python/python-win32-light-step-1.png';
import windowsStep_2 from '@/assets/guides/python/python-win32-light-step-2.png';
import windowsStep_3 from '@/assets/guides/python/python-win32-light-step-3.png';
import { isEnvInstalled, getNextInstallerItemPage } from '@/utils/env';
import { DispatchProps } from '@/typings/props';
import { windowProgress } from '@/utils/native';

export interface IPythonInstallerProps {}

interface State {
  checkCompleteLoading: boolean;
}

type Props = IPythonInstallerProps & ReturnType<typeof mapStateToProps> & DispatchProps;

function genInitialState(): State {
  return {
    checkCompleteLoading: false,
  };
}

let cachedState = genInitialState();

class PythonInstaller extends React.Component<Props, State> {
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
    try {
      const _startAt = Date.now();
      windowProgress.start();
      const environments = await this.props.dispatch<any, Promise<IEnvironments>>({
        type: 'env/installPython',
        payload: {},
      });
      windowProgress.end();
      if (isEnvInstalled(environments, 'python')) {
        sm.track.timing('install', 'python', Date.now() - _startAt);
        router.push(getNextInstallerItemPage(environments));
      }
    } catch (e) {
      windowProgress.end();
      logRenderer.error(`[installPython]`, e);
      msg.error('安装环境失败');
      sm.track.event('install', 'error', 'python', 1);
    }
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
    if (isEnvInstalled(environments, 'python')) {
      router.push(getNextInstallerItemPage(environments));
    }
  };

  renderWindows = () => {
    const props = this.props;
    return (
      <div>
        <div className="container --slide-left">
          <div className="content-block">
            <h1 className="top-title">安装 {formatMessage({ id: 'env.python' })}</h1>
            <p>{formatMessage({ id: 'env.installer.desc' })}</p>
            <div className="article">
              <h3 className="section-header">1. 勾选「Add Python to PATH」并点击「Install Now」</h3>
              <p className="color-secondary">* 你看到的界面可能与指引存在些许差异。</p>
              <p>
                <img src={windowsStep_1} />
              </p>
              <h3 className="section-header">2. 等待安装完成</h3>
              <p>
                <img src={windowsStep_2} />
              </p>
              <h3 className="section-header">3. 安装完成时，点击「Disable path length limit」</h3>
              <p>如果没有找到此按钮，你可以跳过这个步骤。</p>
              <p>
                <img src={windowsStep_3} />
              </p>
              <p>安装完成后，点击「Close」关闭安装器。</p>
            </div>
          </div>
        </div>
        <ActionBar
          actions={[
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
      <div>
        <div className="container --slide-left">
          <div className="content-block">
            <h1 className="top-title">安装 {formatMessage({ id: 'env.python' })}</h1>
            <p>Python 已内置于 macOS，请点击「完成安装」。</p>
            <p>如果问题依然存在，请尝试自行安装。</p>
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
  };
}

export default connect(mapStateToProps)(PythonInstaller);
