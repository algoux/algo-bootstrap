import React from 'react';
import { shell } from 'electron';

export interface IExternalLinkProps {
  href: string;
  className?: string;
  style?: React.CSSProperties;
}

const ExternalLink: React.FC<IExternalLinkProps> = ({ href, className, style, children }) => (
  <a
    className={className}
    style={style}
    onClick={() => shell.openExternal(href)}
  >{children}</a>
);

export default ExternalLink;
