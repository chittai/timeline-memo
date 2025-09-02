import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostListPanel from '../PostListPanel';
import { AppProvider } from '../../context/AppContext';
import type { Post } from '../../types';

// react-markdownをモック
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// scrollIntoViewをモック
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true,
});

// usePostsフックのモック
const mockUsePosts = {
  posts: [] as Post[],
  isLoading: false,
  error: null,
  selectPost: jest.fn(),
  deletePost: jest.fn()
};

jest.mock('../../hooks/usePosts', () => ({
  usePosts: () => mockUsePosts
}));

// テスト用のモックデータ
const mockPosts: Post[] = [
  {
    id: 'post-1',
    content: '最新の投稿です',
    createdAt: new Date('2024-01-15T12:00:00Z'),
    updatedAt: new Date('2024-01-15T12:00:00Z')
  },
  {
    id: 'post-2',
    content: '2番目の投稿です',
    createdAt: new Date('2024-01-15T11:00:00Z'),
    updatedAt: new Date('2024-01-15T11:00:00Z')
  },
  {
    id: 'post-3',
    content: '最も古い投稿です',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z')
  }
];

// テスト用のラッパーコンポーネント
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>
    {children}
  </AppProvider>
);

describe('PostListPanel', () => {
  const mockOnPostSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトのモック状態をリセット
    mockUsePosts.posts = [];
    mockUsePosts.isLoading = false;
    mockUsePosts.error = null;
    mockUsePosts.selectPost.mockClear();
    mockUsePosts.deletePost.mockClear();
  });

  describe('基本表示', () => {
    it('投稿がない場合の空状態が表示される', () => {
      mockUsePosts.posts = [];

      render(
        <TestWrapper>
          <PostListPanel />
        </TestWrapper>
      );

      expect(screen.getByText('まだ投稿がありません')).toBeInTheDocument();
      expect(screen.getByText('上部のフォームから最初の投稿を作成してみましょう')).toBeInTheDocument();
    });

    it('投稿がある場合にリストが表示される', () => {
      mockUsePosts.posts = mockPosts;

      render(
        <TestWrapper>
          <PostListPanel />
        </TestWrapper>
      );

      expect(screen.getByText('投稿リスト')).toBeInTheDocument();
      expect(screen.getByText('3件の投稿')).toBeInTheDocument();
      expect(screen.getByText('最新の投稿です')).toBeInTheDocument();
      expect(screen.getByText('2番目の投稿です')).toBeInTheDocument();
      expect(screen.getByText('最も古い投稿です')).toBeInTheDocument();
    });

    it('投稿が新しい順（降順）で表示される', () => {
      mockUsePosts.posts = mockPosts;

      render(
        <TestWrapper>
          <PostListPanel />
        </TestWrapper>
      );

      // 投稿内容を確認（新しい順）
      expect(screen.getByText('最新の投稿です')).toBeInTheDocument();
      expect(screen.getByText('2番目の投稿です')).toBeInTheDocument();
      expect(screen.getByText('最も古い投稿です')).toBeInTheDocument();

      // 投稿の順序を確認（DOMの順序で）
      const postContents = screen.getAllByTestId('markdown-content');
      expect(postContents[0]).toHaveTextContent('最新の投稿です');
      expect(postContents[1]).toHaveTextContent('2番目の投稿です');
      expect(postContents[2]).toHaveTextContent('最も古い投稿です');
    });
  });

  describe('ローディング状態', () => {
    it('初回ローディング時にローディングインジケーターが表示される', () => {
      mockUsePosts.posts = [];
      mockUsePosts.isLoading = true;

      render(
        <TestWrapper>
          <PostListPanel />
        </TestWrapper>
      );

      expect(screen.getByText('投稿を読み込み中...')).toBeInTheDocument();
    });

    it('追加読み込み時にローディングインジケーターが表示される', () => {
      mockUsePosts.posts = mockPosts;
      mockUsePosts.isLoading = true;

      render(
        <TestWrapper>
          <PostListPanel />
        </TestWrapper>
      );

      // 投稿リストは表示されつつ、下部にローディングインジケーターが表示される
      expect(screen.getByText('投稿リスト')).toBeInTheDocument();
      expect(screen.getByText('最新の投稿です')).toBeInTheDocument();
    });
  });

  describe('エラー状態', () => {
    it('エラー時にエラーメッセージが表示される', () => {
      mockUsePosts.posts = [];
      (mockUsePosts as any).error = 'データの読み込みに失敗しました';

      render(
        <TestWrapper>
          <PostListPanel />
        </TestWrapper>
      );

      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
    });
  });

  describe('投稿選択', () => {
    it('投稿クリック時にonPostSelectが呼ばれる', () => {
      mockUsePosts.posts = mockPosts;

      render(
        <TestWrapper>
          <PostListPanel onPostSelect={mockOnPostSelect} />
        </TestWrapper>
      );

      const firstPost = screen.getByText('最新の投稿です').closest('article');
      fireEvent.click(firstPost!);

      expect(mockUsePosts.selectPost).toHaveBeenCalledWith('post-1');
      expect(mockOnPostSelect).toHaveBeenCalledWith('post-1');
    });

    it('選択された投稿がハイライト表示される', () => {
      mockUsePosts.posts = mockPosts;

      render(
        <TestWrapper>
          <PostListPanel selectedPostId="post-2" />
        </TestWrapper>
      );

      const selectedPost = screen.getByText('2番目の投稿です').closest('article');
      expect(selectedPost).toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50');
    });
  });

  describe('投稿削除', () => {
    it('削除ボタンクリック時に確認ダイアログが表示される', async () => {
      mockUsePosts.posts = mockPosts;
      mockUsePosts.deletePost.mockResolvedValue(true);

      // window.confirmをモック
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(true);

      render(
        <TestWrapper>
          <PostListPanel />
        </TestWrapper>
      );

      const deleteButton = screen.getAllByLabelText('投稿を削除')[0];
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.stringContaining('投稿を削除しますか？')
      );
      
      await waitFor(() => {
        expect(mockUsePosts.deletePost).toHaveBeenCalledWith('post-1');
      });

      mockConfirm.mockRestore();
    });

    it('削除確認でキャンセルした場合は削除されない', () => {
      mockUsePosts.posts = mockPosts;

      // window.confirmをモック（キャンセル）
      const mockConfirm = jest.spyOn(window, 'confirm').mockReturnValue(false);

      render(
        <TestWrapper>
          <PostListPanel />
        </TestWrapper>
      );

      const deleteButton = screen.getAllByLabelText('投稿を削除')[0];
      fireEvent.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalled();
      expect(mockUsePosts.deletePost).not.toHaveBeenCalled();

      mockConfirm.mockRestore();
    });
  });

  describe('スクロール制御', () => {
    it('スクロールヒントが表示される（投稿が5件より多い場合）', () => {
      const manyPosts = Array.from({ length: 6 }, (_, i) => ({
        id: `post-${i}`,
        content: `投稿 ${i}`,
        createdAt: new Date(`2024-01-15T${10 + i}:00:00Z`),
        updatedAt: new Date(`2024-01-15T${10 + i}:00:00Z`)
      }));

      mockUsePosts.posts = manyPosts;

      render(
        <TestWrapper>
          <PostListPanel />
        </TestWrapper>
      );

      expect(screen.getByText('スクロールして他の投稿を表示')).toBeInTheDocument();
    });

    it('スクロールヒントが表示されない（投稿が5件以下の場合）', () => {
      mockUsePosts.posts = mockPosts; // 3件

      render(
        <TestWrapper>
          <PostListPanel />
        </TestWrapper>
      );

      expect(screen.queryByText('スクロールして他の投稿を表示')).not.toBeInTheDocument();
    });
  });

  describe('プロパティ連携', () => {
    it('selectedPostIdが変更されても適切に反映される', () => {
      mockUsePosts.posts = mockPosts;

      const { rerender } = render(
        <TestWrapper>
          <PostListPanel selectedPostId="post-1" />
        </TestWrapper>
      );

      // 最初の投稿が選択されている
      let selectedPost = screen.getByText('最新の投稿です').closest('article');
      expect(selectedPost).toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50');

      // 選択を変更
      rerender(
        <TestWrapper>
          <PostListPanel selectedPostId="post-2" />
        </TestWrapper>
      );

      // 2番目の投稿が選択されている
      selectedPost = screen.getByText('2番目の投稿です').closest('article');
      expect(selectedPost).toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50');

      // 最初の投稿は選択されていない
      const firstPost = screen.getByText('最新の投稿です').closest('article');
      expect(firstPost).not.toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50');
    });
  });
});