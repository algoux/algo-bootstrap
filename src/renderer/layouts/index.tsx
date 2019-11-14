import React from 'react';
import { Layout, Menu, Icon } from 'antd';
import { DispatchProp } from 'react-redux';
import { connect } from '@/utils/dva';
import sm from '@/utils/modules';

interface IRootLayoutProps {
}

interface State {
}

type Props = IRootLayoutProps & ReturnType<typeof mapStateToProps> & DispatchProp<any>;

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
    const environments = props.environments;
    if (props.loadings.getEnvironments) {
      return this.renderStatusIcon('loading');
    }
    return this.renderStatusIcon('done');
    // return null;
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

    return <Layout>
      <Layout.Sider
        theme="light"
        className="sidebar --slide-right"
        style={{
          overflow: 'auto', height: '100vh', position: 'fixed', left: 0,
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
          defaultSelectedKeys={['1']}
          style={{ backgroundColor: 'transparent' }}
        >
          <Menu.ItemGroup key="group-0" title="准备">
            <Menu.Item key="check-environments">
              <span className="menu-sub-item-title">环境和资源包</span>
              {this.renderEnvRespackStatusIcon()}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.ItemGroup key="group-1" title="安装开发环境">
            <Menu.Item key="gcc">
              <span className="menu-sub-item-title">C/C++</span>
              {this.renderEnvStatusIcon('gcc')}
            </Menu.Item>
            <Menu.Item key="python">
              <span className="menu-sub-item-title">Python 支持</span>
              {this.renderEnvStatusIcon('python')}
            </Menu.Item>
            <Menu.Item key="cpplint">
              <span className="menu-sub-item-title">代码风格检查器</span>
              {this.renderEnvStatusIcon('cpplint')}
            </Menu.Item>
            <Menu.Item key="code">
              <span className="menu-sub-item-title">VS Code</span>
              {this.renderEnvStatusIcon('code')}
            </Menu.Item>
            <Menu.Item key="vsix">
              <span className="menu-sub-item-title">VS Code 扩展</span>
              {this.renderVsixStatusIcon()}
            </Menu.Item>
          </Menu.ItemGroup>
          <Menu.Item key="start">
            <span>开始使用</span>
          </Menu.Item>
        </Menu>
      </Layout.Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Layout.Content className="--slide-left" style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          {props.children}
        </Layout.Content>
      </Layout>
    </Layout>;
  }
}

function mapStateToProps(state: IState) {
  console.warn('layout state', {
    environments: state.env.environments,
    loadings: {
      getEnvironments: !!state.loading.effects['env/getEnvironments'],
      gcc: !!state.loading.effects['env/installGcc'],
      python: !!state.loading.effects['env/installGcc'],
      cpplint: !!state.loading.effects['env/installGcc'],
      code: !!state.loading.effects['env/installGcc'],
      vsix: !!state.loading.effects['env/installVsix'],
    },
  })
  return {
    environments: state.env.environments,
    loadings: {
      getEnvironments: !!state.loading.effects['env/getEnvironments'],
      gcc: !!state.loading.effects['env/installGcc'],
      python: !!state.loading.effects['env/installPython'],
      cpplint: !!state.loading.effects['env/installCpplint'],
      code: !!state.loading.effects['env/installVSCode'],
      vsix: !!state.loading.effects['env/installVsix'],
    },
  };
}

export default connect(mapStateToProps)(RootLayout);
