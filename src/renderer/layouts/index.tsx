import React from 'react';
import { Layout, Menu, Icon } from 'antd';
import { DispatchProp } from 'react-redux';
import { connect } from '@/utils/dva';
import sm from '@/utils/modules';
import { RouteProps } from '@/typings/props';
import pages from '@/configs/pages';

interface IRootLayoutProps {
}

interface State {
}

type Props = IRootLayoutProps & ReturnType<typeof mapStateToProps> & DispatchProp<any> & RouteProps;

class RootLayout extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  renderStatusIcon = (status: 'pending' | 'loading' | 'done', title = '') => {
    switch (status) {
      case 'loading':
        return <Icon type="loading-3-quarters" spin className="--mr-none" />;
      case 'done':
        return <Icon type="check" className="--mr-none" title={title} />;
    }
    return null;
  }

  renderEnvRespackStatusIcon = () => {
    const props = this.props;
    const hasRespack = props.hasRespack;
    if (props.loadings.getEnvironments || props.loadings.getHasRespack) {
      return this.renderStatusIcon('loading');
    }
    if (hasRespack) {
      return this.renderStatusIcon('done');
    }
    return null;
  }

  renderEnvStatusIcon = (envId: Exclude<SupportedEnvId, 'gdb'>) => {
    const props = this.props;
    const environments = props.environments;
    if (props.loadings[envId]) {
      return this.renderStatusIcon('loading');
    }
    const env = environments[envId];
    if (env.installed) {
      return this.renderStatusIcon('done', `已安装：${envId} ${env.version}`);
    }
    return null;
  }

  renderVsixStatusIcon = () => {
    const props = this.props;
    const environments = props.environments;
    if (props.loadings.vsix) {
      return this.renderStatusIcon('loading');
    }
    let installed = true;
    for (const vsixId of sm.envChecker.VSIXIds) {
      if (!environments.vsix[vsixId].installed) {
        installed = false;
        break;
      }
    }
    if (installed) {
      return this.renderStatusIcon('done');
    }
    return null;
  }

  render() {
    const props = this.props;
    const bgStyle = { backgroundColor: sm.platform.isMac ? 'transparent' : 'rgb(227, 229, 231)' };
    const { location } = props;
    const activeLinkKey = location.pathname;

    return <Layout>
      <Layout.Sider
        theme="light"
        className="sidebar --slide-right"
        style={{
          overflow: 'auto', height: '100vh', position: 'fixed', left: 0,
          ...bgStyle,
        }}
      >
        <div
          style={{
            // height: '32px',
            margin: '32px 0 16px 24px',
            fontSize: '18px',
            fontWeight: 500,
            textTransform: 'uppercase',
          }}
        >Algo<br />Bootstrap</div>
        <Menu
          mode="inline"
          selectedKeys={[`${activeLinkKey}`]}
          style={{ backgroundColor: 'transparent' }}
        >
          <Menu.ItemGroup key="group-0" title="准备">
            <Menu.Item key={pages.preparation.respack}>
              <span className="menu-sub-item-title">环境和资源包</span>
              {this.renderEnvRespackStatusIcon()}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.ItemGroup key="group-1" title="安装开发环境">
            <Menu.Item key={pages.installer.gcc}>
              <span className="menu-sub-item-title">C/C++</span>
              {this.renderEnvStatusIcon('gcc')}
            </Menu.Item>
            <Menu.Item key={pages.installer.python}>
              <span className="menu-sub-item-title">Python 支持</span>
              {this.renderEnvStatusIcon('python')}
            </Menu.Item>
            <Menu.Item key={pages.installer.cpplint}>
              <span className="menu-sub-item-title">代码风格检查器</span>
              {this.renderEnvStatusIcon('cpplint')}
            </Menu.Item>
            <Menu.Item key={pages.installer.code}>
              <span className="menu-sub-item-title">VS Code</span>
              {this.renderEnvStatusIcon('code')}
            </Menu.Item>
            <Menu.Item key={pages.installer.vsix}>
              <span className="menu-sub-item-title">VS Code 扩展</span>
              {this.renderVsixStatusIcon()}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Item key={pages.projects}>
            <span>开始使用</span>
          </Menu.Item>
        </Menu>
      </Layout.Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Layout.Content>
          {props.children}
        </Layout.Content>
      </Layout>
    </Layout>;
  }
}

function mapStateToProps(state: IState) {
  return {
    environments: state.env.environments,
    hasRespack: state.respack.hasRespack,
    loadings: {
      getEnvironments: !!state.loading.effects['env/getEnvironments'],
      gcc: !!state.loading.effects['env/installGcc'],
      python: !!state.loading.effects['env/installPython'],
      cpplint: !!state.loading.effects['env/installCpplint'],
      code: !!state.loading.effects['env/installVSCode'],
      vsix: !!state.loading.effects['env/installVsix'],
      getHasRespack: !!state.loading.effects['respack/getHasRespack'],
    },
  };
}

export default connect(mapStateToProps)(RootLayout);
