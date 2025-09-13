import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../../src/App';

// LocalStorageのモック
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// ResizeObserverのモック
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// IntersectionObserverのモック
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe('日記投稿機能の統合テスト', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('投稿作成から表示までの完全なフロー', () => {
    it('新規投稿の作成と表示が正常に動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 初期状態で投稿がないことを確認
      expect(screen.queryByText('テスト投稿内容')).not.toBeInTheDocument();
      
      // 新規投稿ボタンをクリック
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      // 投稿フォームが表示されることを確認
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toBeVisible();
      
      // 投稿内容を入力
      const testContent = 'これは統合テスト用の投稿内容です。日記機能のテストを行っています。';
      await user.type(textarea, testContent);
      
      // 入力内容が正しく反映されることを確認
      expect(textarea).toHaveValue(testContent);
      
      // 投稿ボタンをクリック
      const submitButton = screen.getByRole('button', { name: '投稿' });
      expect(submitButton).toBeEnabled();
      await user.click(submitButton);
      
      // 投稿が一覧に表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
        expect(screen.getByText(testContent)).toBeVisible();
      }, { timeout: 3000 });
      
      // 成功トーストが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('投稿完了')).toBeInTheDocument();
      });
      
      // フォームがリセットされることを確認
      expect(screen.getByPlaceholderText('今日はどんな一日でしたか？')).toHaveValue('');
    });

    it('複数の投稿を作成して時系列順に表示される', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const posts = [
        '最初の投稿です',
        '2番目の投稿です',
        '3番目の投稿です'
      ];
      
      // 複数の投稿を作成
      for (const [index, content] of posts.entries()) {
        const newPostButton = screen.getByText('新規投稿');
        await user.click(newPostButton);
        
        const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
        await user.type(textarea, content);
        
        const submitButton = screen.getByRole('button', { name: '投稿' });
        await user.click(submitButton);
        
        // 各投稿が表示されることを確認
        await waitFor(() => {
          expect(screen.getByText(content)).toBeInTheDocument();
        });
        
        // 少し待機して次の投稿との時間差を作る
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 全ての投稿が表示されることを確認
      posts.forEach(content => {
        expect(screen.getByText(content)).toBeInTheDocument();
      });
      
      // 投稿数が正しく表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument(); // 総投稿数
      });
    });

    it('空の投稿は作成できない', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 新規投稿ボタンをクリック
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      // 空の状態で投稿ボタンをクリック
      const submitButton = screen.getByRole('button', { name: '投稿' });
      expect(submitButton).toBeDisabled();
      
      // スペースのみの入力でも投稿できないことを確認
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, '   ');
      
      expect(submitButton).toBeDisabled();
    });

    it('長い投稿内容も正常に処理される', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 長い投稿内容を作成
      const longContent = 'これは非常に長い投稿内容のテストです。'.repeat(50);
      
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, longContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      // 長い投稿も正常に表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(longContent)).toBeInTheDocument();
      });
    });
  });

  describe('投稿編集と削除のフロー', () => {
    it('投稿の編集が正常に動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // まず投稿を作成
      const originalContent = '編集前の投稿内容です';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, originalContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(originalContent)).toBeInTheDocument();
      });
      
      // 編集ボタンをクリック
      const editButton = screen.getByLabelText('投稿を編集');
      await user.click(editButton);
      
      // 編集フォームが表示されることを確認
      const editTextarea = screen.getByDisplayValue(originalContent);
      expect(editTextarea).toBeInTheDocument();
      expect(editTextarea).toBeVisible();
      
      // 内容を変更
      const updatedContent = '編集後の投稿内容です';
      await user.clear(editTextarea);
      await user.type(editTextarea, updatedContent);
      
      // 更新ボタンをクリック
      const updateButton = screen.getByRole('button', { name: '更新' });
      await user.click(updateButton);
      
      // 更新された内容が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(updatedContent)).toBeInTheDocument();
        expect(screen.queryByText(originalContent)).not.toBeInTheDocument();
      });
      
      // 更新成功トーストが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('投稿を更新しました')).toBeInTheDocument();
      });
    });

    it('編集をキャンセルできる', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const originalContent = 'キャンセルテスト用投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, originalContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(originalContent)).toBeInTheDocument();
      });
      
      // 編集ボタンをクリック
      const editButton = screen.getByLabelText('投稿を編集');
      await user.click(editButton);
      
      // 内容を変更
      const editTextarea = screen.getByDisplayValue(originalContent);
      await user.clear(editTextarea);
      await user.type(editTextarea, '変更された内容');
      
      // キャンセルボタンをクリック
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);
      
      // 元の内容が保持されることを確認
      expect(screen.getByText(originalContent)).toBeInTheDocument();
      expect(screen.queryByText('変更された内容')).not.toBeInTheDocument();
    });

    it('投稿の削除が正常に動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const contentToDelete = '削除テスト用投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, contentToDelete);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(contentToDelete)).toBeInTheDocument();
      });
      
      // 削除ボタンをクリック
      const deleteButton = screen.getByLabelText('投稿を削除');
      await user.click(deleteButton);
      
      // 確認ダイアログが表示される場合は確認
      const confirmButton = screen.queryByRole('button', { name: '削除' });
      if (confirmButton) {
        await user.click(confirmButton);
      }
      
      // 投稿が削除されることを確認
      await waitFor(() => {
        expect(screen.queryByText(contentToDelete)).not.toBeInTheDocument();
      });
      
      // 削除成功トーストが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('投稿を削除しました')).toBeInTheDocument();
      });
    });

    it('削除をキャンセルできる', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const contentToKeep = 'キャンセル削除テスト用投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, contentToKeep);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(contentToKeep)).toBeInTheDocument();
      });
      
      // 削除ボタンをクリック
      const deleteButton = screen.getByLabelText('投稿を削除');
      await user.click(deleteButton);
      
      // キャンセルボタンをクリック（確認ダイアログがある場合）
      const cancelButton = screen.queryByRole('button', { name: 'キャンセル' });
      if (cancelButton) {
        await user.click(cancelButton);
      }
      
      // 投稿が保持されることを確認
      expect(screen.getByText(contentToKeep)).toBeInTheDocument();
    });

    it('複数投稿の編集・削除が独立して動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 複数の投稿を作成
      const posts = ['投稿1', '投稿2', '投稿3'];
      
      for (const content of posts) {
        const newPostButton = screen.getByText('新規投稿');
        await user.click(newPostButton);
        
        const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
        await user.type(textarea, content);
        
        const submitButton = screen.getByRole('button', { name: '投稿' });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(content)).toBeInTheDocument();
        });
      }
      
      // 2番目の投稿を編集
      const editButtons = screen.getAllByLabelText('投稿を編集');
      await user.click(editButtons[1]); // 2番目の投稿
      
      const editTextarea = screen.getByDisplayValue('投稿2');
      await user.clear(editTextarea);
      await user.type(editTextarea, '編集済み投稿2');
      
      const updateButton = screen.getByRole('button', { name: '更新' });
      await user.click(updateButton);
      
      // 編集結果を確認
      await waitFor(() => {
        expect(screen.getByText('編集済み投稿2')).toBeInTheDocument();
        expect(screen.queryByText('投稿2')).not.toBeInTheDocument();
      });
      
      // 他の投稿は影響を受けないことを確認
      expect(screen.getByText('投稿1')).toBeInTheDocument();
      expect(screen.getByText('投稿3')).toBeInTheDocument();
      
      // 1番目の投稿を削除
      const deleteButtons = screen.getAllByLabelText('投稿を削除');
      await user.click(deleteButtons[0]); // 1番目の投稿
      
      const confirmButton = screen.queryByRole('button', { name: '削除' });
      if (confirmButton) {
        await user.click(confirmButton);
      }
      
      // 削除結果を確認
      await waitFor(() => {
        expect(screen.queryByText('投稿1')).not.toBeInTheDocument();
      });
      
      // 他の投稿は残っていることを確認
      expect(screen.getByText('編集済み投稿2')).toBeInTheDocument();
      expect(screen.getByText('投稿3')).toBeInTheDocument();
    });
  });

  describe('エラーケースの処理', () => {
    it('ストレージエラー時の投稿作成エラーハンドリング', async () => {
      const user = userEvent.setup();
      
      // LocalStorageエラーをシミュレート
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      render(<App />);
      
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, 'エラーテスト投稿');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      // エラートーストが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('投稿失敗')).toBeInTheDocument();
      });
      
      // 投稿は作成されないことを確認
      expect(screen.queryByText('エラーテスト投稿')).not.toBeInTheDocument();
    });

    it('ストレージエラー時の編集エラーハンドリング', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // まず正常に投稿を作成
      const originalContent = '編集エラーテスト投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, originalContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(originalContent)).toBeInTheDocument();
      });
      
      // ストレージエラーをシミュレート
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error during update');
      });
      
      // 編集を試行
      const editButton = screen.getByLabelText('投稿を編集');
      await user.click(editButton);
      
      const editTextarea = screen.getByDisplayValue(originalContent);
      await user.clear(editTextarea);
      await user.type(editTextarea, '編集失敗テスト');
      
      const updateButton = screen.getByRole('button', { name: '更新' });
      await user.click(updateButton);
      
      // エラートーストが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('更新に失敗しました')).toBeInTheDocument();
      });
      
      // 元の内容が保持されることを確認
      expect(screen.getByText(originalContent)).toBeInTheDocument();
      expect(screen.queryByText('編集失敗テスト')).not.toBeInTheDocument();
    });

    it('ネットワークエラー時の適切なエラー表示', async () => {
      const user = userEvent.setup();
      
      // ネットワークエラーをシミュレート（IndexedDBエラー）
      const originalIndexedDB = window.indexedDB;
      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        writable: true
      });
      
      render(<App />);
      
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, 'ネットワークエラーテスト');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      // エラーメッセージが表示されることを確認
      await waitFor(() => {
        const errorMessage = screen.queryByText('投稿失敗') || 
                           screen.queryByText('エラーが発生しました');
        expect(errorMessage).toBeInTheDocument();
      });
      
      // IndexedDBを復元
      Object.defineProperty(window, 'indexedDB', {
        value: originalIndexedDB,
        writable: true
      });
    });
  });
});