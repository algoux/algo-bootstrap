import React from 'react';
import { connect } from '@/utils/dva';
import { List, Icon, Row, Col } from 'antd';
import ExternalLink from '@/components/ExternalLink';
import sm from '@/utils/modules';
import { dialog, getCurrentWindow } from '@electron/remote';
import { logRenderer } from 'common/utils/logger';
import msg from '@/utils/msg';
import { DispatchProps } from '@/typings/props';
import PageAnimation from '@/components/PageAnimation';
import * as path from 'path';

export interface IBoardProps {}

interface State {}

type Props = IBoardProps & ReturnType<typeof mapStateToProps> & DispatchProps;

class Board extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
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
          <div className="content-block">
            <h1 className="top-title">开始使用</h1>
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
                VS Code 使用指南
              </ExternalLink>
            </p>
            <h2 className="secondary-title">探索</h2>
            {/* <Row gutter={8}>
            <Col {...colProps}><ExternalLink href="https://acm.sdut.edu.cn/">SDUT OJ</ExternalLink></Col>
            <Col {...colProps}><ExternalLink href="https://codeforces.com/">Codeforces</ExternalLink></Col>
            <Col {...colProps}><ExternalLink href="https://www.hackerrank.com/">HackerRank</ExternalLink></Col>
            <Col {...colProps}><ExternalLink href="http://acm.hdu.edu.cn/">HDOJ</ExternalLink></Col>
          </Row> */}
            <p className="--mb-xs">
              <ExternalLink href="https://acm.sdut.edu.cn/">SDUT OJ</ExternalLink>
            </p>
            <p className="--mb-xs">
              <ExternalLink href="https://codeforces.com/">Codeforces</ExternalLink>
            </p>
            <p className="--mb-xs">
              <ExternalLink href="https://onlinejudge.org/">UVa</ExternalLink>
            </p>
            <p className="--mb-xs">
              <ExternalLink href="https://hackerrank.com/">HackerRank</ExternalLink>
            </p>
            <p className="--mb-xs">
              <ExternalLink href="http://acm.hdu.edu.cn/">HDOJ</ExternalLink>
            </p>
            <p className="--mb-xs">
              <ExternalLink href="http://poj.org/">POJ</ExternalLink>
            </p>
            <p className="--mb-xs">
              <ExternalLink href="https://nanti.jisuanke.com/">计蒜客</ExternalLink>
            </p>
            <p className="--mb-xs">
              <ExternalLink href="https://ac.nowcoder.com/">牛客竞赛</ExternalLink>
            </p>
          </div>
        </div>
      </PageAnimation>
    );
  }
}

function mapStateToProps(state: IState) {
  return {
    projects: state.projects.list,
  };
}

export default connect(mapStateToProps)(Board);
