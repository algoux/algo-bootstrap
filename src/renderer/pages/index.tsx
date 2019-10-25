import { connect } from 'dva';
import React, { Component } from 'react';
import { formatMessage } from 'umi-plugin-locale';
import { Button } from 'antd';
import yay from '@/assets/yay.jpg';

import config from '@/config/config';
import ipcKeys from 'common/configs/ipc';
import { ipcRenderer as ipc } from 'electron-better-ipc';
import Test from '../components/test';
import { remote, Accelerator } from 'electron';
import sm from '@/utils/modules';
import { logRenderer } from 'common/utils/logger';

const { req, Respack } = sm;

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
  respackPath: string;
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
      respackPath: '',
    };
  }

  componentDidMount() {
    // ipc.on('get-emoji-response', (event, emoji) => {
    //   console.log(emoji);
    // });

    // ipc.send('get-emoji', 'unicorn');
    // this.testIpc();
    // this.testRemoteGlobal();
  }

  testIpc = async () => {
    const ret = await ipc.callMain<string>(ipcKeys.getResPack, 'wa') as string;
    console.log('ipc ret:', ret);
    this.setState({ ipc: JSON.stringify(ret) });
  }

  testRemoteGlobal = async () => {
    logRenderer.info('go req');
    // logRenderer.warn('go log');
    const ret = await req.get<IApiResp<{ apis: string[], help: string }>>('https://acm.sdut.edu.cn/onlinejudge2/index.php/API_ng');
    logRenderer.warn('get ret', ret);
    this.setState({
      remoteGlobal: ret.data!.help,
    });
  }

  openRespack = async () => {
    const res = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: ['openFile'],
      filters: [
        { name: 'Algo Bootstrap 资源包', extensions: ['respack'] },
      ],
    });
    const respackPath = res.filePaths ? res.filePaths[0] : '';
    this.setState({
      respackPath,
    });
    logRenderer.info('open res', res);
    if (respackPath) {
      try {
        const respack = new Respack(respackPath);
        await respack.validate();
        await respack.extract();
      } catch (e) {
        logRenderer.error(`[respack] open failed with code ${e.retCode}:`, e);
        alert('无效或已损坏的资源包，请尝试重新下载' + (e.retCode ? `\n[code: ${e.retCode}]` : ''));
      }
    }
  }

  render() {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1>欢迎使用 {formatMessage({ id: 'app.name' })}</h1>
        <p>接下来，向导将指引你完成安装和配置。</p>
        <Button style={{ marginTop: '20px' }} onClick={this.testIpc}>开始</Button>
        <Button style={{ marginTop: '20px' }} onClick={this.testRemoteGlobal}>开始2</Button>
        <Button style={{ marginTop: '20px' }} onClick={this.openRespack}>选择资源包</Button>

        <h4>test respack path: {this.state.respackPath}</h4>
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
