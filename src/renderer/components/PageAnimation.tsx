import React from 'react';

const PageAnimation: React.FC<{ style?: React.CSSProperties }> = ({ children, style }) => (
  <div className="--slide-left" style={style}>{children}</div>
);

export default PageAnimation;
