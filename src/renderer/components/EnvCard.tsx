import React from 'react';
import { Card } from 'antd';
import classnames from 'classnames';

export interface IEnvCardProps {
  name: string;
  icon: any;
  installed: boolean;
  version?: string;
}

const EnvCard: React.FC<IEnvCardProps> = ({ name, icon, installed, version }) => (
  <Card className="env-card">
    <img className="icon" src={icon} />
    <div className="info">
      <p className="name">{name}</p>
      <p className={classnames('desc --text-ellipsis', {
        'color-green': installed,
      })}>{installed ? `已安装${version ? `：${version}` : ''}` : '未安装'}</p>
    </div>
  </Card>
);

export default EnvCard;
