import React from 'react';

export default function GlitchText({ text, tag: Tag = 'h1', className = '' }) {
  return (
    <Tag className={`glitch-text ${className}`} data-text={text}>
      {text}
    </Tag>
  );
}
