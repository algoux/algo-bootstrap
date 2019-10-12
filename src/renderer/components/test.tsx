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

function mapStateToProps(state: AppState) {
  console.log('mapState', state);
  return {
    global: {
      name: state.global.name,
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
        <p>state.global.name: {this.props.global.name}</p>
      </div>
    );
  }
}

export default connect(mapStateToProps)(Test);
