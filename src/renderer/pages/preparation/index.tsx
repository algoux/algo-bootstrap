import React from 'react';
import router from 'umi/router';
import pages from '@/configs/pages';
import { formatMessage } from 'umi-plugin-locale';
import ActionBar from '@/components/ActionBar';

export interface IPreparationProps {
}

interface State {
}

type Props = IPreparationProps;

class Preparation extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  render() {
    return <div>
      <div className="container --text-center --slide-left">
        <h1 style={{ marginTop: '150px' }}>欢迎使用 {formatMessage({ id: 'app.name' })}</h1>
        {/* TODO 允许自定义向导名称，影响 renderer 和 sudo prompt */}
        <p style={{ marginTop: '30px' }}>接下来，<span>向导</span>将指引你完成安装和配置。</p>
      </div>
      <ActionBar actions={[
        {
          key: 'start',
          type: 'primary',
          text: '开始',
          onClick: () => {
            router.push(pages.preparation.respack);
          },
        },
      ]} />
    </div>;
  }
}

export default Preparation;
