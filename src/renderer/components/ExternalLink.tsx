import React from 'react';
import { shell } from 'electron';
import track from '@/utils/track';

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
      track.event('use', 'extLink', href);
      shell.openExternal(href);
    }}
  >
    {children}
  </a>
);

export default ExternalLink;
