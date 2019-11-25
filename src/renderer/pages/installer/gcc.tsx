import React from 'react';
import { connect } from '@/utils/dva';
import router from 'umi/router';
import ActionBar from '@/components/ActionBar';
import sm from '@/utils/modules';
import { logRenderer } from 'common/utils/logger';
import msg from '@/utils/msg';
import { formatMessage } from 'umi-plugin-locale';
import macStep_1 from '@/assets/guides/gcc/gcc-darwin-light-step-1.png';
import macStep_2 from '@/assets/guides/gcc/gcc-darwin-light-step-2.png';
import macStep_3 from '@/assets/guides/gcc/gcc-darwin-light-step-3.png';
import { isEnvInstalled, getNextInstallerItemPage } from '@/utils/env';
import { DispatchProps } from '@/typings/props';
import { remote } from 'electron';
import { formatPercentage, formatFileSize } from 'common/utils/format';
import { Progress } from 'antd';

export interface IGccInstallerProps {
}

interface State {
  mingwTotalSize: number;
  mingwUncompressedSize: number;
  startedInstallation: boolean;
  checkCompleteLoading: boolean;
}

type Props = IGccInstallerProps & ReturnType<typeof mapStateToProps> & DispatchProps;

function genInitialState(): State {
  return {
    mingwTotalSize: 0,
    mingwUncompressedSize: 0,
    startedInstallation: false,
    checkCompleteLoading: false,
  };
}

let cachedState = genInitialState();

class GccInstaller extends React.Component<Props, State> {
  _pollMingwSizeTimer?: number;

  constructor(props: Props) {
    super(props);
    this.state = cachedState;
  }

  componentDidMount() {
    sm.platform.isWindows && this.installGccWindows();
  }

  componentWillUnmount() {
    cachedState = {
      ...this.state,
      mingwTotalSize: 0,
      mingwUncompressedSize: 0,
      checkCompleteLoading: false,
    };
    remote.getCurrentWindow().setProgressBar(-1);
  }

  getMingwTotalSize = async () => {
    const size = await sm.envInstaller.getMingwTotalSize();
    this.setState({
      mingwTotalSize: size,
    });
  }

  pollMingwUncompressedSize = async () => {
    try {
      const size = await sm.envInstaller.getMingwUncompressedSize();
      this.setState({
        mingwUncompressedSize: size,
      });
      remote.getCurrentWindow().setProgressBar(size / this.state.mingwTotalSize);
    } catch (e) { }
    this._pollMingwSizeTimer = window.setTimeout(() => {
      this.pollMingwUncompressedSize();
    }, 1000);
  }

  installGccWindows = async () => {
    if (!sm.platform.isWindows || this.props.loading) {
      return;
    }
    let environments: IEnvironments | undefined;
    try {
      if (sm.platform.isWindows) {
        await this.getMingwTotalSize();
        await this.pollMingwUncompressedSize();
      }
      environments = await this.props.dispatch<any, Promise<IEnvironments>>({
        type: 'env/installGcc',
        payload: {},
      });
    } catch (e) {
      logRenderer.error(`[installGcc]`, e);
      msg.error('安装环境失败');
    } finally {
      clearTimeout(this._pollMingwSizeTimer!);
      if (sm.platform.isWindows) {
        remote.getCurrentWindow().setProgressBar(-1);
        this.setState({
          mingwUncompressedSize: this.state.mingwTotalSize,
        });
      }
      if (environments && isEnvInstalled(environments, 'gcc')) {
        router.push(getNextInstallerItemPage(environments));
      }
    }
  }

  installGccMac = async () => {
    try {
      await this.props.dispatch({
        type: 'env/installGcc',
        payload: {},
      });
    } catch (e) {
      logRenderer.error(`[installGcc]`, e);
    }
    this.setState({
      startedInstallation: true,
    });
  }

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
    if (isEnvInstalled(environments, 'gcc')) {
      router.push(getNextInstallerItemPage(environments));
    }
  }

  renderMingwSize = () => {
    const state = this.state;
    const uncompressed = formatFileSize(state.mingwUncompressedSize);
    const total = formatFileSize(state.mingwTotalSize);
    const percent = formatPercentage(state.mingwUncompressedSize, state.mingwTotalSize);
    return `${uncompressed} / ${total} (${percent})`;
  }

  renderWindows = () => {
    const props = this.props;
    const state = this.state;
    return <div>
      <div className="container --slide-left">
        <div className="content-block">
          <h1 className="top-title">安装 {formatMessage({ id: 'env.gcc' })}</h1>
          <p>正在应用和配置 {formatMessage({ id: 'env.gcc' })}，这可能需要花费一些时间。</p>
          <p className="color-secondary">* 这个过程将不会消耗你的数据流量。</p>
          <Progress percent={state.mingwUncompressedSize / state.mingwTotalSize * 100} status="active" showInfo={false} />
          <p>已应用：{this.renderMingwSize()}</p>
        </div>
      </div>
      <ActionBar
        actions={
          [
            {
              key: 'installGcc',
              type: 'primary',
              text: !props.loading ? '开始安装' : '正在安装',
              loading: props.loading,
              onClick: this.installGccWindows,
            },
          ]
        }
        delay={1000}
      />
    </div>;
  }

  renderMac = () => {
    const state = this.state;
    return <div>
      <div className="container --slide-left">
        <div className="content-block">
          <h1 className="top-title">安装 {formatMessage({ id: 'env.gcc' })}</h1>
          <p>{formatMessage({ id: 'env.installer.desc' })}</p>
          <div className="article">
            <h3 className="section-header">1. 安装命令行开发者工具</h3>
            <img src={macStep_1} />
            <h3 className="section-header">2. 同意许可协议</h3>
            <img src={macStep_2} />
            <h3 className="section-header">3. 等待安装完成</h3>
            <img src={macStep_3} />
            <p>安装完成后，请点击「完成安装」。</p>
          </div>
        </div>
      </div>
      <ActionBar
        actions={!state.startedInstallation ?
          [
            {
              key: 'installGcc',
              type: 'primary',
              text: '开始安装',
              onClick: this.installGccMac,
            },
          ] :
          [
            {
              key: 'reinstallGcc',
              type: 'default',
              text: '重试',
              onClick: this.installGccMac,
            },
            {
              key: 'installGcc',
              type: 'primary',
              text: '完成安装',
              loading: state.checkCompleteLoading,
              onClick: this.checkComplete,
            },
          ]
        }
        delay={1000}
      />
    </div>;
  }

  render() {
    if (sm.platform.isWindows) {
      return this.renderWindows();
    }
    if (sm.platform.isMac) {
      return this.renderMac();
    }
    return null;
  }
}

function mapStateToProps(state: IState) {
  return {
    environments: state.env.environments,
    loading: !!state.loading.effects['env/installGcc'],
  };
}

export default connect(mapStateToProps)(GccInstaller);
