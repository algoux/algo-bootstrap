import React from 'react';
import { Card, Dropdown, Icon, Menu, Popover, Tag } from 'antd';
import classnames from 'classnames';
import { EnvComponentAction, IEnvComponentUIOption } from '@/typings/env';

export interface IEnvCardProps {
  name: string;
  icon: any;
  installed: boolean | 'partial';
  tips?: string | React.ReactNode;
  version?: string;
  latestVersion?: string;
  updateAvailable?: boolean;
  optional?: boolean;
  options?: IEnvComponentUIOption[];
  selectedOption?: string;
  onOptionChange?: (selectedOption: string) => void | Promise<void>;
}

const EnvCard: React.FC<IEnvCardProps> = ({
  name,
  icon,
  installed,
  tips,
  version,
  latestVersion,
  updateAvailable,
  optional = false,
  options = [],
  selectedOption,
  onOptionChange,
}) => {
  const formatActionSummary = () => {
    const selectedOptionItem = options.find((option) => option.value === selectedOption);
    if (!selectedOptionItem) {
      return '';
    }
    switch (selectedOptionItem.type) {
      case EnvComponentAction.DISABLE:
        return '已略过';
      case EnvComponentAction.SKIP:
        return updateAvailable ? '无需配置，有更新可供选择' : '无需配置';
      case EnvComponentAction.INSTALL:
        return `将配置${latestVersion ? `：${latestVersion}` : ''}`;
      case EnvComponentAction.UPDATE:
        return `将配置${latestVersion ? `：${latestVersion}` : ''}`;
      case EnvComponentAction.REINSTALL:
        return `将配置${latestVersion ? `：${latestVersion}` : ''}`;
      case EnvComponentAction.SWITCH_INSTALLED:
        return `将配置${selectedOptionItem.meta?.desc ? `：${selectedOptionItem.meta?.desc}` : selectedOptionItem.meta?.version ? `：${selectedOptionItem.meta?.version}` : ''}`;
      default:
        return '';
    }
  };

  const menu = (
    <Menu
      selectedKeys={selectedOption ? [selectedOption] : []}
      onClick={(e) => onOptionChange?.(e.key)}
    >
      {options.map((option, index) => (
        <Menu.Item key={option.value}>{option.label}</Menu.Item>
      ))}
    </Menu>
  );

  const versionText = version ? <span title={version}>{version}</span> : null;

  return (
    <Card className="env-card">
      {optional && (
        <Tag
          color="blue"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            margin: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: '1px',
            borderBottomRightRadius: 0,
            fontSize: '11px',
            padding: '0 4px',
            cursor: 'default',
            pointerEvents: 'none',
          }}
        >
          可选
        </Tag>
      )}
      <div
        className="env-card-content"
        style={{ opacity: selectedOption === EnvComponentAction.DISABLE ? 0.5 : 1 }}
      >
        <img className="icon" src={icon} />
        <div className="info">
          <p className="name" style={{ display: 'flex' }}>
            {name}
            {tips && (
              <Popover placement="bottom" content={<div className="env-card-tips">{tips}</div>}>
                <a className="--ml-sm-md" style={{ fontSize: '12px' }}>
                  <Icon type="info-circle" />
                </a>
              </Popover>
            )}
          </p>
          <p
            className={classnames('desc --text-ellipsis', {
              'color-green': installed === true,
            })}
          >
            {!installed ? '未安装' : installed === true ? '已安装' : '部分安装'}
            {version ? '：' : ''}
            {versionText}
          </p>
        </div>
      </div>
      <div className="env-card-action">
        <span className="summary --text-ellipsis">{formatActionSummary()}</span>
        {options.length > 1 ? (
          <Dropdown overlay={menu} trigger={['click']}>
            <a className="action">
              <Icon type="setting" />
            </a>
          </Dropdown>
        ) : (
          <a className="action --visibility-hidden">
            <Icon type="setting" />
          </a>
        )}
      </div>
    </Card>
  );
};

export default EnvCard;
