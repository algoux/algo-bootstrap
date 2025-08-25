import React from 'react';
import { connect } from '@/utils/dva';
import router from 'umi/router';
import { Row, Col, Progress } from 'antd';
import ActionBar from '@/components/ActionBar';
import ExternalLink from '@/components/ExternalLink';
import sm from '@/utils/modules';
import ccppIcon from '@/assets/icons/ccpp.png';
import pythonIcon from '@/assets/icons/python.svg';
import cpplintIcon from '@/assets/icons/lint.svg';
import vscodeIcon from '@/assets/icons/vscode.svg';
import vscodeExtensionIcon from '@/assets/icons/vscode-extension.svg';
import EnvCard from '@/components/EnvCard';
import { isVsixAllInstalled, getNextInstallerItemPage } from '@/utils/env';
import { dialog, app, getCurrentWindow } from '@electron/remote';
import { logRenderer } from '@/utils/logger';
import msg from '@/utils/msg';
import constants from 'common/configs/constants';
import { formatMessage } from 'umi-plugin-locale';
import { DispatchProps } from '@/typings/props';
import { ipcRenderer as ipc } from 'electron-better-ipc';
import ipcKeys from 'common/configs/ipc';
import paths from 'common/configs/paths';
import * as path from 'path';
import { formatFileSize, formatPercentage } from 'common/utils/format';

const RESPACK_DOWNLOAD_PATH = path.join(app.getPath('userData'), paths.respackDownload);

export interface IEnvAndRespackProps {}

interface State {
  downloadTaskId: number;
  downloading: boolean;
  receivedSize: number;
  totalSize: number;
  speed: number;
}

type Props = IEnvAndRespackProps & ReturnType<typeof mapStateToProps> & DispatchProps;

class EnvAndRespack extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      downloadTaskId: 0,
      downloading: false,
      receivedSize: 0,
      totalSize: 0,
      speed: 0,
    };
  }

  componentDidMount() {
    ipc.answerMain(ipcKeys.downloadProgress, async (res) => {
      if (res.downloadTaskId === this.state.downloadTaskId) {
        this.setState({
          receivedSize: res.received,
          totalSize: res.total,
          speed: res.speed,
        });
      }
    });
    ipc.answerMain(ipcKeys.downloadDone, async (res) => {
      if (res.downloadTaskId === this.state.downloadTaskId) {
        this.setState({
          downloading: false,
        });
        const respackPath = path.join(RESPACK_DOWNLOAD_PATH, res.filename);
        this.importRespack(respackPath);
        sm.track.timing('download', 'done', res.time);
      }
    });
    ipc.answerMain(ipcKeys.downloadError, async (res) => {
      if (res.downloadTaskId === this.state.downloadTaskId) {
        this.setState({
          downloading: false,
        });
        sm.track.event('download', 'error');
      }
    });
  }

  downloadRespack = async () => {
    let downloadUrl = '';
    try {
      const versionInfo = await this.props.dispatch<{}, ICheckVersionInfo>({
        type: 'respack/getOnlineRespackVersion',
        payload: {},
      });
      logRenderer.info('[downloadRespack] version:', versionInfo);
      downloadUrl = versionInfo.url;
      sm.track.event('respack', 'download', versionInfo.version);
    } catch (e) {
      logRenderer.error('[downloadRespack] error:', e);
      msg.error('查询资源包版本失败');
    }
    if (downloadUrl) {
      const downloadTaskId = await ipc.callMain(ipcKeys.download, {
        url: downloadUrl,
        directory: RESPACK_DOWNLOAD_PATH,
        clearDir: true,
        errorTitle: '下载失败',
        errorMessage: '无法完成下载，因为网络错误',
        showBadge: false,
      });
      this.setState({
        downloadTaskId,
        downloading: true,
      });
    }
  };

  openRespack = async () => {
    const res = await dialog.showOpenDialog(getCurrentWindow(), {
      properties: ['openFile'],
      filters: [{ name: `${constants.appName} 资源包`, extensions: ['respack'] }],
    });
    const respackPath = res.filePaths ? res.filePaths[0] : '';
    this.importRespack(respackPath);
  };

  importRespack = async (respackPath: string) => {
    if (!respackPath) {
      return;
    }
    logRenderer.info(`[openRespack]`, respackPath);
    sm.track.event('respack', 'importStart', path.basename(respackPath));
    try {
      await this.props.dispatch({
        type: 'respack/importRespack',
        payload: {
          respackPath,
        },
      });
    } catch (e: any) {
      logRenderer.error(`[openRespack] load and validate failed:`, e);
      msg.error(e.msg);
      sm.track.event('respack', 'importError', 'error', 1);
      return;
    }
    sm.track.event('respack', 'importDone', path.basename(respackPath));
    msg.success('资源包导入完成', '点击「开始安装」完成后续步骤');
  };

  startInstall = () => {
    router.push(getNextInstallerItemPage(this.props.environments));
  };

  renderDownloadInfo = () => {
    const state = this.state;
    const received = formatFileSize(state.receivedSize);
    const total = formatFileSize(state.totalSize);
    const percent = formatPercentage(state.receivedSize, state.totalSize);
    const speed = formatFileSize(state.speed);
    return `${received} / ${total} (${percent})，当前速度：${speed}/s`;
  };

  renderRespackLink = () => {
    return <ExternalLink href="https://ab.algoux.org/#respack">手动下载</ExternalLink>;
  };

  render() {
    const {
      environments,
      hasRespack,
      manifest,
      importLoading: importing,
      getOnlineVersionloading,
    } = this.props;
    const { receivedSize, totalSize } = this.state;
    const downloading = getOnlineVersionloading || this.state.downloading;
    const colProps = {
      className: '--mt-sm --mb-sm',
      md: 12,
      xl: 6,
    };
    return (
      <div>
        <div className="container --slide-left">
          <div className="content-block">
            <h1 className="top-title">环境</h1>
            <Row gutter={8}>
              {/* <Col {...colProps}>
                <EnvCard
                  name={formatMessage({ id: 'env.gcc' })}
                  icon={ccppIcon}
                  installed={environments.gcc.installed}
                  version={(environments.gcc as ICheckEnvironmentResultInstalled).version}
                />
              </Col>
              <Col {...colProps}>
                <EnvCard
                  name={formatMessage({ id: 'env.python' })}
                  icon={pythonIcon}
                  installed={environments.python.installed}
                  version={(environments.python as ICheckEnvironmentResultInstalled).version}
                />
              </Col>
              <Col {...colProps}>
                <EnvCard
                  name={formatMessage({ id: 'env.cpplint' })}
                  icon={cpplintIcon}
                  installed={environments.cpplint.installed}
                  version={
                    'cpplint ' + (environments.cpplint as ICheckEnvironmentResultInstalled).version
                  }
                />
              </Col>
              <Col {...colProps}>
                <EnvCard
                  name={formatMessage({ id: 'env.vscode' })}
                  icon={vscodeIcon}
                  installed={environments.vscode.installed}
                  version={(environments.vscode as ICheckEnvironmentResultInstalled).version}
                />
              </Col>
              <Col {...colProps}>
                <EnvCard
                  name={formatMessage({ id: 'env.vsix' })}
                  icon={vscodeExtensionIcon}
                  installed={isVsixAllInstalled(environments)}
                />
              </Col> */}
            </Row>
          </div>

          <div className="content-block">
            <h1 className="top-title">资源包</h1>
            {downloading ? (
              <>
                <Progress
                  percent={(receivedSize / totalSize) * 100}
                  status="active"
                  showInfo={false}
                />
                <p>正在下载资源包：{this.renderDownloadInfo()}</p>
              </>
            ) : !hasRespack ? (
              <>
                <p>资源包囊括了所有必要的安装文件。</p>
                <p>
                  安装缺失的环境前，你必须导入一个资源包，这样向导才能智慧配置你的{' '}
                  {sm.platform.isMac ? 'Mac' : 'PC'}。
                </p>
                <p>
                  如果没有已存在的资源包，请点击「下载资源包」或 {this.renderRespackLink()} 并导入。
                </p>
              </>
            ) : (
              <>
                <p>
                  资源包已就绪。如要重新下载最新的资源包，请点击「下载资源包」或{' '}
                  {this.renderRespackLink()} 并导入。
                </p>
                <p>现在，向导已准备好智慧配置你的 {sm.platform.isMac ? 'Mac' : 'PC'}。</p>
              </>
            )}
          </div>
        </div>
        <ActionBar
          info={hasRespack && manifest ? <p>已导入资源包：v{manifest.version}</p> : null}
          actions={
            !hasRespack
              ? [
                  {
                    key: 'chooseRespack',
                    type: 'ghost',
                    text: '导入资源包',
                    loading: importing,
                    disabled: downloading,
                    onClick: this.openRespack,
                  },
                  {
                    key: 'downloadRespack',
                    type: 'primary',
                    text: '下载资源包',
                    loading: downloading,
                    disabled: importing,
                    onClick: this.downloadRespack,
                  },
                ]
              : [
                  {
                    key: 'reChooseRespack',
                    type: 'ghost',
                    text: '导入资源包',
                    loading: importing,
                    disabled: downloading,
                    onClick: this.openRespack,
                  },
                  {
                    key: 'reDownloadRespack',
                    type: 'ghost',
                    text: '下载资源包',
                    loading: downloading,
                    disabled: importing,
                    onClick: this.downloadRespack,
                  },
                  {
                    key: 'startInstall',
                    type: 'primary',
                    text: '开始安装',
                    disabled: downloading || importing,
                    onClick: this.startInstall,
                  },
                ]
          }
          delay={1000}
        />
      </div>
    );
  }
}

function mapStateToProps(state: IState) {
  return {
    environments: state.env.environments,
    hasRespack: state.respack.hasRespack,
    manifest: state.respack.manifest,
    importLoading: !!state.loading.effects['respack/importRespack'],
    getOnlineVersionloading: !!state.loading.effects['respack/getOnlineRespackVersion'],
  };
}

export default connect(mapStateToProps)(EnvAndRespack);
