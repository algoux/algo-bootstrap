import React from 'react';
import { Layout, Menu, Icon } from 'antd';
import { connect } from '@/utils/dva';
import sm from '@/utils/modules';
import { RouteProps, DispatchProps } from '@/typings/props';
import pages from '@/configs/pages';
import { Link } from 'react-router-dom';
import { formatMessage } from 'umi-plugin-locale';
import { VSIXIds } from 'common/configs/resources';
import { EnvComponentModule, EnvComponentModuleConfigStatus } from '@/typings/env';

interface IRootLayoutProps {}

interface State {}

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
  };

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
  };

  renderEnvStatusIcon = (module: EnvComponentModule) => {
    const { moduleConfigStatus } = this.props;
    if (moduleConfigStatus[module] === EnvComponentModuleConfigStatus.PROCESSING) {
      return this.renderStatusIcon('loading');
    }
    if (moduleConfigStatus[module] === EnvComponentModuleConfigStatus.DONE) {
      return this.renderStatusIcon('done');
    }
    return null;
  };

  renderVsixStatusIcon = () => {
    const props = this.props;
    const environments = props.environments;
    if (props.loadings.vsix) {
      return this.renderStatusIcon('loading');
    }
    let installed = true;
    for (const vsixId of VSIXIds) {
      if (!environments.vsix[vsixId].installed) {
        installed = false;
        break;
      }
    }
    if (installed) {
      return this.renderStatusIcon('done');
    }
    return null;
  };

  renderNavItem = (link: string, text: string, icon?: React.ReactNode) => {
    const inner = (
      <>
        <span className="menu-sub-item-title">{text}</span>
        {icon ? icon : null}
      </>
    );
    if (process.env.NODE_ENV === 'development') {
      return <Link to={link}>{inner}</Link>;
    }
    return inner;
  };

  render() {
    const props = this.props;
    const bgStyle = {
      backgroundColor: sm.platform.isMac ? 'transparent' : 'rgb(227, 229, 231)',
      ...(sm.platform.isMac && {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }),
    };
    const { location } = props;
    const activeLinkKey = location.pathname;

    return (
      <Layout>
        {/* 顶部拖拽区域 - 仅在 macOS 上显示 */}
        {sm.platform.isMac && (
          <div
            className="--draggable"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: 28 + 10 + 'px', // macOS 标题栏高度 + 额外热区
              zIndex: 1000,
              pointerEvents: 'auto',
            }}
          />
        )}
        <Layout.Sider
          theme="light"
          className="sidebar --slide-right"
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            ...bgStyle,
            ...(sm.platform.isMac && {
              paddingTop: '28px', // 补偿隐藏的标题栏高度
            }),
          }}
        >
          <div
            className={`brand ${sm.platform.isMac ? '--draggable' : ''}`}
            style={{
              // height: '32px',
              padding: '32px 0 16px 24px',
              fontSize: '18px',
              fontWeight: 500,
              textTransform: 'uppercase',
              cursor: sm.platform.isMac ? 'default' : 'auto',
            }}
          >
            Algo
            <br />
            Bootstrap
          </div>
          <Menu
            mode="inline"
            selectedKeys={[`${activeLinkKey}`]}
            style={{ backgroundColor: 'transparent' }}
          >
            <Menu.ItemGroup key="group-0" title="准备">
              <Menu.Item key={pages.preparation.configuration}>
                {this.renderNavItem(
                  pages.preparation.configuration,
                  '配置清单',
                  this.renderEnvRespackStatusIcon(),
                )}
              </Menu.Item>
              {/* <Menu.Item key={pages.preparation.respack}>
                {this.renderNavItem(
                  pages.preparation.respack,
                  '环境和资源包',
                  this.renderEnvRespackStatusIcon(),
                )}
              </Menu.Item> */}
            </Menu.ItemGroup>
            <Menu.ItemGroup key="group-1" title="配置编程环境">
              <Menu.Item key={pages.installer.gcc}>
                {this.renderNavItem(
                  pages.installer.gcc,
                  formatMessage({ id: 'env.gcc' }),
                  this.renderEnvStatusIcon(EnvComponentModule.c_cpp),
                )}
              </Menu.Item>
              <Menu.Item key={pages.installer.python}>
                {this.renderNavItem(
                  pages.installer.python,
                  formatMessage({ id: 'env.python' }),
                  this.renderEnvStatusIcon(EnvComponentModule.python),
                )}
              </Menu.Item>
              {/* <Menu.Item key={pages.installer.cpplint}>
                {this.renderNavItem(
                  pages.installer.cpplint,
                  formatMessage({ id: 'env.cpplint' }),
                  this.renderEnvStatusIcon('cpplint'),
                )}
              </Menu.Item> */}
              <Menu.Item key={pages.installer.vscode}>
                {this.renderNavItem(
                  pages.installer.vscode,
                  formatMessage({ id: 'env.vscode' }),
                  this.renderEnvStatusIcon(EnvComponentModule.vscode),
                )}
              </Menu.Item>
              {/* <Menu.Item key={pages.installer.vsix}>
                {this.renderNavItem(
                  pages.installer.vsix,
                  formatMessage({ id: 'env.vsix' }),
                  this.renderVsixStatusIcon(),
                )}
              </Menu.Item> */}
              <Menu.Item key={pages.installer.ext}>
                {this.renderNavItem(
                  pages.installer.ext,
                  formatMessage({ id: 'env.ext' }),
                  this.renderEnvStatusIcon(EnvComponentModule.extensions),
                )}
              </Menu.Item>
              <Menu.Item key={pages.installer.magic}>
                {this.renderNavItem(
                  pages.installer.magic,
                  formatMessage({ id: 'env.finaleMagic' }),
                  this.renderEnvStatusIcon(EnvComponentModule.magic),
                )}
              </Menu.Item>
            </Menu.ItemGroup>
            <Menu.ItemGroup key="group-2" title="开始使用">
              <Menu.Item key={pages.board}>{this.renderNavItem(pages.board, '功能盘')}</Menu.Item>
            </Menu.ItemGroup>
          </Menu>
        </Layout.Sider>
        <Layout
          style={{
            marginLeft: 200,
            ...(sm.platform.isMac && {
              paddingTop: '28px', // 补偿隐藏的标题栏高度
            }),
          }}
        >
          <Layout.Content>{props.children}</Layout.Content>
        </Layout>
      </Layout>
    );
  }
}

function mapStateToProps(state: IState) {
  return {
    environments: state.env.environments,
    hasRespack: state.respack.hasRespack,
    moduleConfigStatus: state.env.moduleConfigStatus,
    loadings: {
      getEnvironments: !!state.loading.effects['env/getEnvironments'],
      gcc: !!state.loading.effects['env/installGcc'],
      python: !!state.loading.effects['env/installPython'],
      cpplint: !!state.loading.effects['env/installCpplint'],
      vscode: !!state.loading.effects['env/installVSCode'],
      vsix: !!state.loading.effects['env/installVsix'],
      getHasRespack: !!state.loading.effects['respack/getHasRespack'],
    },
  };
}

export default connect(mapStateToProps)(RootLayout);
