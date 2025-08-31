import React from 'react';
import { connect } from '@/utils/dva';
import router from 'umi/router';
import ActionBar from '@/components/ActionBar';
import { logRenderer } from '@/utils/logger';
import msg from '@/utils/msg';
import { formatMessage } from 'umi-plugin-locale';
import { isEnvInstalled, getNextInstallerItemPage } from '@/utils/env';
import { DispatchProps } from '@/typings/props';
import { windowProgress } from '@/utils/native';
import sm from '@/utils/modules';

export interface ICpplintInstallerProps {}

interface State {}

type Props = ICpplintInstallerProps & ReturnType<typeof mapStateToProps> & DispatchProps;

function genInitialState(): State {
  return {};
}

let cachedState = genInitialState();

class CpplintInstaller extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = cachedState;
  }

  componentDidMount() {
    this.installCpplint();
  }

  componentWillUnmount() {
    cachedState = {
      ...this.state,
    };
  }

  installCpplint = async () => {
    if (this.props.loading) {
      return;
    }
    try {
      const _startAt = Date.now();
      windowProgress.start();
      const environments = await this.props.dispatch<any, Promise<IEnvironments>>({
        type: 'env/installCpplint',
        payload: {},
      });
      windowProgress.end();
      if (isEnvInstalled(environments, 'cpplint')) {
        sm.track.timing('install', 'cpplint', Date.now() - _startAt);
        router.push(getNextInstallerItemPage(environments));
      }
    } catch (e) {
      windowProgress.end();
      logRenderer.error(`[installCpplint]`, e);
      msg.error('安装环境失败');
      sm.track.event('install', 'error', 'cpplint', 1);
    }
  };

  render() {
    const props = this.props;
    const state = this.state;
    return (
      <div>
        <div className="container --slide-left">
          <div className="content-block --pb-xl">
            <h1 className="top-title">安装 {formatMessage({ id: 'env.cpplint' })}</h1>
            <p>正在安装，这只需要花费一点时间。</p>
          </div>
        </div>
        <ActionBar
          actions={[
            {
              key: 'installCpplint',
              type: 'primary',
              text: !props.loading ? '开始安装' : '正在安装',
              loading: props.loading,
              onClick: this.installCpplint,
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
    loading: !!state.loading.effects['env/installCpplint'],
  };
}

export default connect(mapStateToProps)(CpplintInstaller);
