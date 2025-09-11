import React from 'react';
import { connect } from '@/utils/dva';
import Loading from '@/components/Loading';
import router from 'umi/router';
import pages from '@/configs/pages';
import PageAnimation from '@/components/PageAnimation';
import { DispatchProps } from '@/typings/props';
import { isAllInstalled } from '@/utils/env';
import sm from '@/utils/modules';
import { logRenderer } from '@/utils/logger';
import { EnvComponentModule, EnvComponentModuleConfigStatus } from '@/typings/env';

export interface IIndexProps {}

interface State {}

type Props = IIndexProps & ReturnType<typeof mapStateToProps> & DispatchProps;

class Index extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  async componentDidMount() {
    const _envStart = performance.now();
    const environments = await this.props.dispatch({
      type: 'env/getEnvironments',
      payload: {},
    });
    const _envEnd = performance.now();
    logRenderer.info(`environments fetched in ${_envEnd - _envStart}ms.`);


    const completionState = sm.appConf.get('completionState')
    logRenderer.info('completionState', completionState);
    if (completionState) {
      this.props.dispatch({
        type: 'env/setModuleConfigStatus',
        payload: {
          moduleConfigStatus: {
            [EnvComponentModule.c_cpp]: EnvComponentModuleConfigStatus.DONE,
            [EnvComponentModule.python]: EnvComponentModuleConfigStatus.DONE,
            [EnvComponentModule.vscode]: EnvComponentModuleConfigStatus.DONE,
            [EnvComponentModule.extensions]: EnvComponentModuleConfigStatus.DONE,
            [EnvComponentModule.magic]: EnvComponentModuleConfigStatus.DONE,
          },
        },
      });
      router.push(pages.board);
      return;
    }

    const envComponents = sm.envComponents;
    const _riStart = performance.now();
    const resourceIds = Object.values(envComponents).flatMap((c) => c.resources);
    logRenderer.info('fetching resource indexes:', resourceIds);
    const { successful, failed } = await this.props.dispatch({
      type: 'resources/getResourceIndexItems',
      payload: {
        resourceIds,
      },
    });
    const _riEnd = performance.now();
    logRenderer.info(
      `resource indexes fetched in ${_riEnd - _riStart}ms. successful:`,
      successful,
      'failed:',
      failed,
    );

    router.push(pages.preparation.index);
  }

  render() {
    return (
      <PageAnimation style={{ width: '100%', height: '100%' }}>
        <div className="full-center">
          <Loading size="large" />
        </div>
      </PageAnimation>
    );
  }
}

function mapStateToProps(state: IState) {
  return {
    env: state.env,
    loading:
      !!state.loading.effects['env/getEnvironments'] ||
      !!state.loading.effects['resources/getResourceIndexItems'],
  };
}

export default connect(mapStateToProps)(Index);
