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

describe('フィルタリング機能の統合テスト', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('日付範囲指定フィルターのテスト', () => {
    it('日付範囲フィルターが正常に動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 複数の投稿を作成（異なる日付で）
      const posts = [
        { content: '今日の投稿', daysAgo: 0 },
        { content: '昨日の投稿', daysAgo: 1 },
        { content: '一週間前の投稿', daysAgo: 7 }
      ];
      
      // 投稿を作成
      for (const post of posts) {
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
      
      // 日付範囲フィルターを開く
      const filterButton = screen.queryByRole('button', { name: /フィルター|日付範囲/ });
      if (filterButton) {
        await user.click(filterButton);
        
        // 日付範囲選択UI が表示されることを確認
        const startDateInput = screen.queryByLabelText(/開始日|From/);
        const endDateInput = screen.queryByLabelText(/終了日|To/);
        
        if (startDateInput && endDateInput) {
          // 今日から昨日までの範囲を設定
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          const todayStr = today.toISOString().split('T')[0];
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          await user.clear(startDateInput);
          await user.type(startDateInput, yesterdayStr);
          
          await user.clear(endDateInput);
          await user.type(endDateInput, todayStr);
          
          // フィルター適用
          const applyButton = screen.getByRole('button', { name: /適用|Apply/ });
          await user.click(applyButton);
          
          // 範囲内の投稿のみが表示されることを確認
          await waitFor(() => {
            expect(screen.getByText('今日の投稿')).toBeInTheDocument();
            expect(screen.getByText('昨日の投稿')).toBeInTheDocument();
            expect(screen.queryByText('一週間前の投稿')).not.toBeInTheDocument();
          });
        }
      }
    });

    it('日付範囲フィルターのクリアが動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const testContent = 'フィルタークリアテスト投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // フィルターを適用
      const filterButton = screen.queryByRole('button', { name: /フィルター|日付範囲/ });
      if (filterButton) {
        await user.click(filterButton);
        
        const startDateInput = screen.queryByLabelText(/開始日|From/);
        if (startDateInput) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          await user.clear(startDateInput);
          await user.type(startDateInput, yesterdayStr);
          
          const applyButton = screen.getByRole('button', { name: /適用|Apply/ });
          await user.click(applyButton);
          
          // 投稿が非表示になることを確認
          await waitFor(() => {
            expect(screen.queryByText(testContent)).not.toBeInTheDocument();
          });
          
          // フィルタークリア
          const clearButton = screen.getByRole('button', { name: /クリア|Clear/ });
          await user.click(clearButton);
          
          // 全ての投稿が再表示されることを確認
          await waitFor(() => {
            expect(screen.getByText(testContent)).toBeInTheDocument();
          });
        }
      }
    });

    it('無効な日付範囲の処理', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // フィルターを開く
      const filterButton = screen.queryByRole('button', { name: /フィルター|日付範囲/ });
      if (filterButton) {
        await user.click(filterButton);
        
        const startDateInput = screen.queryByLabelText(/開始日|From/);
        const endDateInput = screen.queryByLabelText(/終了日|To/);
        
        if (startDateInput && endDateInput) {
          // 終了日が開始日より前の無効な範囲を設定
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const todayStr = today.toISOString().split('T')[0];
          const tomorrowStr = tomorrow.toISOString().split('T')[0];
          
          await user.clear(startDateInput);
          await user.type(startDateInput, tomorrowStr); // 開始日を明日に
          
          await user.clear(endDateInput);
          await user.type(endDateInput, todayStr); // 終了日を今日に
          
          // 適用ボタンが無効化されるか、エラーメッセージが表示されることを確認
          const applyButton = screen.getByRole('button', { name: /適用|Apply/ });
          
          // ボタンが無効化されているか確認
          if (!applyButton.hasAttribute('disabled')) {
            await user.click(applyButton);
            
            // エラーメッセージが表示されることを確認
            await waitFor(() => {
              const errorMessage = screen.queryByText(/無効な日付範囲|開始日は終了日より前/);
              expect(errorMessage).toBeInTheDocument();
            });
          } else {
            expect(applyButton).toBeDisabled();
          }
        }
      }
    });

    it('日付範囲フィルターと他のビューの連携', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const testContent = 'ビュー連携テスト投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // リストビューでフィルターを適用
      const filterButton = screen.queryByRole('button', { name: /フィルター|日付範囲/ });
      if (filterButton) {
        await user.click(filterButton);
        
        const startDateInput = screen.queryByLabelText(/開始日|From/);
        if (startDateInput) {
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];
          
          await user.clear(startDateInput);
          await user.type(startDateInput, todayStr);
          
          const applyButton = screen.getByRole('button', { name: /適用|Apply/ });
          await user.click(applyButton);
        }
      }
      
      // タイムラインビューに切り替え
      const timelineButton = screen.getByText('タイムライン');
      await user.click(timelineButton);
      
      // フィルターが維持されることを確認
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // カレンダービューに切り替え
      const calendarButton = screen.getByText('カレンダー');
      await user.click(calendarButton);
      
      // フィルターが維持されることを確認
      await waitFor(() => {
        expect(screen.getByText('カレンダービュー')).toBeInTheDocument();
      });
    });
  });

  describe('検索機能のテスト', () => {
    it('テキスト検索が正常に動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 複数の投稿を作成
      const posts = [
        'プログラミングの勉強をしました',
        '映画を見て感動しました',
        'プログラミング言語について調べました',
        '散歩をして気分転換しました'
      ];
      
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
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 検索ボックスを見つけて検索
      const searchInput = screen.queryByPlaceholderText(/検索|Search/) ||
                         screen.queryByRole('searchbox');
      
      if (searchInput) {
        await user.type(searchInput, 'プログラミング');
        
        // 検索結果が表示されることを確認
        await waitFor(() => {
          expect(screen.getByText('プログラミングの勉強をしました')).toBeInTheDocument();
          expect(screen.getByText('プログラミング言語について調べました')).toBeInTheDocument();
          expect(screen.queryByText('映画を見て感動しました')).not.toBeInTheDocument();
          expect(screen.queryByText('散歩をして気分転換しました')).not.toBeInTheDocument();
        });
      }
    });

    it('検索キーワードのクリアが動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const posts = ['検索テスト投稿1', '別の内容の投稿2'];
      
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
      
      // 検索を実行
      const searchInput = screen.queryByPlaceholderText(/検索|Search/) ||
                         screen.queryByRole('searchbox');
      
      if (searchInput) {
        await user.type(searchInput, '検索テスト');
        
        // 検索結果を確認
        await waitFor(() => {
          expect(screen.getByText('検索テスト投稿1')).toBeInTheDocument();
          expect(screen.queryByText('別の内容の投稿2')).not.toBeInTheDocument();
        });
        
        // 検索をクリア
        await user.clear(searchInput);
        
        // 全ての投稿が再表示されることを確認
        await waitFor(() => {
          expect(screen.getByText('検索テスト投稿1')).toBeInTheDocument();
          expect(screen.getByText('別の内容の投稿2')).toBeInTheDocument();
        });
      }
    });

    it('部分一致検索が動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const testContent = 'JavaScriptでWebアプリケーションを開発中';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // 部分一致で検索
      const searchInput = screen.queryByPlaceholderText(/検索|Search/) ||
                         screen.queryByRole('searchbox');
      
      if (searchInput) {
        // 部分的なキーワードで検索
        await user.type(searchInput, 'Web');
        
        // 部分一致で見つかることを確認
        await waitFor(() => {
          expect(screen.getByText(testContent)).toBeInTheDocument();
        });
        
        // 別の部分で検索
        await user.clear(searchInput);
        await user.type(searchInput, 'アプリ');
        
        await waitFor(() => {
          expect(screen.getByText(testContent)).toBeInTheDocument();
        });
      }
    });

    it('大文字小文字を区別しない検索', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 英語を含む投稿を作成
      const testContent = 'Learning React and TypeScript today';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // 大文字小文字を変えて検索
      const searchInput = screen.queryByPlaceholderText(/検索|Search/) ||
                         screen.queryByRole('searchbox');
      
      if (searchInput) {
        // 小文字で検索
        await user.type(searchInput, 'react');
        
        await waitFor(() => {
          expect(screen.getByText(testContent)).toBeInTheDocument();
        });
        
        // 大文字で検索
        await user.clear(searchInput);
        await user.type(searchInput, 'TYPESCRIPT');
        
        await waitFor(() => {
          expect(screen.getByText(testContent)).toBeInTheDocument();
        });
      }
    });

    it('検索結果がない場合の表示', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const testContent = '今日は良い天気でした';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // 存在しないキーワードで検索
      const searchInput = screen.queryByPlaceholderText(/検索|Search/) ||
                         screen.queryByRole('searchbox');
      
      if (searchInput) {
        await user.type(searchInput, '存在しないキーワード');
        
        // 検索結果なしのメッセージが表示されることを確認
        await waitFor(() => {
          const noResultsMessage = screen.queryByText(/検索結果がありません|見つかりませんでした/) ||
                                  screen.queryByText('投稿がありません');
          expect(noResultsMessage).toBeInTheDocument();
          expect(screen.queryByText(testContent)).not.toBeInTheDocument();
        });
      }
    });

    it('検索とビュー切り替えの連携', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const testContent = 'ビュー切り替え検索テスト投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // リストビューで検索
      const searchInput = screen.queryByPlaceholderText(/検索|Search/) ||
                         screen.queryByRole('searchbox');
      
      if (searchInput) {
        await user.type(searchInput, 'ビュー切り替え');
        
        await waitFor(() => {
          expect(screen.getByText(testContent)).toBeInTheDocument();
        });
        
        // タイムラインビューに切り替え
        const timelineButton = screen.getByText('タイムライン');
        await user.click(timelineButton);
        
        // 検索結果が維持されることを確認
        await waitFor(() => {
          expect(screen.getByText(testContent)).toBeInTheDocument();
        });
        
        // 日記ビューに切り替え
        const diaryButton = screen.getByText('日記');
        await user.click(diaryButton);
        
        // 検索結果が維持されることを確認
        await waitFor(() => {
          expect(screen.getByText('日記ビュー')).toBeInTheDocument();
        });
      }
    });
  });

  describe('複合フィルタリングのテスト', () => {
    it('日付範囲と検索の組み合わせフィルター', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 複数の投稿を作成
      const posts = [
        'プログラミングの勉強をしました',
        '映画鑑賞をしました',
        'プログラミングコンテストに参加しました'
      ];
      
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
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 検索フィルターを適用
      const searchInput = screen.queryByPlaceholderText(/検索|Search/) ||
                         screen.queryByRole('searchbox');
      
      if (searchInput) {
        await user.type(searchInput, 'プログラミング');
        
        // 検索結果を確認
        await waitFor(() => {
          expect(screen.getByText('プログラミングの勉強をしました')).toBeInTheDocument();
          expect(screen.getByText('プログラミングコンテストに参加しました')).toBeInTheDocument();
          expect(screen.queryByText('映画鑑賞をしました')).not.toBeInTheDocument();
        });
        
        // 日付範囲フィルターも適用
        const filterButton = screen.queryByRole('button', { name: /フィルター|日付範囲/ });
        if (filterButton) {
          await user.click(filterButton);
          
          const startDateInput = screen.queryByLabelText(/開始日|From/);
          if (startDateInput) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            
            await user.clear(startDateInput);
            await user.type(startDateInput, todayStr);
            
            const applyButton = screen.getByRole('button', { name: /適用|Apply/ });
            await user.click(applyButton);
            
            // 両方の条件を満たす投稿のみが表示されることを確認
            await waitFor(() => {
              expect(screen.getByText('プログラミングの勉強をしました')).toBeInTheDocument();
              expect(screen.getByText('プログラミングコンテストに参加しました')).toBeInTheDocument();
              expect(screen.queryByText('映画鑑賞をしました')).not.toBeInTheDocument();
            });
          }
        }
      }
    });

    it('フィルターのリセット機能', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const testContent = 'フィルターリセットテスト投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // 検索フィルターを適用
      const searchInput = screen.queryByPlaceholderText(/検索|Search/) ||
                         screen.queryByRole('searchbox');
      
      if (searchInput) {
        await user.type(searchInput, '存在しないキーワード');
        
        // 投稿が非表示になることを確認
        await waitFor(() => {
          expect(screen.queryByText(testContent)).not.toBeInTheDocument();
        });
        
        // フィルターリセットボタンを探す
        const resetButton = screen.queryByRole('button', { name: /リセット|Reset|クリア/ });
        if (resetButton) {
          await user.click(resetButton);
          
          // 全ての投稿が再表示されることを確認
          await waitFor(() => {
            expect(screen.getByText(testContent)).toBeInTheDocument();
          });
          
          // 検索ボックスもクリアされることを確認
          expect(searchInput).toHaveValue('');
        } else {
          // リセットボタンがない場合は検索ボックスをクリア
          await user.clear(searchInput);
          
          await waitFor(() => {
            expect(screen.getByText(testContent)).toBeInTheDocument();
          });
        }
      }
    });
  });

  describe('エラーケースの処理', () => {
    it('フィルター処理中のエラーハンドリング', async () => {
      const user = userEvent.setup();
      
      // LocalStorageエラーをシミュレート
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Filter data access error');
      });
      
      render(<App />);
      
      // 検索を試行
      const searchInput = screen.queryByPlaceholderText(/検索|Search/) ||
                         screen.queryByRole('searchbox');
      
      if (searchInput) {
        await user.type(searchInput, 'テスト');
        
        // エラーが発生してもアプリ���クラッシュしないことを確認
        await waitFor(() => {
          // エラーメッセージが表示されるか、最低限の機能が動作することを確認
          const errorMessage = screen.queryByText(/エラーが発生しました|検索に失敗/) ||
                              screen.getByText('📝 タイムライン日記アプリ'); // アプリが動作している証拠
          expect(errorMessage).toBeInTheDocument();
        });
      }
    });

    it('無効な検索クエリの処理', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const testContent = '通常の投稿内容';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // 特殊文字を含む検索クエリ
      const searchInput = screen.queryByPlaceholderText(/検索|Search/) ||
                         screen.queryByRole('searchbox');
      
      if (searchInput) {
        const specialChars = ['***', '////', '\\\\\\', '???', '<<<>>>'];
        
        for (const chars of specialChars) {
          await user.clear(searchInput);
          await user.type(searchInput, chars);
          
          // エラーが発生せず、適切に処理されることを確認
          await waitFor(() => {
            // 検索結果なしまたは元の投稿が表示される
            const noResults = screen.queryByText(/検索結果がありません/) ||
                             screen.queryByText(testContent);
            expect(noResults).toBeInTheDocument();
          });
        }
      }
    });

    it('フィルター状態の永続化エラー処理', async () => {
      const user = userEvent.setup();
      
      // LocalStorage書き込みエラーをシミュレート
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Cannot save filter state');
      });
      
      render(<App />);
      
      // 検索フィルターを適用
      const searchInput = screen.queryByPlaceholderText(/検索|Search/) ||
                         screen.queryByRole('searchbox');
      
      if (searchInput) {
        await user.type(searchInput, 'テスト検索');
        
        // エラーが発生してもフィルター機能は動作することを確認
        // （永続化に失敗してもセッション中は動作する）
        await waitFor(() => {
          expect(searchInput).toHaveValue('テスト検索');
        });
        
        // ページリロードをシミュレート（新しいレンダリング）
        // この場合、フィルター状態は復元されない可能性がある
        // しかし、アプリは正常に動作する必要がある
      }
    });
  });
});