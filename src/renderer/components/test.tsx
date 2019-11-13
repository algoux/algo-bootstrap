import React, { Component } from 'react';
import { connect } from '@/utils/dva';
// import { connect } from 'dva';

export interface ITestProps {
  count: number;
  size?: number;
}

interface State {
  s: string;
}

function mapStateToProps(state: IState) {
  console.log('mapState', state);
  return {
    env: {
      name: state.env.name,
    },
  };
}

type Props = ITestProps & ReturnType<typeof mapStateToProps>;

// @connect(mapStateToProps)
class Test extends Component<Props, State> {
  static defaultProps = {
    size: 1,
  };

  constructor(props: Props) {
    super(props);
    this.state = {
      s: '',
    };
  }

  render() {
    return (
      <div>
        <p>props.count: {this.props.count}</p>
        <p>props.size: {this.props.size}</p>
        <p>state.env.name: {this.props.env.name}</p>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Test);
