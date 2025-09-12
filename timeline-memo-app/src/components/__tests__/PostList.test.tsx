import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PostList } from '../PostList';
import type { Post } from '../../types';
import { 
  renderWithProviders, 
  waitForElementToBeVisible, 
  assertElementExists,
  findByTextAndAssertVisible,
  assertElementNotExists
} from '../../test/helpers/renderHelpers';
import { 
  createMockPost, 
  createMockPosts 
} from '../../test/fixtures/testData';

// モックデータ
const mockPosts: Post[] = [
  createMockPost({
    id: '1',
    content: '今日は良い天気でした',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:00:00Z'),
  }),
  createMockPost({
    id: '2',
    content: '新しいプロジェクトを開始しました',
    createdAt: new Date('2024-01-14T15:30:00Z'),
    updatedAt: new Date('2024-01-14T15:30:00Z'),
  })
];

describe('PostList', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('表示確認テスト', () => {
    it('投稿データが正しく表示されることを確認する', async () => {
      const { container } = render(
        <PostList 
          posts={mockPosts} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );
      
      // 投稿リストコンテナが存在することを確認
      const listContainer = assertElementExists(container, '.space-y-4');
      await waitForElementToBeVisible(listContainer);
      
      // 各投稿の内容が表示されていることを確認
      const firstPost = await findByTextAndAssertVisible('今日は良い天気でした');
      const secondPost = await findByTextAndAssertVisible('新しいプロジェクトを開始しました');
      
      expect(firstPost).toBeInTheDocument();
      expect(secondPost).toBeInTheDocument();
      
      // 投稿記事要素が正しく表示されていることを確認
      const articles = container.querySelectorAll('article');
      expect(articles).toHaveLength(2);
      
      // 各記事が実際に表示されていることを確認
      for (const article of articles) {
        await waitForElementToBeVisible(article as HTMLElement);
      }
    });

    it('投稿の日時が正しく表示されることを確認する', async () => {
      const { container } = render(
        <PostList 
          posts={mockPosts} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );
      
      // time要素が存在し表示されていることを確認
      const timeElements = container.querySelectorAll('time');
      expect(timeElements).toHaveLength(2);
      
      for (const timeElement of timeElements) {
        await waitForElementToBeVisible(timeElement as HTMLElement);
        // 日時フォーマットが含まれていることを確認
        expect(timeElement.textContent).toMatch(/2024/);
      }
    });

    it('編集・削除ボタンが正しく表示されることを確認する', async () => {
      const { container } = render(
        <PostList 
          posts={mockPosts} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );
      
      // 編集ボタンが表示されていることを確認
      const editButtons = container.querySelectorAll('button[title="編集"]');
      expect(editButtons).toHaveLength(2);
      
      // 削除ボタンが表示されていることを確認
      const deleteButtons = container.querySelectorAll('button[title="削除"]');
      expect(deleteButtons).toHaveLength(2);
      
      // 各ボタンが実際に表示されていることを確認
      for (const button of [...editButtons, ...deleteButtons]) {
        await waitForElementToBeVisible(button as HTMLElement);
      }
    });

    it('空状態メッセージが適切に表示されることを確認する', async () => {
      const { container } = render(
        <PostList 
          posts={[]} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );
      
      // 空状態のメインメッセージが表示されていることを確認
      const emptyTitle = await findByTextAndAssertVisible('まだ投稿がありません');
      expect(emptyTitle).toBeInTheDocument();
      
      // 空状態の説明文が表示されていることを確認
      const emptyDescription = await findByTextAndAssertVisible('最初の投稿を作成して、日記を始めましょう！');
      expect(emptyDescription).toBeInTheDocument();
      
      // 空状態のアイコンが表示されていることを確認
      const emptyIcon = await findByTextAndAssertVisible('📝');
      expect(emptyIcon).toBeInTheDocument();
      
      // 投稿リストが存在しないことを確認
      assertElementNotExists(container, 'article');
    });

    it('ローディング状態が正しく表示されることを確認する', async () => {
      const { container } = render(
        <PostList 
          posts={[]} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
          isLoading={true}
        />
      );
      
      // ローディングスケルトンが表示されていることを確認
      const skeletonElements = container.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
      
      // 各スケルトン要素が表示されていることを確認
      for (const skeleton of skeletonElements) {
        await waitForElementToBeVisible(skeleton as HTMLElement);
      }
      
      // ローディング中は実際の投稿や空状態メッセージが表示されないことを確認
      expect(screen.queryByText('まだ投稿がありません')).not.toBeInTheDocument();
      expect(screen.queryByText('今日は良い天気でした')).not.toBeInTheDocument();
    });

    it('更新日時が表示される投稿で更新情報が正しく表示されることを確認する', async () => {
      const updatedPost = createMockPost({
        id: '3',
        content: '更新された投稿',
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T12:00:00Z'), // 2時間後に更新
      });

      const { container } = render(
        <PostList 
          posts={[updatedPost]} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );
      
      // 更新日時の表示を確認
      const updatedText = await findByTextAndAssertVisible(/最終更新:/);
      expect(updatedText).toBeInTheDocument();
      
      // フッター要素が表示されていることを確認
      const footer = assertElementExists(container, 'footer');
      await waitForElementToBeVisible(footer);
    });

    it('複数の投稿が正しい順序で表示されることを確認する', async () => {
      const multiplePosts = createMockPosts(5);
      const { container } = render(
        <PostList 
          posts={multiplePosts} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );
      
      // 全ての投稿記事が表示されていることを確認
      const articles = container.querySelectorAll('article');
      expect(articles).toHaveLength(5);
      
      // 各記事が表示されていることを確認
      for (let i = 0; i < articles.length; i++) {
        await waitForElementToBeVisible(articles[i] as HTMLElement);
        
        // 投稿内容が正しく表示されていることを確認
        const expectedContent = `テスト投稿 ${i + 1}`;
        const contentElement = await findByTextAndAssertVisible(expectedContent);
        expect(contentElement).toBeInTheDocument();
      }
    });
  });

  describe('機能テスト', () => {
    it('編集ボタンが機能する', async () => {
      const user = userEvent.setup();
      render(
        <PostList 
          posts={mockPosts} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );
      
      const editButtons = screen.getAllByTitle('編集');
      await user.click(editButtons[0]);
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockPosts[0]);
    });

    it('削除ボタンが機能する', async () => {
      const user = userEvent.setup();
      
      // window.confirmをモック
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(
        <PostList 
          posts={mockPosts} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );
      
      const deleteButtons = screen.getAllByTitle('削除');
      await user.click(deleteButtons[0]);
      
      expect(confirmSpy).toHaveBeenCalledWith('この投稿を削除しますか？');
      expect(mockOnDelete).toHaveBeenCalledWith('1');
      
      confirmSpy.mockRestore();
    });

    it('削除確認でキャンセルした場合は削除されない', async () => {
      const user = userEvent.setup();
      
      // window.confirmをモック（キャンセル）
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(
        <PostList 
          posts={mockPosts} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      );
      
      const deleteButtons = screen.getAllByTitle('削除');
      await user.click(deleteButtons[0]);
      
      expect(confirmSpy).toHaveBeenCalledWith('この投稿を削除しますか？');
      expect(mockOnDelete).not.toHaveBeenCalled();
      
      confirmSpy.mockRestore();
    });
  });
});