import React from 'react';
import { connect } from '@/utils/dva';
import router from 'umi/router';
import ActionBar from '@/components/ActionBar';
import sm from '@/utils/modules';
import { logRenderer } from 'common/utils/logger';
import msg from '@/utils/msg';
import { formatMessage } from 'umi-plugin-locale';
import windowsStep_1 from '@/assets/guides/code/code-win32-light-step-1.png';
import windowsStep_2 from '@/assets/guides/code/code-win32-light-step-2.png';
import windowsStep_3 from '@/assets/guides/code/code-win32-light-step-3.png';
import windowsStep_4 from '@/assets/guides/code/code-win32-light-step-4.png';
import windowsStep_5 from '@/assets/guides/code/code-win32-light-step-5.png';
import { isEnvInstalled, getNextInstallerItemPage } from '@/utils/env';
import { DispatchProps } from '@/typings/props';
import { windowProgress } from '@/utils/native';

export interface ICodeInstallerProps {}

interface State {}

type Props = ICodeInstallerProps & ReturnType<typeof mapStateToProps> & DispatchProps;

function genInitialState(): State {
  return {};
}

let cachedState = genInitialState();

class CodeInstaller extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = cachedState;
  }

  componentDidMount() {
    sm.platform.isMac && this.installVSCode();
  }

  componentWillUnmount() {
    cachedState = {
      ...this.state,
    };
  }

  installVSCode = async () => {
    if (this.props.loading) {
      return;
    }
    try {
      const _startAt = Date.now();
      windowProgress.start();
      const environments = await this.props.dispatch<any, Promise<IEnvironments>>({
        type: 'env/installVSCode',
        payload: {},
      });
      windowProgress.end();
      if (isEnvInstalled(environments, 'code')) {
        sm.track.timing('install', 'code', Date.now() - _startAt);
        router.push(getNextInstallerItemPage(environments));
      }
    } catch (e) {
      windowProgress.end();
      logRenderer.error(`[installVSCode]`, e);
      msg.error('安装环境失败');
      sm.track.event('install', 'error', 'code', 1);
    }
  };

  renderWindows = () => {
    const props = this.props;
    return (
      <div>
        <div className="container --slide-left">
          <div className="content-block">
            <h1 className="top-title">安装 {formatMessage({ id: 'env.code' })}</h1>
            <p>{formatMessage({ id: 'env.installer.desc' })}</p>
            <div className="article">
              <h3 className="section-header">1. 选择「我接受协议」并点击「下一步」</h3>
              <p>
                <img src={windowsStep_1} />
              </p>
              <h3 className="section-header">2. 确保「其他」中的选项全部勾选并点击「下一步」</h3>
              <p>
                <img src={windowsStep_2} />
              </p>
              <h3 className="section-header">3. 点击「安装」</h3>
              <p>
                <img src={windowsStep_3} />
              </p>
              <h3 className="section-header">4. 等待安装完成</h3>
              <p>
                <img src={windowsStep_4} />
              </p>
              <h3 className="section-header">5. 取消勾选「启动 Visual Studio Code」并点击完成</h3>
              <p>
                <img src={windowsStep_5} />
              </p>
            </div>
          </div>
        </div>
        <ActionBar
          actions={[
            {
              key: 'installVSCode',
              type: 'primary',
              text: !props.loading ? '开始安装' : '正在安装',
              loading: props.loading,
              onClick: this.installVSCode,
            },
          ]}
          delay={1000}
        />
      </div>
    );
  };

  renderMac = () => {
    const props = this.props;
    return (
      <div>
        <div className="container --slide-left">
          <div className="content-block">
            <h1 className="top-title">安装 {formatMessage({ id: 'env.code' })}</h1>
            <p>
              正在拷贝 {formatMessage({ id: 'env.code' })} 到「应用程序」，这只需要花费一点时间。
            </p>
          </div>
        </div>
        <ActionBar
          actions={[
            {
              key: 'installVSCode',
              type: 'primary',
              text: !props.loading ? '开始安装' : '正在安装',
              loading: props.loading,
              onClick: this.installVSCode,
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
    loading: !!state.loading.effects['env/installVSCode'],
  };
}

export default connect(mapStateToProps)(CodeInstaller);
