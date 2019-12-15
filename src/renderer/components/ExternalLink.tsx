import React from 'react';
import { shell } from 'electron';
import sm from '@/utils/modules';

export interface IExternalLinkProps {
  href: string;
  className?: string;
  style?: React.CSSProperties;
}

const ExternalLink: React.FC<IExternalLinkProps> = ({ href, className, style, children }) => (
  <a
    className={className}
    style={style}
    onClick={() => {
      sm.track.event('use', 'extLink', href);
      shell.openExternal(href);
    }}
  >{children}</a>
);

export default ExternalLink;
