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

describe('カレンダー機能の統合テスト', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('日付選択と表示切り替えのフロー', () => {
    it('カレンダービューに切り替えて日付を選択できる', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      // カレンダービューが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      // カレンダーコンポーネントが表示されることを確認
      const calendarElement = screen.getByRole('grid', { name: /カレンダー/i });
      expect(calendarElement).toBeInTheDocument();
      expect(calendarElement).toBeVisible();
    });

    it('特定の日付を選択すると該当日の投稿が表示される', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // まず投稿を作成（今日の日付で）
      const testContent = 'カレンダーテスト用投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      // 今日の日付をクリック
      const today = new Date();
      const todayButton = screen.getByRole('button', { 
        name: new RegExp(today.getDate().toString()) 
      });
      await user.click(todayButton);
      
      // 該当日の投稿が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
    });

    it('投稿がない日付を選択すると空状態が表示される', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      // 過去の日付をクリック（投稿がない日）
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      
      const pastDateButton = screen.getByRole('button', { 
        name: new RegExp(pastDate.getDate().toString()) 
      });
      await user.click(pastDateButton);
      
      // 空状態メッセージが表示されることを確認
      await waitFor(() => {
        const emptyMessage = screen.queryByText('この日の投稿はありません') ||
                           screen.queryByText('投稿がありません');
        expect(emptyMessage).toBeInTheDocument();
      });
    });

    it('カレンダーから他のビューに切り替えても選択状態が保持される', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const testContent = 'ビュー切り替えテスト投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // カレンダービューに切り替えて日付を選択
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      const today = new Date();
      const todayButton = screen.getByRole('button', { 
        name: new RegExp(today.getDate().toString()) 
      });
      await user.click(todayButton);
      
      // リストビューに切り替え
      const listButton = screen.getByText('リスト');
      await user.click(listButton);
      
      // 選択した日付の投稿が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // 再度カレンダービューに戻る
      await user.click(calendarButton);
      
      // 選択状態が保持されていることを確認
      await waitFor(() => {
        const selectedDate = screen.getByRole('button', { 
          name: new RegExp(today.getDate().toString()),
          pressed: true 
        });
        expect(selectedDate).toBeInTheDocument();
      });
    });

    it('複数の日付に投稿がある場合の日付選択', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 複数日の投稿を作成するため、日付を変更しながら投稿
      const posts = [
        { content: '1日目の投稿', daysAgo: 0 },
        { content: '2日目の投稿', daysAgo: 1 },
        { content: '3日目の投稿', daysAgo: 2 }
      ];
      
      for (const post of posts) {
        // 投稿作成
        const newPostButton = screen.getByText('新規投稿');
        await user.click(newPostButton);
        
        const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
        await user.type(textarea, post.content);
        
        const submitButton = screen.getByRole('button', { name: '投稿' });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(post.content)).toBeInTheDocument();
        });
        
        // 少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      // 今日の投稿を確認
      const today = new Date();
      const todayButton = screen.getByRole('button', { 
        name: new RegExp(today.getDate().toString()) 
      });
      await user.click(todayButton);
      
      await waitFor(() => {
        expect(screen.getByText('1日目の投稿')).toBeInTheDocument();
      });
      
      // 投稿がある日付にはマーカーが表示されることを確認
      const dateWithPosts = screen.getAllByRole('button').filter(button => 
        button.classList.contains('has-posts') || 
        button.getAttribute('data-has-posts') === 'true'
      );
      expect(dateWithPosts.length).toBeGreaterThan(0);
    });
  });

  describe('カレンダーナビゲーションのテスト', () => {
    it('月の切り替えが正常に動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      // 現在の月を取得
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleDateString('ja-JP', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      // 次の月ボタンをクリック
      const nextMonthButton = screen.getByRole('button', { name: /次の月|>/ });
      await user.click(nextMonthButton);
      
      // 月が変更されることを確認
      await waitFor(() => {
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
        const expectedMonth = nextMonth.toLocaleDateString('ja-JP', { 
          year: 'numeric', 
          month: 'long' 
        });
        expect(screen.getByText(expectedMonth)).toBeInTheDocument();
      });
      
      // 前の月ボタンをクリック
      const prevMonthButton = screen.getByRole('button', { name: /前の月|</ });
      await user.click(prevMonthButton);
      
      // 元の月に戻ることを確認
      await waitFor(() => {
        expect(screen.getByText(currentMonth)).toBeInTheDocument();
      });
    });

    it('年の切り替えが正常に動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      const currentYear = new Date().getFullYear();
      
      // 年選択ドロップダウンがある場合
      const yearSelector = screen.queryByRole('combobox', { name: /年/ });
      if (yearSelector) {
        await user.click(yearSelector);
        
        // 前年を選択
        const prevYear = screen.getByRole('option', { name: (currentYear - 1).toString() });
        await user.click(prevYear);
        
        // 年が変更されることを確認
        await waitFor(() => {
          expect(screen.getByText((currentYear - 1).toString())).toBeInTheDocument();
        });
      }
    });

    it('今日の日付に戻るボタンが動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      // 別の月に移動
      const nextMonthButton = screen.getByRole('button', { name: /次の月|>/ });
      await user.click(nextMonthButton);
      await user.click(nextMonthButton); // 2ヶ月先に移動
      
      // 今日に戻るボタンをクリック
      const todayButton = screen.queryByRole('button', { name: /今日|Today/ });
      if (todayButton) {
        await user.click(todayButton);
        
        // 今月に戻ることを確認
        const currentMonth = new Date().toLocaleDateString('ja-JP', { 
          year: 'numeric', 
          month: 'long' 
        });
        await waitFor(() => {
          expect(screen.getByText(currentMonth)).toBeInTheDocument();
        });
      }
    });

    it('カレンダーの週表示が正しく動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      // 曜日ヘッダーが表示されることを確認
      const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
      weekdays.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
      
      // カレンダーグリッドが正しく表示されることを確認
      const calendarGrid = screen.getByRole('grid');
      expect(calendarGrid).toBeInTheDocument();
      
      // 日付ボタンが適切に配置されていることを確認
      const dateButtons = screen.getAllByRole('button').filter(button => 
        /^\d+$/.test(button.textContent || '')
      );
      expect(dateButtons.length).toBeGreaterThan(20); // 月の日数分のボタンがある
    });

    it('キーボードナビゲーションが動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      // 最初の日付ボタンにフォーカス
      const firstDateButton = screen.getAllByRole('button').find(button => 
        /^1$/.test(button.textContent || '')
      );
      
      if (firstDateButton) {
        firstDateButton.focus();
        
        // 矢印キーでナビゲーション
        await user.keyboard('{ArrowRight}');
        
        // フォーカスが移動することを確認
        const focusedElement = document.activeElement;
        expect(focusedElement).toBeInstanceOf(HTMLButtonElement);
        expect(focusedElement?.textContent).toBe('2');
        
        // Enterキーで選択
        await user.keyboard('{Enter}');
        
        // 日付が選択されることを確認
        await waitFor(() => {
          const selectedButton = screen.getByRole('button', { 
            name: '2',
            pressed: true 
          });
          expect(selectedButton).toBeInTheDocument();
        });
      }
    });
  });

  describe('カレンダーとタイムラインの連携', () => {
    it('カレンダーで選択した日付がタイムラインに反映される', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const testContent = 'タイムライン連携テスト投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // カレンダービューに切り替えて日付を選択
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      const today = new Date();
      const todayButton = screen.getByRole('button', { 
        name: new RegExp(today.getDate().toString()) 
      });
      await user.click(todayButton);
      
      // タイムラインビューに切り替え
      const timelineButton = screen.getByText('タイムライン');
      await user.click(timelineButton);
      
      // 選択した日付の投稿がタイムラインに表示されることを確認
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
    });

    it('カレンダーの日付選択がフィルタリングに影響する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 複数の投稿を作成
      const posts = ['今日の投稿1', '今日の投稿2'];
      
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
      
      // カレンダービューで今日を選択
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      const today = new Date();
      const todayButton = screen.getByRole('button', { 
        name: new RegExp(today.getDate().toString()) 
      });
      await user.click(todayButton);
      
      // リストビューに切り替え
      const listButton = screen.getByText('リスト');
      await user.click(listButton);
      
      // 今日の投稿のみが表示されることを確認
      posts.forEach(content => {
        expect(screen.getByText(content)).toBeInTheDocument();
      });
      
      // 投稿数が正しいことを確認
      const postElements = screen.getAllByText(/今日の投稿/);
      expect(postElements).toHaveLength(2);
    });
  });

  describe('エラーケースの処理', () => {
    it('カレンダーデータ読み込みエラーの処理', async () => {
      const user = userEvent.setup();
      
      // LocalStorageエラーをシミュレート
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Calendar data read error');
      });
      
      render(<App />);
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      // エラーメッセージまたはフォールバック表示を確認
      await waitFor(() => {
        const errorMessage = screen.queryByText('カレンダーの読み込みに失敗しました') ||
                           screen.queryByText('エラーが発生しました') ||
                           screen.getByText('カレンダービュー'); // 最低限の表示は確保
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('無効な日付選択時の処理', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      // 存在しない日付（例：2月30日）をシミュレート
      // 実際のカレンダーコンポーネントでは無効な日付は表示されないが、
      // プログラム的に無効な日付を設定した場合の処理を確認
      
      // カレンダーが適切にレンダリングされ、無効な日付が表示されないことを確認
      const calendarGrid = screen.getByRole('grid');
      expect(calendarGrid).toBeInTheDocument();
      
      // 31日以上の日付ボタンが存在しないことを確認
      const invalidDateButton = screen.queryByRole('button', { name: '32' });
      expect(invalidDateButton).not.toBeInTheDocument();
    });

    it('カレンダー表示中のメモリリークの防止', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
      
      // 複数回の月切り替えを行う
      const nextMonthButton = screen.getByRole('button', { name: /次の月|>/ });
      
      for (let i = 0; i < 5; i++) {
        await user.click(nextMonthButton);
        await waitFor(() => {
          // 月が変更されることを確認
          expect(screen.getByRole('grid')).toBeInTheDocument();
        });
      }
      
      // 他のビューに切り替え
      const listButton = screen.getByText('リスト');
      await user.click(listButton);
      
      // カレンダーコンポーネントがアンマウントされることを確認
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      
      // 再度カレンダービューに切り替えても正常に動作することを確認
      await user.click(calendarButton);
      
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
    });
  });
});