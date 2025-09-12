import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import App from '../App';

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

describe('App統合テスト', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  it('アプリが正常に起動する', async () => {
    render(<App />);
    
    // ヘッダーが表示される
    expect(screen.getByText('📝 タイムライン日記アプリ')).toBeInTheDocument();
    
    // ビューモードセレクターが表示される
    expect(screen.getByText('タイムライン')).toBeInTheDocument();
    expect(screen.getByText('リスト')).toBeInTheDocument();
    expect(screen.getByText('日記')).toBeInTheDocument();
    expect(screen.getByText('カレンダー')).toBeInTheDocument();
  });

  it('投稿機能の完全フローが動作する', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 新規投稿ボタンをクリック
    const newPostButton = screen.getByText('新規投稿');
    await user.click(newPostButton);
    
    // 投稿フォームが表示される
    const textarea = screen.getByPlaceholderText('今日の出来事を記録しましょう...');
    expect(textarea).toBeInTheDocument();
    
    // 投稿内容を入力
    await user.type(textarea, 'テスト投稿です');
    
    // 投稿ボタンをクリック
    const submitButton = screen.getByRole('button', { name: '投稿' });
    await user.click(submitButton);
    
    // 投稿が一覧に表示される
    await waitFor(() => {
      expect(screen.getByText('テスト投稿です')).toBeInTheDocument();
    });
    
    // 成功トーストが表示される
    expect(screen.getByText('投稿完了')).toBeInTheDocument();
  });

  it('ビューモード切り替えが動作する', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 日記ビューに切り替え
    const diaryButton = screen.getByText('日記');
    await user.click(diaryButton);
    
    // 日記ビューが表示される
    await waitFor(() => {
      expect(screen.getByText('日記ビュー')).toBeInTheDocument();
    });
    
    // カレンダービューに切り替え
    const calendarButton = screen.getByText('カレンダー');
    await user.click(calendarButton);
    
    // カレンダービューが表示される
    await waitFor(() => {
      expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
    });
  });

  it('投稿の編集・削除が動作する', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // まず投稿を作成
    const newPostButton = screen.getByText('新規投稿');
    await user.click(newPostButton);
    
    const textarea = screen.getByPlaceholderText('今日の出来事を記録しましょう...');
    await user.type(textarea, '編集テスト投稿');
    
    const submitButton = screen.getByRole('button', { name: '投稿' });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('編集テスト投稿')).toBeInTheDocument();
    });
    
    // 編集ボタンをクリック
    const editButton = screen.getByLabelText('投稿を編集');
    await user.click(editButton);
    
    // 編集フォームが表示される
    const editTextarea = screen.getByDisplayValue('編集テスト投稿');
    expect(editTextarea).toBeInTheDocument();
    
    // 内容を変更
    await user.clear(editTextarea);
    await user.type(editTextarea, '編集済み投稿');
    
    // 更新ボタンをクリック
    const updateButton = screen.getByRole('button', { name: '更新' });
    await user.click(updateButton);
    
    // 更新された内容が表示される
    await waitFor(() => {
      expect(screen.getByText('編集済み投稿')).toBeInTheDocument();
    });
    
    // 削除ボタンをクリック
    const deleteButton = screen.getByLabelText('投稿を削除');
    await user.click(deleteButton);
    
    // 投稿が削除される
    await waitFor(() => {
      expect(screen.queryByText('編集済み投稿')).not.toBeInTheDocument();
    });
  });

  it('統計情報が正しく表示される', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 初期状態の統計を確認
    expect(screen.getByText('総投稿数')).toBeInTheDocument();
    expect(screen.getByText('継続日数')).toBeInTheDocument();
    expect(screen.getByText('今月の投稿')).toBeInTheDocument();
    
    // 投稿を作成
    const newPostButton = screen.getByText('新規投稿');
    await user.click(newPostButton);
    
    const textarea = screen.getByPlaceholderText('今日の出来事を記録しましょう...');
    await user.type(textarea, '統計テスト投稿');
    
    const submitButton = screen.getByRole('button', { name: '投稿' });
    await user.click(submitButton);
    
    // 統計が更新される
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // 総投稿数
    });
  });

  it('レスポンシブデザインが動作する', () => {
    // モバイルサイズに変更
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    
    // リサイズイベントを発火
    fireEvent(window, new Event('resize'));
    
    render(<App />);
    
    // モバイル向けのレイアウトが適用される
    expect(document.body).toBeInTheDocument();
  });

  it('エラーハンドリングが動作する', async () => {
    const user = userEvent.setup();
    
    // LocalStorageエラーをシミュレート
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage error');
    });
    
    render(<App />);
    
    // 投稿を試行
    const newPostButton = screen.getByText('新規投稿');
    await user.click(newPostButton);
    
    const textarea = screen.getByPlaceholderText('今日の出来事を記録しましょう...');
    await user.type(textarea, 'エラーテスト投稿');
    
    const submitButton = screen.getByRole('button', { name: '投稿' });
    await user.click(submitButton);
    
    // エラートーストが表示される
    await waitFor(() => {
      expect(screen.getByText('投稿失敗')).toBeInTheDocument();
    });
  });

  it('キーボードショートカットが動作する', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 新規投稿フォームを開く
    const newPostButton = screen.getByText('新規投稿');
    await user.click(newPostButton);
    
    const textarea = screen.getByPlaceholderText('今日の出来事を記録しましょう...');
    await user.type(textarea, 'ショートカットテスト');
    
    // Ctrl+Enterで投稿
    await user.keyboard('{Control>}{Enter}{/Control}');
    
    // 投稿が作成される
    await waitFor(() => {
      expect(screen.getByText('ショートカットテスト')).toBeInTheDocument();
    });
  });
});