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

export interface IIndexProps {}

interface State {}

type Props = IIndexProps & ReturnType<typeof mapStateToProps> & DispatchProps;

class Index extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  async componentDidMount() {
    // router.push(pages.test);
    // return;
    const environments = await this.props.dispatch({
      type: 'env/getEnvironments',
      payload: {},
    });
    if (isAllInstalled(environments)) {
      router.push(pages.board);
      return;
    }
    const envComponents = sm.envComponents;
    const resourceIds = Object.values(envComponents).flatMap((c) => c.resources);
    logRenderer.info('fetching resource indexes:', resourceIds);
    const { successful, failed } = await this.props.dispatch({
      type: 'resources/getResourceIndexItems',
      payload: {
        resourceIds,
      },
    });
    logRenderer.info(
      'resource index items fetch completed. successful:',
      successful,
      'failed:',
      failed,
    );

    const hasRespack = await this.props.dispatch({
      type: 'respack/getHasRespack',
      payload: {},
    });
    hasRespack &&
      (await this.props.dispatch({
        type: 'respack/getManifest',
        payload: {},
      }));
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
      !!state.loading.effects['respack/getHasRespack'] ||
      !!state.loading.effects['respack/getManifest'] ||
      !!state.loading.effects['resources/getResourceIndexItems'],
  };
}

export default connect(mapStateToProps)(Index);
