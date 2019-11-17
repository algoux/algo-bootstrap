import React from 'react';
import { Spin, Icon, Button } from 'antd';

export interface IActionBarProps {
  info?: React.ReactNode;
  actions: Array<{
    key: string;
    type: 'default' | 'dashed' | 'primary' | 'ghost' | 'danger';
    text: string;
    className?: string;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler;
  }>;
}

const ActionBar: React.FC<IActionBarProps> = (props) => {
  return <div className="action-bar --p-slide-up">
    <div className="info">
      {props.info}
    </div>
    <div className="actions">
      {props.actions.map(action => <Button
        size="large"
        key={action.key}
        type={action.type}
        className={action.className}
        style={action.style}
        onClick={action.onClick}
      >{action.text}</Button>)}
    </div>
  </div>;
};

export default ActionBar;
