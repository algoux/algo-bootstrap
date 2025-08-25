import React from 'react';
import { connect } from '@/utils/dva';
import router from 'umi/router';
import ActionBar from '@/components/ActionBar';
import { logRenderer } from '@/utils/logger';
import msg from '@/utils/msg';
import { formatMessage } from 'umi-plugin-locale';
import { getNextInstallerItemPage, isVsixAllInstalled } from '@/utils/env';
import { DispatchProps } from '@/typings/props';
import sm from '@/utils/modules';
import { windowProgress } from '@/utils/native';
import { VSIXIds } from 'common/configs/resources';

export interface IVsixInstallerProps {}

interface State {
  installingVsixIndex: number;
  installingVsixId: SupportedVSIXId | null;
}

type Props = IVsixInstallerProps & ReturnType<typeof mapStateToProps> & DispatchProps;

function genInitialState(): State {
  return {
    installingVsixIndex: 0,
    installingVsixId: null,
  };
}

let cachedState = genInitialState();

class VsixInstaller extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = cachedState;
  }

  componentDidMount() {
    this.installAllVsix();
  }

  componentWillUnmount() {
    cachedState = {
      ...this.state,
      installingVsixIndex: 0,
      installingVsixId: null,
    };
  }

  installVsix = async (vsixId: SupportedVSIXId) => {
    const environments = await this.props.dispatch<any, Promise<IEnvironments>>({
      type: 'env/installVsix',
      payload: {
        vsixId,
      },
    });
    return environments;
  };

  installAllVsix = async () => {
    if (this.props.loading) {
      return;
    }
    let environments: IEnvironments | undefined;
    try {
      const _startAt = Date.now();
      windowProgress.start();
      for (let i = 0; i < VSIXIds.length; ++i) {
        const vsixId = VSIXIds[i];
        this.setState({
          installingVsixIndex: i,
          installingVsixId: vsixId,
        });
        environments = await this.installVsix(vsixId);
      }
      windowProgress.end();
      if (environments && isVsixAllInstalled(environments)) {
        sm.track.timing('install', 'vsix', Date.now() - _startAt);
        router.push(getNextInstallerItemPage(environments));
      }
    } catch (e) {
      windowProgress.end();
      logRenderer.error(`[installAllVsix]`, e);
      msg.error('安装环境失败');
      sm.track.event('install', 'error', 'vsix', 1);
    }
  };

  render() {
    const props = this.props;
    const state = this.state;
    return (
      <div>
        <div className="container --slide-left">
          <div className="content-block">
            <h1 className="top-title">安装 {formatMessage({ id: 'env.vsix' })}</h1>
            <p>
              正在安装（{state.installingVsixIndex + 1}/{sm.envChecker.VSIXIds.length}）：
              {state.installingVsixId}
            </p>
          </div>
        </div>
        <ActionBar
          actions={[
            {
              key: 'installVsix',
              type: 'primary',
              text: !props.loading ? '开始安装' : '正在安装',
              loading: props.loading,
              onClick: this.installAllVsix,
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
    loading: !!state.loading.effects['env/installVsix'],
  };
}

export default connect(mapStateToProps)(VsixInstaller);
