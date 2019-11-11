import React from 'react';
import { connect } from '@/utils/dva';

import { formatMessage } from 'umi-plugin-locale';
import { Button, Progress } from 'antd';
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
// @ts-ignore
import filesize from 'filesize';
import { formatPercentage } from 'common/utils/format';

const { req, Respack } = sm;

export interface IIndexProps {
}

interface State {
  ipc: string;
  remoteGlobal: string;
  respackPath: string;
  mingwTotalSize: number;
  mingwUncompressedSize: number;
  projectPath: string;
}

type Props = IIndexProps & ReturnType<typeof mapStateToProps> & DispatchProp<any>;

class Index extends React.Component<Props, State> {
  _pollMingwSizeTimer?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = {
      ipc: '',
      remoteGlobal: '',
      respackPath: '',
      mingwTotalSize: 0,
      mingwUncompressedSize: 0,
      projectPath: '',
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

  getEnvironments = async () => {
    const env = await this.props.dispatch!({
      type: 'global/getEnvironments',
      payload: {
        force: true,
      },
    });
    logRenderer.info('getEnvironments:', env);
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
      const respack = new Respack(respackPath);
      try {
        await respack.loadManifest();
        await respack.validate();
      } catch (e) {
        logRenderer.error(`[openRespack] open failed:`, e);
        msg.error('验证资源包失败');
      }
      try {
        await respack.extract();
      } catch (e) {
        logRenderer.error(`[openRespack] open failed:`, e);
        msg.error('应用资源包失败');
      }
    }
  }

  getMingwTotalSize = async () => {
    const size = await sm.envInstaller.getMingwTotalSize();
    this.setState({
      mingwTotalSize: size,
    });
  }

  pollMingwUncompressedSize = async () => {
    try {
      const size = await sm.envInstaller.getMingwUncompressedSize();
      this.setState({
        mingwUncompressedSize: size,
      });
    } catch (e) { }
    this._pollMingwSizeTimer = setTimeout(() => {
      this.pollMingwUncompressedSize();
    }, 1000);
  }

  installGcc = async () => {
    try {
      if (sm.platform.isWindows) {
        await this.getMingwTotalSize();
        this.pollMingwUncompressedSize();
      }
      await sm.envInstaller.installGccAndGdb();
    } catch (e) {
      logRenderer.error(`[install] install failed:`, e);
      msg.error('安装环境时发生错误');
    } finally {
      clearTimeout(this._pollMingwSizeTimer!);
    }
  }

  installPython = async () => {
    try {
      await sm.envInstaller.installPython();
    } catch (e) {
      logRenderer.error(`[install] install failed:`, e);
      msg.error('安装环境时发生错误');
    }
  }

  installCpplint = async () => {
    try {
      await sm.envInstaller.installCpplint();
    } catch (e) {
      logRenderer.error(`[install] install failed:`, e);
      msg.error('安装环境时发生错误');
    }
  }

  installVSCode = async () => {
    try {
      await sm.envInstaller.installVSCode(true);
    } catch (e) {
      logRenderer.error(`[install] install failed:`, e);
      msg.error('安装环境时发生错误');
    }
  }

  installVsix = async (vsixId: SupportedVSIXId) => {
    try {
      await sm.envInstaller.installVsix(vsixId, true);
    } catch (e) {
      logRenderer.error(`[install] install failed:`, e);
      msg.error('安装环境时发生错误');
    }
  }

  initializeProject = async () => {
    const res = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: ['openDirectory'],
    });
    const projectPath = res.filePaths ? res.filePaths[0] : '';
    if (projectPath) {
      this.setState({
        projectPath,
      });
      try {
        let init = false;
        if (await sm.vsc.isDirEmpty(projectPath)) {
          init = true;
        } else if (await msg.confirm('选定目录中已存在文件，仍要初始化？')) {
          init = true;
        }
        if (init) {
          logRenderer.info('[initializeProject]', projectPath);
          await sm.vsc.genProjectFiles(projectPath);
        }
      } catch (e) {
        logRenderer.error('[initializeProject]', e);
        msg.error('初始化项目时发生错误');
      }
    }
  }

  openProject = async (projectPath: string) => {
    try {
      logRenderer.info('[openProject]', projectPath);
      projectPath && await sm.vsc.openProject(projectPath);
    } catch (e) {
      logRenderer.info('[openProject]', e);
      msg.error('初始化项目时发生错误');
    }
  }

  render() {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1>欢迎使用 {formatMessage({ id: 'app.name' })}</h1>
        <p>接下来，向导将指引你完成安装和配置。</p>
        <Button style={{ marginTop: '20px' }} onClick={this.getEnvironments}>检查环境</Button>
        {/* <Button style={{ marginTop: '20px' }} onClick={this.testRemoteGlobal}>开始2</Button> */}
        <Button style={{ marginTop: '20px' }} onClick={this.openRespack}>选择资源包</Button>
        <br />
        <Button style={{ marginTop: '20px' }} onClick={this.installGcc}>安装 GCC</Button>
        <Button style={{ marginTop: '20px' }} onClick={this.installPython}>安装 Python</Button>
        <Button style={{ marginTop: '20px' }} onClick={this.installCpplint}>安装 cpplint</Button>
        <Button style={{ marginTop: '20px' }} onClick={this.installVSCode}>安装 VS Code</Button>
        <br />
        {sm.envChecker.VSIXIds.map(vsixId => {
          return <Button key={vsixId} style={{ marginTop: '20px' }} onClick={() => this.installVsix(vsixId)}>{vsixId.split('.')[1]}</Button>;
        })}

        <br />
        <Button style={{ marginTop: '20px' }} onClick={this.initializeProject}>初始化 VSC 项目</Button>
        <Button style={{ marginTop: '20px' }} onClick={() => this.openProject(this.state.projectPath)}>打开项目</Button>

        <Progress percent={this.state.mingwUncompressedSize / this.state.mingwTotalSize * 100} status="active" showInfo={false} />
        <h4>test mingw size: {filesize(this.state.mingwUncompressedSize, { standard: "iec" })} / {filesize(this.state.mingwTotalSize, { standard: "iec" })} ({formatPercentage(this.state.mingwUncompressedSize, this.state.mingwTotalSize)})</h4>
        <h4>test respack path: {this.state.respackPath}</h4>
        <h4>test remote require: {this.state.remoteGlobal}</h4>
        <h4>test env: {JSON.stringify(this.props.global.environments)}</h4>
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
