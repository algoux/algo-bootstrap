import React from 'react';
import { connect } from '@/utils/dva';
import { DispatchProp } from 'react-redux';
import router from 'umi/router';
import pages from '@/configs/pages';
import { Row, Col } from 'antd';
import ActionBar from '@/components/ActionBar';
import ExternalLink from '@/components/ExternalLink';
import sm from '@/utils/modules';
import ccppIcon from '@/assets/icons/ccpp.png';
import pythonIcon from '@/assets/icons/python.svg';
import cpplintIcon from '@/assets/icons/lint.svg';
import vscodeIcon from '@/assets/icons/vscode.svg';
import vscodeExtensionIcon from '@/assets/icons/vscode-extension.svg';
import EnvCard from '@/components/EnvCard';
import { isVsixAllInstalled } from '@/utils/env';
import { remote } from 'electron';
import { logRenderer } from 'common/utils/logger';
import msg from '@/utils/msg';
import constants from 'common/configs/constants';

export interface IEnvAndRespackProps {
}

interface State {
}

type Props = IEnvAndRespackProps & ReturnType<typeof mapStateToProps> & DispatchProp<any>;

class EnvAndRespack extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  openRespack = async () => {
    const res = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties: ['openFile'],
      filters: [
        { name: `${constants.appName} 资源包`, extensions: ['respack'] },
      ],
    });
    const respackPath = res.filePaths ? res.filePaths[0] : '';
    if (respackPath) {
      logRenderer.info(`[openRespack]`, respackPath);
      const respack = new sm.Respack(respackPath);
      try {
        await this.props.dispatch!({
          type: 'respack/importRespack',
          payload: {
            respackPath,
          },
        });
      } catch (e) {
        logRenderer.error(`[openRespack] load and validate failed:`, e);
        msg.error(e.msg);
        return;
      }
      msg.success('资源包导入完成', '点击「开始安装」完成后续步骤。');
    }
  }

  render() {
    const { environments, hasRespack, manifest, loading } = this.props;
    const colProps = {
      className: '--mt-sm --mb-sm',
      md: 12,
      xl: 6,
    };
    return <div>
      <div className="container --slide-left">
        <div className="content-block">
          <h1 className="top-title">环境</h1>
          <Row gutter={8}>
            <Col {...colProps}>
              <EnvCard
                name="C/C++"
                icon={ccppIcon}
                installed={environments.gcc.installed}
                version={(environments.gcc as ICheckEnvironmentResultInstalled).version}
              />
            </Col>
            <Col {...colProps}>
              <EnvCard
                name="Python 支持"
                icon={pythonIcon}
                installed={environments.python.installed}
                version={(environments.python as ICheckEnvironmentResultInstalled).version}
              />
            </Col>
            <Col {...colProps}>
              <EnvCard
                name="代码风格检查器"
                icon={cpplintIcon}
                installed={environments.cpplint.installed}
                version={'cpplint ' + (environments.cpplint as ICheckEnvironmentResultInstalled).version}
              />
            </Col>
            <Col {...colProps}>
              <EnvCard
                name="VS Code"
                icon={vscodeIcon}
                installed={environments.code.installed}
                version={(environments.code as ICheckEnvironmentResultInstalled).version}
              />
            </Col>
            <Col {...colProps}>
              <EnvCard
                name="VS Code 扩展"
                icon={vscodeExtensionIcon}
                installed={isVsixAllInstalled(environments)}
              />
            </Col>
          </Row>
        </div>

        <div className="content-block">
          <h1 className="top-title">资源包</h1>
          <p>资源包囊括了所有必要的安装文件。</p>
          {!hasRespack ?
            <>
              <p>安装缺失的环境前，你必须导入一个资源包，这样向导才能智慧配置你的 {sm.platform.isMac ? 'Mac' : 'PC'}。</p>
              <p>如果没有已存在的资源包，请前往 <ExternalLink href="https://acm.sdut.edu.cn">下载资源包</ExternalLink>。</p>
            </> :
            <>
              <p>如果要重新下载最新的资源包，请前往 <ExternalLink href="https://acm.sdut.edu.cn">下载资源包</ExternalLink>。</p>
              <p>现在，向导准备好智慧配置你的 {sm.platform.isMac ? 'Mac' : 'PC'}。</p>
            </>}

        </div>
      </div>
      <ActionBar
        info={hasRespack && manifest ? <p>已导入资源包：版本 {manifest.version}</p> : null}
        actions={!hasRespack ?
          [
            {
              key: 'chooseRespack',
              type: 'primary',
              text: '导入资源包',
              loading,
              onClick: this.openRespack,
            },
          ] :
          [
            {
              key: 'reChooseRespack',
              type: 'ghost',
              text: '重新导入资源包',
              loading,
              onClick: this.openRespack,
            },
            {
              key: 'startInstall',
              type: 'primary',
              text: '开始安装',
              disabled: loading,
            },
          ]
        }
        delay={1000}
      />
    </div>;
  }
}

function mapStateToProps(state: IState) {
  return {
    environments: state.env.environments,
    hasRespack: state.respack.hasRespack,
    manifest: state.respack.manifest,
    loading: !!state.loading.effects['respack/importRespack'],
  };
}

export default connect(mapStateToProps)(EnvAndRespack);
