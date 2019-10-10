import React from 'react';
import { Layout, Menu, Icon } from 'antd';

const BasicLayout: React.FC = props => {
  return (
    <Layout>
      <Layout.Sider
        theme="light"
        className="sidebar"
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
          <Menu.Item key="1">
            <span>准备</span>
          </Menu.Item>
          <Menu.Item key="2">
            <span>安装语言环境</span>
          </Menu.Item>
          <Menu.Item key="3">
            <span>安装开发环境</span>
          </Menu.Item>
          <Menu.Item key="4">
            <span>配置开发环境</span>
          </Menu.Item>
          <Menu.Item key="5">
            <span>开始使用</span>
          </Menu.Item>
        </Menu>
      </Layout.Sider>
      <Layout style={{ marginLeft: 200 }}>
        <Layout.Header style={{ background: '#fff', padding: 0 }} />
        <Layout.Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
          {props.children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
};

export default BasicLayout;
