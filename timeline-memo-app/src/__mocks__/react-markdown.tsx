import React from 'react';

// ReactMarkdownのモック実装
const ReactMarkdown: React.FC<{ children: string; components?: any }> = ({ 
  children 
}) => {
  return (
    <div data-testid="markdown-content">
      {children}
    </div>
  );
};

export default ReactMarkdown;