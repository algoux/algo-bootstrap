import React from 'react';
import { connect } from '@/utils/dva';
import { List, Icon, Row, Col, Card } from 'antd';
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

export interface IBoardProps {}

interface State {
  codeTemplateModalVisible: boolean;
}

type Props = IBoardProps & ReturnType<typeof mapStateToProps> & DispatchProps;

class Board extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      codeTemplateModalVisible: false,
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
      message: '选择一个文件夹作为项目目录，你也可以新建一个空文件夹',
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
        } else if (await msg.confirm('选定目录中已存在文件，仍要初始化这个项目？')) {
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
        msg.error('初始化项目失败');
      }
    }
    return null;
  };

  openTargetProject = async (projectPath: string) => {
    try {
      logRenderer.info('[openProject]', projectPath);
      projectPath && (await sm.vsc.openProject(projectPath));
    } catch (e) {
      logRenderer.info('[openProject]', e);
      msg.error('打开项目失败');
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
    if (await msg.confirm('删除这个项目？', '这个操作仅将项目从列表中移除，不会删除文件')) {
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

  renderEnvPanel = () => {
    const { environments } = this.props;

    return (
      <div className="--pb-xl">
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
            <h1 className="top-title">开始使用</h1>
            {this.renderEnvPanel()}
            <h2 className="secondary-title">项目</h2>
            <p className="--mb-xs">
              <a onClick={this.newProject}>新建或初始化旧项目...</a>
            </p>
            <p className="--mb-xs">
              <a onClick={this.openProject}>打开项目...</a>
            </p>
            <List
              size="small"
              split={false}
              locale={{ emptyText: '' }}
              dataSource={[...projects].reverse()}
              renderItem={(project: IProject) => (
                <List.Item
                  className="list-hover-action"
                  style={{ paddingTop: '2px', paddingBottom: '0' }}
                  actions={[
                    <a onClick={() => this.deleteProject(project.id)}>
                      <Icon type="delete" />
                    </a>,
                  ]}
                >
                  <a onClick={() => this.openTargetProject(project.path)}>
                    {path.basename(project.path)}
                  </a>
                  <span className="--ml-md-lg --user-select-text">{project.path}</span>
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
            <Row gutter={16}>
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
                <Card hoverable className="board-action-card">
                  <div className="board-action-card-icon">
                    <Icon type="code" />
                  </div>
                  <div className="board-action-card-content">
                    <div className="board-action-card-title">添加快捷命令</div>
                    <div className="board-action-card-desc">安装 abc 命令行工具</div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card hoverable className="board-action-card">
                  <div className="board-action-card-icon">
                    <Icon type="sync" />
                  </div>
                  <div className="board-action-card-content">
                    <div className="board-action-card-title">重新开始配置</div>
                    <div className="board-action-card-desc">重置配置状态并回溯</div>
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
