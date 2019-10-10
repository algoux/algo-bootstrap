import { connect } from 'dva';
import React, { Component } from 'react';
import { formatMessage } from 'umi-plugin-locale';
import { Button } from 'antd';
import yay from '@/assets/yay.jpg';

import config from '@/config/config';
import ipcKeys from 'common/configs/ipc';
import { ipcRenderer as ipc } from 'electron-better-ipc';

interface Props {
}

interface StoreStateProps {
  global: {
    name: string;
  };
}

export type IIndexProps = Props & StoreStateProps;

interface State {
  ipc: string;
}

@connect((state: any) => {
  console.log('mapState', state);
  return state;
})
export default class Index extends Component<IIndexProps, State> {
  static defaultProps: Props = {};

  constructor(props: IIndexProps) {
    super(props);
    this.state = {
      ipc: '',
    };
  }

  componentDidMount() {
    // ipc.on('get-emoji-response', (event, emoji) => {
    //   console.log(emoji);
    // });

    // ipc.send('get-emoji', 'unicorn');
    this.test();
  }

  async test() {
    const ret = await ipc.callMain<string>(ipcKeys.getResPack, 'wa') as string;
    console.log('ipc ret:', ret);
    this.setState({ ipc: ret });
  }

  render() {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1>欢迎使用 {formatMessage({ id: 'app.name' })}</h1>
        <p>接下来，向导将指引你完成安装和配置。</p>
        <Button style={{ marginTop: '20px' }}>开始</Button>

        <h4>test ipc: {this.state.ipc}</h4>
        <h4>test @: {config.outputPath}</h4>
        <h4>test common: {ipcKeys.getResPack}</h4>
        <h4>test dva: {this.props.global.name}</h4>
        <h4>test image: <img src={yay} style={{ width: '25px', height: '25px' }} /></h4>
      </div>
    );
  }
}
