// import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostPreview from '../PostPreview';
import type { Post } from '../../types';

// テスト用のモックデータ
const mockPost1: Post = {
  id: '1',
  content: 'これは短いテスト投稿です。',
  createdAt: new Date('2024-01-01T10:30:00'),
  updatedAt: new Date('2024-01-01T10:30:00')
};

const mockPost2: Post = {
  id: '2',
  content: '# これは長いテスト投稿です\n\n**太字**や*イタリック*、`コード`、[リンク](https://example.com)などのMarkdown記法を含む非常に長いコンテンツで、100文字を超える内容になっています。この部分は省略されるはずです。追加のテキストを入れて確実に100文字を超えるようにします。さらに長くしてテストを確実にします。',
  createdAt: new Date('2024-01-01T10:35:00'),
  updatedAt: new Date('2024-01-01T10:35:00')
};

const mockPost3: Post = {
  id: '3',
  content: '3番目の投稿です。',
  createdAt: new Date('2024-01-01T10:40:00'),
  updatedAt: new Date('2024-01-01T10:40:00')
};

const mockPost4: Post = {
  id: '4',
  content: '4番目の投稿です。',
  createdAt: new Date('2024-01-01T10:45:00'),
  updatedAt: new Date('2024-01-01T10:45:00')
};

describe('PostPreview', () => {
  const defaultProps = {
    posts: [mockPost1],
    position: { x: 100, y: 100 },
    isVisible: true
  };

  it('非表示の場合は何もレンダリングしない', () => {
    const { container } = render(
      <PostPreview {...defaultProps} isVisible={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('投稿が空の場合は何もレンダリングしない', () => {
    const { container } = render(
      <PostPreview {...defaultProps} posts={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('単一投稿のプレビューを正しく表示する', () => {
    render(<PostPreview {...defaultProps} />);
    
    // 時刻が表示されることを確認
    expect(screen.getByText('10:30')).toBeInTheDocument();
    
    // コンテンツが表示されることを確認
    expect(screen.getByText('これは短いテスト投稿です。')).toBeInTheDocument();
    
    // 複数投稿のヘッダーが表示されないことを確認
    expect(screen.queryByText(/件の投稿/)).not.toBeInTheDocument();
  });

  it('複数投稿のプレビューを正しく表示する', () => {
    render(
      <PostPreview 
        {...defaultProps} 
        posts={[mockPost1, mockPost2, mockPost3]} 
      />
    );
    
    // 複数投稿のヘッダーが表示されることを確認
    expect(screen.getByText('3件の投稿')).toBeInTheDocument();
    
    // 各投稿の時刻が表示されることを確認
    expect(screen.getByText('10:30')).toBeInTheDocument();
    expect(screen.getByText('10:35')).toBeInTheDocument();
    expect(screen.getByText('10:40')).toBeInTheDocument();
  });

  it('長いコンテンツを100文字で制限する', () => {
    render(<PostPreview {...defaultProps} posts={[mockPost2]} />);
    
    // 省略記号が表示されることを確認
    const previewElement = screen.getByText(/これは長いテスト投稿です/);
    expect(previewElement.textContent).toMatch(/\.\.\.$/);
    
    // Markdown記法が除去されることを確認
    expect(previewElement.textContent).not.toContain('#');
    expect(previewElement.textContent).not.toContain('**');
    expect(previewElement.textContent).not.toContain('*');
    expect(previewElement.textContent).not.toContain('`');
    expect(previewElement.textContent).not.toContain('[');
  });

  it('4件以上の投稿がある場合は3件まで表示し省略表示する', () => {
    render(
      <PostPreview 
        {...defaultProps} 
        posts={[mockPost1, mockPost2, mockPost3, mockPost4]} 
      />
    );
    
    // 4件のヘッダーが表示されることを確認
    expect(screen.getByText('4件の投稿')).toBeInTheDocument();
    
    // 最初の3件の時刻が表示されることを確認
    expect(screen.getByText('10:30')).toBeInTheDocument();
    expect(screen.getByText('10:35')).toBeInTheDocument();
    expect(screen.getByText('10:40')).toBeInTheDocument();
    
    // 4件目の時刻は表示されないことを確認
    expect(screen.queryByText('10:45')).not.toBeInTheDocument();
    
    // 省略表示が表示されることを確認
    expect(screen.getByText('他 1 件...')).toBeInTheDocument();
  });

  it('正しい位置にツールチップを配置する', () => {
    const { container } = render(
      <PostPreview {...defaultProps} position={{ x: 200, y: 150 }} />
    );
    
    const tooltip = container.querySelector('.fixed');
    expect(tooltip).toHaveStyle({
      left: '200px',
      top: '150px',
      transform: 'translate(-50%, -100%)'
    });
  });

  it('ツールチップにpointer-events-noneが設定されている', () => {
    const { container } = render(<PostPreview {...defaultProps} />);
    
    const tooltip = container.querySelector('.fixed');
    expect(tooltip).toHaveClass('pointer-events-none');
  });
});