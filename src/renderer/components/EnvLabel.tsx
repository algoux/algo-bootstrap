import { Icon, Popover } from 'antd';
import React from 'react';

export interface IEnvLabelProps {
  name: string;
  icon: any;
  installed: boolean;
  version?: string;
}

const EnvLabel: React.FC<IEnvLabelProps> = ({ name, icon, installed, version }) => {
  return (
    <div className="env-label">
      <img className="env-label-icon" src={icon} />
      <div className="env-label-info">
        <span className="env-label-name">{name}</span>
        {installed ? (
          <span className="env-label-version">
            {version}
            <Icon
              className="--ml-sm-md"
              type="check-circle"
              theme="twoTone"
              twoToneColor="#4fb24f"
            />
          </span>
        ) : (
          <span className="env-label-version">
            <Popover
              placement="bottom"
              content={<div className="env-card-tips">未检测到此环境，可尝试重装</div>}
            >
              未安装
              <Icon
                className="--ml-sm-md"
                type="exclamation-circle"
                theme="twoTone"
                twoToneColor="#faad14"
              />
            </Popover>
          </span>
        )}
      </div>
    </div>
  );
};

export default EnvLabel;
