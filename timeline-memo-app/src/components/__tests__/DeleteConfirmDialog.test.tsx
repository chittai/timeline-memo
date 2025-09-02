import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteConfirmDialog from '../DeleteConfirmDialog';
import type { Post } from '../../types';

// テスト用のモック投稿データ
const mockPost: Post = {
  id: 'test-post-1',
  content: 'これはテスト用の投稿内容です。削除確認ダイアログのテストに使用されます。',
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z')
};

const mockLongPost: Post = {
  id: 'test-post-2',
  content: 'これは非常に長い投稿内容です。'.repeat(10) + '100文字を超える場合のテストです。',
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T11:00:00Z') // 更新済み
};

describe('DeleteConfirmDialog', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('表示・非表示', () => {
    it('isOpen=falseの場合、ダイアログが表示されない', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('isOpen=trueの場合、ダイアログが表示される', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('投稿を削除')).toBeInTheDocument();
      expect(screen.getByText('この操作は取り消せません')).toBeInTheDocument();
    });
  });

  describe('投稿内容の表示', () => {
    it('投稿内容が正しく表示される', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(mockPost.content)).toBeInTheDocument();
      expect(screen.getByText('2024/01/15 19:30')).toBeInTheDocument(); // JST表示
    });

    it('長い投稿内容が省略される（100文字超過）', () => {
      render(
        <DeleteConfirmDialog
          post={mockLongPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const displayedContent = screen.getByText(/これは非常に長い投稿内容です。/);
      expect(displayedContent.textContent).toMatch(/\.\.\.$/); // 末尾に...が付く
      expect(displayedContent.textContent!.length).toBeLessThanOrEqual(103); // 100文字 + "..."
    });

    it('更新済み投稿の場合、更新表示が出る', () => {
      render(
        <DeleteConfirmDialog
          post={mockLongPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('(更新済み)')).toBeInTheDocument();
    });
  });

  describe('ユーザーインタラクション', () => {
    it('削除ボタンクリックでonConfirmが呼ばれる', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('削除する'));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('キャンセルボタンクリックでonCancelが呼ばれる', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByText('キャンセル'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('閉じるボタン（×）クリックでonCancelが呼ばれる', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByLabelText('ダイアログを閉じる'));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('ESCキーでonCancelが呼ばれる', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('バックドロップクリックでonCancelが呼ばれる', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // バックドロップ（ダイアログの外側）をクリック
      // ダイアログ自体をクリック（event.target === event.currentTargetの条件を満たす）
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('削除処理中の状態', () => {
    it('isDeleting=trueの場合、ボタンが無効化される', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isDeleting={true}
        />
      );

      expect(screen.getByText('削除中...')).toBeInTheDocument();
      expect(screen.getByText('キャンセル')).toBeDisabled();
      expect(screen.queryByLabelText('ダイアログを閉じる')).not.toBeInTheDocument();
    });

    it('削除処理中はESCキーが無効化される', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isDeleting={true}
        />
      );

      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('削除処理中はバックドロップクリックが無効化される', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isDeleting={true}
        />
      );

      fireEvent.click(screen.getByRole('dialog').parentElement!);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なARIA属性が設定されている', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'delete-dialog-title');
      expect(dialog).toHaveAttribute('aria-describedby', 'delete-dialog-description');
    });

    it('タイトルと説明が適切に関連付けられている', () => {
      render(
        <DeleteConfirmDialog
          post={mockPost}
          isOpen={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('heading', { name: '投稿を削除' })).toHaveAttribute('id', 'delete-dialog-title');
      expect(screen.getByText('以下の投稿を削除してもよろしいですか？')).toHaveAttribute('id', 'delete-dialog-description');
    });
  });
});