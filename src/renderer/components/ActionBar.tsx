import React from 'react';
import { Spin, Icon, Button } from 'antd';
import classnames from 'classnames';

export interface IActionBarProps {
  info?: React.ReactNode;
  actions: Array<{
    key: string;
    type: 'default' | 'dashed' | 'primary' | 'ghost' | 'danger';
    text: string;
    disabled?: boolean;
    loading?: boolean;
    loadingText?: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler;
  }>;
  delay?: 500 | 1000 | 2000;
}

const ActionBar: React.FC<IActionBarProps> = (props) => {
  return (
    <div
      className={classnames('action-bar', {
        '--p-slide-up': !props.delay,
        [`--p-slide-up-delay-${props.delay}`]: props.delay,
      })}
    >
      <div className="info">{props.info}</div>
      <div className="actions">
        {props.actions.map((action) => (
          <Button
            size="large"
            key={action.key}
            type={action.type}
            disabled={!!action.disabled}
            loading={!!action.loading}
            className={action.className}
            style={action.style}
            onClick={action.onClick}
          >
            {action.loading ? action.loadingText || action.text : action.text}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ActionBar;
