import React from 'react';
import { connect } from '@/utils/dva';
import { DispatchProp } from 'react-redux';
import Loading from '@/components/Loading';
import router from 'umi/router';
import pages from '@/configs/pages';
import PageAnimation from '@/components/PageAnimation';
import { formatMessage } from 'umi-plugin-locale';
import { Button } from 'antd';
import ActionBar from '@/components/ActionBar';

export interface IRespackProps {
}

interface State {
  respackPath: string;
}

type Props = IRespackProps & ReturnType<typeof mapStateToProps> & DispatchProp<any>;

class Respack extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      respackPath: '',
    };
  }

  async componentDidMount() {
  }

  render() {
    return <div>
      <div className="container --text-center --slide-left">
      </div>
      <ActionBar actions={[
        {
          key: 'chooseRespack',
          type: 'primary',
          text: '选择资源包',
        },
      ]} />
    </div>;
  }
}

function mapStateToProps(state: IState) {
  return {
    env: state.env,
    loading: state.loading.effects['env/getEnvironments'],
  };
}

export default connect(mapStateToProps)(Respack);
