import React from 'react';
import { Layout, Menu, Icon } from 'antd';
import { connect } from '@/utils/dva';
import sm from '@/utils/modules';
import { RouteProps, DispatchProps } from '@/typings/props';
import pages from '@/configs/pages';
import { Link } from 'react-router-dom';
import { formatMessage } from 'umi-plugin-locale';

interface IRootLayoutProps {
}

interface State {
}

type Props = IRootLayoutProps & ReturnType<typeof mapStateToProps> & DispatchProps & RouteProps;

class RootLayout extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  renderStatusIcon = (status: 'pending' | 'loading' | 'done', title = '') => {
    switch (status) {
      case 'loading':
        return <Icon type="loading" className="--mr-none" />;
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

  renderNavItem = (link: string, text: string, icon: React.ReactNode) => {
    const inner = <>
      <span className="menu-sub-item-title">{text}</span>
      {icon}
    </>;
    if (process.env.NODE_ENV === 'development') {
      return <Link to={link}>{inner}</Link>;
    }
    return inner;
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
              {this.renderNavItem(pages.preparation.respack, '环境和资源包', this.renderEnvRespackStatusIcon())}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.ItemGroup key="group-1" title="安装开发环境">
            <Menu.Item key={pages.installer.gcc}>
              {this.renderNavItem(pages.installer.gcc, formatMessage({ id: 'env.gcc' }), this.renderEnvStatusIcon('gcc'))}
            </Menu.Item>
            <Menu.Item key={pages.installer.python}>
              {this.renderNavItem(pages.installer.python, formatMessage({ id: 'env.python' }), this.renderEnvStatusIcon('python'))}
            </Menu.Item>
            <Menu.Item key={pages.installer.cpplint}>
              {this.renderNavItem(pages.installer.cpplint, formatMessage({ id: 'env.cpplint' }), this.renderEnvStatusIcon('cpplint'))}
            </Menu.Item>
            <Menu.Item key={pages.installer.code}>
              {this.renderNavItem(pages.installer.code, formatMessage({ id: 'env.code' }), this.renderEnvStatusIcon('code'))}
            </Menu.Item>
            <Menu.Item key={pages.installer.vsix}>
              {this.renderNavItem(pages.installer.vsix, formatMessage({ id: 'env.vsix' }), this.renderVsixStatusIcon())}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Item key={pages.board}>
            <Link to={pages.board}>
              <span>开始使用</span>
            </Link>
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
