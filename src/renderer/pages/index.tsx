import React from 'react';
import { connect } from '@/utils/dva';
import { DispatchProp } from 'react-redux';
import Loading from '@/components/Loading';
import router from 'umi/router';
import pages from '@/configs/pages';
import PageAnimation from '@/components/PageAnimation';

export interface IIndexProps {
}

interface State {
}

type Props = IIndexProps & ReturnType<typeof mapStateToProps> & DispatchProp<any>;

class Index extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  async componentDidMount() {
    await this.props.dispatch!({
      type: 'env/getEnvironments',
      payload: {},
    });
    router.push(pages.preparation.index);
  }

  render() {
    return <PageAnimation style={{ width: '100%', height: '100%' }}>
      <div className="full-center">
        <Loading size="large" />
      </div>
    </PageAnimation>;
  }
}

function mapStateToProps(state: IState) {
  return {
    env: state.env,
    loading: state.loading.effects['env/getEnvironments'],
  };
}

export default connect(mapStateToProps)(Index);
