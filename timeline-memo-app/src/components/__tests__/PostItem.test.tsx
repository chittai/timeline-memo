import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostItem from '../PostItem';
import type { Post } from '../../types';

// react-markdownをモック
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// テスト用のモックデータ
const mockPost: Post = {
  id: 'test-post-1',
  content: '# テスト投稿\n\nこれは**テスト**投稿です。\n\n- リスト項目1\n- リスト項目2',
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z'),
  tags: ['test']
};

const mockUpdatedPost: Post = {
  ...mockPost,
  id: 'test-post-2',
  updatedAt: new Date('2024-01-15T11:00:00Z')
};

describe('PostItem', () => {
  const mockOnSelect = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本表示', () => {
    it('投稿内容が正しく表示される', () => {
      render(
        <PostItem
          post={mockPost}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // Markdownコンテンツが表示されていることを確認
      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toBeInTheDocument();
      expect(markdownContent).toHaveTextContent('# テスト投稿 これは**テスト**投稿です。 - リスト項目1 - リスト項目2');
    });

    it('投稿日時が正しく表示される', () => {
      render(
        <PostItem
          post={mockPost}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      // 日時表示を確認（ロケールに依存するため部分的にチェック）
      const timeElement = screen.getByRole('time');
      expect(timeElement).toBeInTheDocument();
      expect(timeElement).toHaveAttribute('dateTime', '2024-01-15T10:30:00.000Z');
    });

    it('更新日時が作成日時と異なる場合に表示される', () => {
      render(
        <PostItem
          post={mockUpdatedPost}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByText(/更新:/)).toBeInTheDocument();
    });

    it('更新日時が作成日時と同じ場合は表示されない', () => {
      render(
        <PostItem
          post={mockPost}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByText(/更新:/)).not.toBeInTheDocument();
    });
  });

  describe('選択状態', () => {
    it('選択されていない場合の表示', () => {
      render(
        <PostItem
          post={mockPost}
          isSelected={false}
          onSelect={mockOnSelect}
        />
      );

      const article = screen.getByRole('button');
      expect(article).not.toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50');
    });

    it('選択されている場合の表示', () => {
      render(
        <PostItem
          post={mockPost}
          isSelected={true}
          onSelect={mockOnSelect}
        />
      );

      const article = screen.getByRole('button');
      expect(article).toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50');
    });
  });

  describe('インタラクション', () => {
    it('クリック時にonSelectが呼ばれる', () => {
      render(
        <PostItem
          post={mockPost}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.click(screen.getByRole('button'));
      expect(mockOnSelect).toHaveBeenCalledWith('test-post-1');
    });

    it('Enterキー押下時にonSelectが呼ばれる', () => {
      render(
        <PostItem
          post={mockPost}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
      expect(mockOnSelect).toHaveBeenCalledWith('test-post-1');
    });

    it('スペースキー押下時にonSelectが呼ばれる', () => {
      render(
        <PostItem
          post={mockPost}
          onSelect={mockOnSelect}
        />
      );

      fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
      expect(mockOnSelect).toHaveBeenCalledWith('test-post-1');
    });

    it('編集ボタンクリック時にonEditが呼ばれる', () => {
      render(
        <PostItem
          post={mockPost}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByLabelText('投稿を編集');
      fireEvent.click(editButton);
      expect(mockOnEdit).toHaveBeenCalledWith(mockPost);
      expect(mockOnSelect).not.toHaveBeenCalled(); // 親のクリックイベントが発火しないことを確認
    });

    it('削除ボタンクリック時にonDeleteが呼ばれる', () => {
      render(
        <PostItem
          post={mockPost}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
        />
      );

      const deleteButton = screen.getByLabelText('投稿を削除');
      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledWith('test-post-1');
      expect(mockOnSelect).not.toHaveBeenCalled(); // 親のクリックイベントが発火しないことを確認
    });
  });

  describe('アクションボタンの表示制御', () => {
    it('onEditが提供されない場合、編集ボタンが表示されない', () => {
      render(
        <PostItem
          post={mockPost}
          onSelect={mockOnSelect}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.queryByLabelText('投稿を編集')).not.toBeInTheDocument();
    });

    it('onDeleteが提供されない場合、削除ボタンが表示されない', () => {
      render(
        <PostItem
          post={mockPost}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByLabelText('投稿を削除')).not.toBeInTheDocument();
    });

    it('両方のハンドラーが提供される場合、両方のボタンが表示される', () => {
      render(
        <PostItem
          post={mockPost}
          onSelect={mockOnSelect}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );

      expect(screen.getByLabelText('投稿を編集')).toBeInTheDocument();
      expect(screen.getByLabelText('投稿を削除')).toBeInTheDocument();
    });
  });

  describe('Markdownレンダリング', () => {
    it('Markdownコンテンツが正しく渡される', () => {
      const postWithMarkdown: Post = {
        ...mockPost,
        content: '# タイトル\n\n**太字**テキスト'
      };

      render(
        <PostItem
          post={postWithMarkdown}
          onSelect={mockOnSelect}
        />
      );

      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toHaveTextContent('# タイトル **太字**テキスト');
    });
  });
});