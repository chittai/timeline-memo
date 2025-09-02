import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../Header';
import { AppProvider } from '../../context/AppContext';

// react-markdownのモック
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// usePosts フックのモック
const mockUsePosts = {
  createPost: jest.fn(),
  isLoading: false,
  posts: [],
  selectedPostId: null,
  error: null,
  loadPosts: jest.fn(),
  updatePost: jest.fn(),
  deletePost: jest.fn(),
  selectPost: jest.fn(),
  clearError: jest.fn(),
  getPost: jest.fn(),
  getPostsByDateRange: jest.fn()
};

jest.mock('../../hooks/usePosts', () => ({
  usePosts: () => mockUsePosts
}));

// テスト用のラッパーコンポーネント
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>{children}</AppProvider>
);

/**
 * Headerコンポーネントのテスト
 * 要件4.1の実装確認
 */
describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('アプリタイトルが表示される', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    // メインタイトルが表示されることを確認
    expect(screen.getByText('Timeline Memo')).toBeInTheDocument();
    
    // サブタイトルが表示されることを確認
    expect(screen.getByText('気軽にメモや感情を記録できるタイムラインアプリ')).toBeInTheDocument();
  });

  test('新規投稿ボタンが表示される', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    // 新規投稿ボタンが表示されることを確認
    expect(screen.getByText('新規投稿')).toBeInTheDocument();
  });

  test('新規投稿ボタンをクリックすると投稿フォームが表示される', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    const newPostButton = screen.getByText('新規投稿');
    fireEvent.click(newPostButton);
    
    expect(screen.getByPlaceholderText(/ここにメモや感情を記録してください/)).toBeInTheDocument();
    expect(screen.getByText('投稿を閉じる')).toBeInTheDocument();
  });

  test('投稿を閉じるボタンをクリックすると投稿フォームが非表示になる', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    // フォームを開く
    const newPostButton = screen.getByText('新規投稿');
    fireEvent.click(newPostButton);
    
    // フォームを閉じる
    const closeButton = screen.getByText('投稿を閉じる');
    fireEvent.click(closeButton);
    
    expect(screen.queryByPlaceholderText(/ここにメモや感情を記録してください/)).not.toBeInTheDocument();
    expect(screen.getByText('新規投稿')).toBeInTheDocument();
  });

  test('投稿成功後にフォームが自動的に閉じられる', async () => {
    mockUsePosts.createPost.mockResolvedValue({
      id: 'test-id',
      content: 'テストコンテンツ',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    // フォームを開く
    const newPostButton = screen.getByText('新規投稿');
    fireEvent.click(newPostButton);
    
    // 投稿を作成
    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    fireEvent.change(textarea, { target: { value: 'テストコンテンツ' } });
    
    const submitButton = screen.getByText('投稿する');
    fireEvent.click(submitButton);
    
    // フォームが閉じられることを確認
    await waitFor(() => {
      expect(screen.getByText('新規投稿')).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/ここにメモや感情を記録してください/)).not.toBeInTheDocument();
    });
  });

  test('適切なセマンティックHTMLが使用されている', () => {
    const { container } = render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );
    
    // header要素が使用されていることを確認
    const headerElement = container.querySelector('header');
    expect(headerElement).toBeInTheDocument();
    
    // h1要素が使用されていることを確認
    const h1Element = container.querySelector('h1');
    expect(h1Element).toBeInTheDocument();
    expect(h1Element).toHaveTextContent('Timeline Memo');
  });
});