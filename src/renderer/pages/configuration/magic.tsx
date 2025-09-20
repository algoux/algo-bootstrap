import React from 'react';
import { connect } from '@/utils/dva';
import router from 'umi/router';
import ActionBar from '@/components/ActionBar';
import sm from '@/utils/modules';
import { logRenderer } from '@/utils/logger';
import msg from '@/utils/msg';
import { formatMessage } from 'umi-plugin-locale';
import windowsStep_1 from '@/assets/guides/magic/magic-win32-light-step-1.png';
import macStep_1 from '@/assets/guides/magic/magic-darwin-light-step-1.png';
import { getNextConfigurationModulePage, isEnvInstalled, needInstallEnvComponent } from '@/utils/env';
import { DispatchProps } from '@/typings/props';
import { getCurrentWindow } from '@electron/remote';
import { EnvComponentModule, EnvComponentModuleConfigStatus } from '@/typings/env';
import pages from '@/configs/pages';
import { EnvComponent } from 'common/configs/env';
import { VSIXIdMap } from 'common/configs/resources';

export interface IMagicConfiguratorProps {}

interface State {
  started: boolean;
  checkCompleteLoading: boolean;
}

type Props = IMagicConfiguratorProps & ReturnType<typeof mapStateToProps> & DispatchProps;

function genInitialState(): State {
  return {
    started: false,
    checkCompleteLoading: false,
  };
}

let cachedState = genInitialState();

class MagicConfigurator extends React.Component<Props, State> {
  _pollMingwSizeTimer?: number;
  _startAt: number = 0;

  constructor(props: Props) {
    super(props);
    this.state = cachedState;
  }

  componentWillUnmount() {
    cachedState = {
      ...this.state,
      checkCompleteLoading: false,
    };
    getCurrentWindow().setProgressBar(-1);
  }

  startInject = async () => {
    this.setState({
      started: true,
    });
    await this.setProcessing();

    try {
      const { envConfig } = this.props;
      const requiredResourceIds = [
        ...sm.envComponents[EnvComponent.basicExtensions].resources,
        ...(needInstallEnvComponent(envConfig, EnvComponent.codeStyleExtensions)
          ? sm.envComponents[EnvComponent.codeStyleExtensions].resources
          : []),
      ];
      const vsixResourceIds = requiredResourceIds.filter((resourceId) =>
        resourceId.startsWith('vsix.'),
      );
      const vsixIds = vsixResourceIds.map((resourceId) => VSIXIdMap[resourceId]);
      const res = await this.props.dispatch({
        type: 'env/injectMagic',
        payload: {
          vsixIds,
          gccAlt: this.props.envConfig.c_cpp.options?.useGccAlt,
        },
      });
      logRenderer.info('[startInject] res:', res);
      this.complete();
    } catch (e) {
      logRenderer.error(`[startInject]`, e);
      msg.error('注入失败');
      await this.props.dispatch({
        type: 'env/setModuleConfigStatusItem',
        payload: {
          module: EnvComponentModule.magic,
          status: EnvComponentModuleConfigStatus.PENDING,
        },
      });
    }

    this.setState({
      started: false,
    });
  };

  setProcessing = async () => {
    await this.props.dispatch({
      type: 'env/setModuleConfigStatusItem',
      payload: {
        module: EnvComponentModule.magic,
        status: EnvComponentModuleConfigStatus.PROCESSING,
      },
    });
  };

  complete = async (env?: IEnvironments) => {
    const environments = env || this.props.environments;
    if (environments && isEnvInstalled(environments, 'vscodeProfile')) {
      await this.props.dispatch({
        type: 'env/setModuleConfigStatusItem',
        payload: {
          module: EnvComponentModule.magic,
          status: EnvComponentModuleConfigStatus.DONE,
        },
      });
      router.push(getNextConfigurationModulePage(this.props.moduleConfigStatus));
    } else {
      msg.error('未检测到注入完成，请重试');
    }
  };

  render() {
    const state = this.state;

    return (
      <div className="--full-height">
        <div className="container --slide-left">
          <div className="content-block --pb-xl">
            <h1 className="top-title">注入魔法配置</h1>
            <p>向导将注入魔法配置以增益编辑器能力。请先完整阅读操作指引，之后点击「开始注入」。</p>
            <p></p>
            <p className="color-secondary">{formatMessage({ id: 'env.installer.tips' })}</p>
            <div className="article">
              <h3 className="section-header">1. 等待妙妙窗口打开</h3>
              <p>如果出现下图所示的弹窗，请点击蓝色的按钮；否则，无需操作。</p>
              {sm.platform.isWindows && <img src={windowsStep_1} />}
              {sm.platform.isMac && <img src={macStep_1} />}
              <p className={`${sm.platform.isWindows ? '--mt-md ' : ''}`}>
                保持双手离开键盘且不要触碰窗口，跟随出现的提示，直到仪式完成。
              </p>
            </div>
          </div>
        </div>
        <ActionBar
          actions={[
            {
              key: 'startInject',
              type: 'primary',
              text: '开始注入',
              loading: state.started,
              onClick: this.startInject,
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
    resourceIndex: state.resources.resourceIndex,
    envConfig: state.env.config,
    moduleConfigStatus: state.env.moduleConfigStatus,
    loading: !!state.loading.effects['env/injectMagic'],
  };
}

export default connect(mapStateToProps)(MagicConfigurator);
