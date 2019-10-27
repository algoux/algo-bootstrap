import React from 'react';
import { connect } from '@/utils/dva';

import { formatMessage } from 'umi-plugin-locale';
import { Button } from 'antd';
import yay from '@/assets/yay.jpg';

import config from '@/config/config';
import ipcKeys from 'common/configs/ipc';
import { ipcRenderer as ipc } from 'electron-better-ipc';
import Test from '@/components/test';
import { remote } from 'electron';
import sm from '@/utils/modules';
import { logRenderer } from 'common/utils/logger';
import msg from '@/utils/msg';
import { DispatchProp } from 'react-redux';

const { req, Respack } = sm;

export interface IIndexProps {
}

interface State {
  ipc: string;
  remoteGlobal: string;
  respackPath: string;
}

type Props = IIndexProps & ReturnType<typeof mapStateToProps> & DispatchProp<any>;

class Index extends React.Component<Props, State> {
  constructor(props: Props) {
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

  getEnvironment = async () => {
    const env = await this.props.dispatch!({
      type: 'global/getEnvironment',
      payload: {
        force: true,
      },
    });
    logRenderer.info('getEnvironment:', env);
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
    // const res = await remote.dialog.showMessageBox(remote.getCurrentWindow(), {
    //   buttons: [],
    //   message: 'msg',
    //   detail: 'detail2\ndetail3',
    //   type: "error",
    // });
    // console.log('res', res);
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
        logRenderer.error(`[openRespack] open failed:`, e);
        msg.error('验证或应用资源包失败');
      }
    }
  }

  install = async () => {
    try {
      await sm.envInstaller.installGccAndGdb();
    } catch (e) {
      logRenderer.error(`[install] install failed:`, e);
      msg.error('安装环境时发生错误');
    }
  }

  render() {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1>欢迎使用 {formatMessage({ id: 'app.name' })}</h1>
        <p>接下来，向导将指引你完成安装和配置。</p>
        <Button style={{ marginTop: '20px' }} onClick={this.getEnvironment}>开始</Button>
        <Button style={{ marginTop: '20px' }} onClick={this.testRemoteGlobal}>开始2</Button>
        <Button style={{ marginTop: '20px' }} onClick={this.openRespack}>选择资源包</Button>
        <Button style={{ marginTop: '20px' }} onClick={this.install}>安装</Button>

        <h4>test respack path: {this.state.respackPath}</h4>
        <h4>test remote require: {this.state.remoteGlobal}</h4>
        <h4>test env: {JSON.stringify(this.props.global.environment)}</h4>
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

function mapStateToProps(state: IState) {
  console.log('mapState', state);
  return state;
}

export default connect(mapStateToProps)(Index);
