import React from 'react';
import { Spin, Icon } from 'antd';
import { SpinProps } from 'antd/lib/spin';

const Loading: React.FC<SpinProps> = (props: SpinProps) => {
  const antIcon = <Icon type="loading" className="--mr-none" />;
  return <Spin indicator={antIcon} {...props} />;
};

export default Loading;
