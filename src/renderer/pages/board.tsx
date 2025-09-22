import React from 'react';
import { connect } from '@/utils/dva';
import { List, Icon, Row, Col, Card, Spin } from 'antd';
import ExternalLink from '@/components/ExternalLink';
import sm from '@/utils/modules';
import { dialog, getCurrentWindow } from '@electron/remote';
import { logRenderer } from '@/utils/logger';
import msg from '@/utils/msg';
import { DispatchProps } from '@/typings/props';
import PageAnimation from '@/components/PageAnimation';
import * as path from 'path';
import EnvLabel from '@/components/EnvLabel';
import CodeTemplateModal from '@/components/CodeTemplateModal';
import c_cppIcon from '@/assets/icons/c_cpp.png';
import pythonIcon from '@/assets/icons/python.svg';
import vscodeIcon from '@/assets/icons/vscode.svg';
import { formatMessage } from 'umi-plugin-locale';
import { ipcRenderer as ipc } from 'electron-better-ipc';
import IPCKeys from 'common/configs/ipc';
import pages from '@/configs/pages';
import router from 'umi/router';
import Loading from '@/components/Loading';

export interface IBoardProps {}

interface State {
  codeTemplateModalVisible: boolean;
  installBinLoading: boolean;
}

type Props = IBoardProps & ReturnType<typeof mapStateToProps> & DispatchProps;

class Board extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      codeTemplateModalVisible: false,
      installBinLoading: false,
    };
  }

  componentDidMount() {
    this.props.dispatch({
      type: 'projects/getProjects',
      payload: {},
    });
  }

  initializeProject = async () => {
    const res = await dialog.showOpenDialog(getCurrentWindow(), {
      properties: ['openDirectory', 'createDirectory'],
      message: '选择一个文件夹作为代码存放目录',
    });
    const projectPath = res.filePaths ? res.filePaths[0] : '';
    if (projectPath) {
      if (
        sm.platform.isWindows &&
        /\p{Unified_Ideograph}/u.test(projectPath) &&
        !(await msg.confirm('选定路径中含有中文字符，可能无法使用调试功能，是否继续？'))
      ) {
        return null;
      }
      try {
        let init = false;
        if (await sm.vsc.isDirEmpty(projectPath)) {
          init = true;
        } else if (await msg.confirm('选定文件夹中已存在文件，仍要初始化并打开？')) {
          init = true;
        }
        if (init) {
          logRenderer.info('[initializeProject]', projectPath);
          sm.track.event('use', 'initProject');
          await sm.vsc.genProjectFiles(projectPath);
        } else {
          return null;
        }
        return projectPath;
      } catch (e) {
        logRenderer.error('[initializeProject]', e);
        msg.error('初始化文件夹失败');
      }
    }
    return null;
  };

  openTargetProject = async (projectPath: string) => {
    try {
      logRenderer.info('[openProject]', projectPath);
      const pathOpened = await sm.vsc.openProject(projectPath);
      if (!pathOpened) {
        msg.warn('文件夹不存在', '已从列表中移除这个记录，因为它可能已被删除。');
        this.props.dispatch({
          type: 'projects/deleteProject',
          payload: {
            projectId: projectPath, // lazy work, cuz id == path
          },
        });
        return;
      }
    } catch (e) {
      logRenderer.info('[openProject]', e);
      msg.error('打开文件夹失败');
    }
  };

  newProject = async () => {
    const projectPath = await this.initializeProject();
    if (projectPath) {
      this.props.dispatch({
        type: 'projects/addProject',
        payload: {
          id: projectPath,
          path: projectPath,
          createdAt: Date.now(),
        },
      });
      await this.openTargetProject(projectPath);
    }
  };

  openProject = async () => {
    const res = await dialog.showOpenDialog(getCurrentWindow(), {
      properties: ['openDirectory', 'createDirectory'],
    });
    const projectPath = res.filePaths ? res.filePaths[0] : '';
    if (projectPath) {
      sm.track.event('use', 'openProject');
      this.props.dispatch({
        type: 'projects/addProject',
        payload: {
          id: projectPath,
          path: projectPath,
          createdAt: Date.now(),
        },
      });
      await this.openTargetProject(projectPath);
    }
  };

  deleteProject = async (projectId: string) => {
    if (await msg.confirm('删除这个文件夹？', '这个操作仅将其从列表中移除，不会删除文件夹内的文件')) {
      sm.track.event('use', 'deleteProject');
      this.props.dispatch({
        type: 'projects/deleteProject',
        payload: {
          projectId,
        },
      });
    }
  };

  openCodeTemplateModal = () => {
    this.setState({
      codeTemplateModalVisible: true,
    });
  };

  closeCodeTemplateModal = () => {
    this.setState({
      codeTemplateModalVisible: false,
    });
  };

  installBin = async () => {
    if (this.state.installBinLoading) {
      return;
    }
    this.setState({
      installBinLoading: true,
    });
    try {
      await sm.appService.installBin();
      this.setState({
        installBinLoading: false,
      });
      msg.success('添加完成', '重启终端会话即可使用 abc 命令');
    } catch (e) {
      logRenderer.error('[installBin]', e);
      msg.error('添加失败');
    } finally {
      this.setState({
        installBinLoading: false,
      });
    }
  };

  resetConfig = async () => {
    try {
      const result = await ipc.callMain(IPCKeys.showResetConfigDialog);
      if (result.confirmed) {
        await sm.vsc.resetConfiguration({ reuseVscProfile: result.reuseVscProfile });
        this.props.dispatch({
          type: 'env/resetAllModuleConfigStatus',
          payload: {},
        });
        router.push(pages.index);
      }
    } catch (error) {
      logRenderer.error('[resetConfig]', error);
      msg.error('重置失败');
    }
  };

  renderEnvPanel = () => {
    const { environments } = this.props;

    return (
      <div className="--pb-sm">
        <Row gutter={8}>
          <Col span={8}>
            <EnvLabel
              name="C/C++"
              icon={c_cppIcon}
              version={`${(environments.gcc as ICheckEnvironmentResultInstalled).version} (${(environments.gcc as ICheckEnvironmentResultInstalled<ICheckEnvironmentResultMetaGcc>).meta?.type})`}
            />
          </Col>
          <Col span={8}>
            <EnvLabel
              name="Python"
              icon={pythonIcon}
              version={(environments.python as ICheckEnvironmentResultInstalled).version}
            />
          </Col>
          <Col span={8}>
            <EnvLabel
              name="VS Code"
              icon={vscodeIcon}
              version={(environments.vscode as ICheckEnvironmentResultInstalled).version}
            />
          </Col>
        </Row>
      </div>
    );
  };

  render() {
    const { projects } = this.props;
    const colProps = {
      className: '--mt-sm --mb-sm',
      md: 6,
      xl: 4,
    };

    return (
      <PageAnimation>
        <div className="container no-action-bar">
          <div className="content-block --pb-xl">
            <h1 className="top-title" style={{ marginBottom: '16px' }}>
              Enjoy Coding.
            </h1>
            {this.renderEnvPanel()}
            <h2 className="secondary-title">码放处</h2>
            <p className="--mb-xs">
              <a onClick={this.newProject}>新建或打开一个代码存放文件夹...</a>
            </p>
            <List
              size="small"
              split={false}
              locale={{ emptyText: '' }}
              className="codespaces-list"
              // @ts-ignore
              style={{ overflowY: projects.length > 3 ? 'auto' : 'hidden' }}
              dataSource={[...projects].reverse()}
              renderItem={(project: IProject) => (
                <List.Item
                  className="codespaces-list-item codespaces-list-hover-action"
                  actions={[
                    <a onClick={() => this.deleteProject(project.id)}>
                      <Icon type="delete" />
                    </a>,
                  ]}
                >
                  <a onClick={() => this.openTargetProject(project.path)}>
                    {path.basename(project.path)}
                  </a>
                  <span className="--ml-md-lg --user-select-text codespaces-list-item-path">{project.path}</span>
                </List.Item>
              )}
            />
            <h2 className="secondary-title">帮助</h2>
            <p className="--mb-xs">
              <ExternalLink href="https://ab.algoux.org/docs/getting_started/">
                {formatMessage({ id: 'app.name' })} 使用指南
              </ExternalLink>
            </p>

            <h2 className="secondary-title">更多功能</h2>
            <Row gutter={12}>
              <Col span={12}>
                <Card hoverable className="board-action-card" onClick={this.openCodeTemplateModal}>
                  <div className="board-action-card-icon">
                    <Icon type="unordered-list" />
                  </div>
                  <div className="board-action-card-content">
                    <div className="board-action-card-title">设置代码初始化模板</div>
                    <div className="board-action-card-desc">自定义代码片段（ac）</div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card hoverable className="board-action-card" onClick={this.installBin}>
                  <div className="board-action-card-icon">
                    <Icon type="code" />
                  </div>
                  <div className="board-action-card-content">
                    <div className="board-action-card-title">
                      添加快捷命令
                      {this.state.installBinLoading ? <Loading className="--ml-md" delay={500} /> : null}
                    </div>
                    <div className="board-action-card-desc">安装 abc 命令行工具</div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card hoverable className="board-action-card" onClick={this.resetConfig}>
                  <div className="board-action-card-icon">
                    <Icon type="sync" />
                  </div>
                  <div className="board-action-card-content">
                    <div className="board-action-card-title">重新配置</div>
                    <div className="board-action-card-desc">修改组件清单并再次配置</div>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
        <CodeTemplateModal
          visible={this.state.codeTemplateModalVisible}
          onClose={this.closeCodeTemplateModal}
        />
      </PageAnimation>
    );
  }
}

function mapStateToProps(state: IState) {
  return {
    environments: state.env.environments,
    projects: state.projects.list,
  };
}

export default connect(mapStateToProps)(Board);
