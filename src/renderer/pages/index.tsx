import { connect } from 'dva';
import React, { Component } from 'react';
import { formatMessage } from 'umi-plugin-locale';
import { Button } from 'antd';
import yay from '@/assets/yay.jpg';

import config from '@/config/config';
import ipcKeys from 'common/configs/ipc';
import { ipcRenderer as ipc } from 'electron-better-ipc';
import Test from '../components/test';
import { remote } from 'electron';
import sm from '@/utils/modules';
import { logRenderer } from 'common/utils/logger';

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
  remoteGlobal: string;
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
      remoteGlobal: '',
    };
  }

  componentDidMount() {
    // ipc.on('get-emoji-response', (event, emoji) => {
    //   console.log(emoji);
    // });

    // ipc.send('get-emoji', 'unicorn');
    this.testIpc();
    this.testRemoteGlobal();
  }

  async testIpc() {
    const ret = await ipc.callMain<string>(ipcKeys.getResPack, 'wa') as string;
    console.log('ipc ret:', ret);
    this.setState({ ipc: ret });
  }

  testRemoteGlobal = async () => {
    logRenderer.info('go req');
    // logRenderer.warn('go log');
    const req = sm.req;
    const ret = await req.get<IApiResp<{ apis: string[], help: string }>>('https://acm.sdut.edu.cn/onlinejudge2/index.php/API_ng');
    logRenderer.warn('get ret', ret);
    this.setState({
      remoteGlobal: ret.data!.help,
    });
  }

  render() {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1>欢迎使用 {formatMessage({ id: 'app.name' })}</h1>
        <p>接下来，向导将指引你完成安装和配置。</p>
        <Button style={{ marginTop: '20px' }} onClick={this.testRemoteGlobal}>开始</Button>

        <h4>test remote require: {this.state.remoteGlobal}</h4>
        <h4>test ipc: {this.state.ipc}</h4>
        <h4>test @: {config.outputPath}</h4>
        <h4>test common: {ipcKeys.getResPack}</h4>
        <h4>test dva: {this.props.global.name}</h4>
        <h4>test image: <img src={yay} style={{ width: '25px', height: '25px' }} /></h4>

        <Test
          count={3}
          // size={2}
          // global={{ name: '123' }}
          // xxx={3}
        />
      </div>
    );
  }
}
