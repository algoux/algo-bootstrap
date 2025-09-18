import { Icon } from 'antd';
import React from 'react';

export interface IEnvLabelProps {
  name: string;
  icon: any;
  version?: string;
}

const EnvLabel: React.FC<IEnvLabelProps> = ({ name, icon, version }) => {
  return (
    <div className="env-label">
      <img className="env-label-icon" src={icon} />
      <div className="env-label-info">
        <span className="env-label-name">{name}</span>
        <span className="env-label-version">
          {version}
          <Icon className="--ml-sm-md" type="check-circle" theme="twoTone" twoToneColor="#4fb24f" />
        </span>
      </div>
    </div>
  );
};

export default EnvLabel;
