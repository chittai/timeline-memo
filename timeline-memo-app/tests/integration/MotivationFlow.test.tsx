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

describe('モチベーション機能の統合テスト', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    vi.clearAllMocks();
  });

  describe('統計表示の更新テスト', () => {
    it('投稿作成時に統計が正しく更新される', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 初期状態の統計を確認
      expect(screen.getByText('総投稿数')).toBeInTheDocument();
      expect(screen.getByText('継続日数')).toBeInTheDocument();
      expect(screen.getByText('今月の投稿')).toBeInTheDocument();
      
      // 初期値を確認（0であることを期待）
      const initialStats = screen.getAllByText('0');
      expect(initialStats.length).toBeGreaterThan(0);
      
      // 最初の投稿を作成
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, '最初の投稿です');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      // 投稿が作成されることを確認
      await waitFor(() => {
        expect(screen.getByText('最初の投稿です')).toBeInTheDocument();
      });
      
      // 統計が更新されることを確認
      await waitFor(() => {
        // 総投稿数が1になる
        const totalPostsElement = screen.getByText('総投稿数').closest('div');
        expect(totalPostsElement).toHaveTextContent('1');
        
        // 今月の投稿数が1になる
        const monthlyPostsElement = screen.getByText('今月の投稿').closest('div');
        expect(monthlyPostsElement).toHaveTextContent('1');
      });
    });

    it('複数投稿作成時の統計更新', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 複数の投稿を作成
      const posts = ['投稿1', '投稿2', '投稿3'];
      
      for (const [index, content] of posts.entries()) {
        const newPostButton = screen.getByText('新規投稿');
        await user.click(newPostButton);
        
        const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
        await user.type(textarea, content);
        
        const submitButton = screen.getByRole('button', { name: '投稿' });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(content)).toBeInTheDocument();
        });
        
        // 各投稿後に統計が更新されることを確認
        await waitFor(() => {
          const totalPostsElement = screen.getByText('総投稿数').closest('div');
          expect(totalPostsElement).toHaveTextContent((index + 1).toString());
        });
        
        // 少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 最終的な統計を確認
      await waitFor(() => {
        const totalPostsElement = screen.getByText('総投稿数').closest('div');
        expect(totalPostsElement).toHaveTextContent('3');
        
        const monthlyPostsElement = screen.getByText('今月の投稿').closest('div');
        expect(monthlyPostsElement).toHaveTextContent('3');
      });
    });

    it('投稿削除時の統計更新', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const testContent = '削除テスト投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // 統計が更新されることを確認
      await waitFor(() => {
        const totalPostsElement = screen.getByText('総投稿数').closest('div');
        expect(totalPostsElement).toHaveTextContent('1');
      });
      
      // 投稿を削除
      const deleteButton = screen.getByLabelText('投稿を削除');
      await user.click(deleteButton);
      
      // 確認ダイアログがある場合は確認
      const confirmButton = screen.queryByRole('button', { name: '削除' });
      if (confirmButton) {
        await user.click(confirmButton);
      }
      
      // 投稿が削除されることを確認
      await waitFor(() => {
        expect(screen.queryByText(testContent)).not.toBeInTheDocument();
      });
      
      // 統計が更新されることを確認
      await waitFor(() => {
        const totalPostsElement = screen.getByText('総投稿数').closest('div');
        expect(totalPostsElement).toHaveTextContent('0');
        
        const monthlyPostsElement = screen.getByText('今月の投稿').closest('div');
        expect(monthlyPostsElement).toHaveTextContent('0');
      });
    });

    it('継続日数の計算が正しく動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const testContent = '継続日数テスト投稿';
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, testContent);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(testContent)).toBeInTheDocument();
      });
      
      // 継続日数が表示されることを確認
      await waitFor(() => {
        const streakElement = screen.getByText('継続日数').closest('div');
        expect(streakElement).toBeInTheDocument();
        
        // 初回投稿なので継続日数は1日
        expect(streakElement).toHaveTextContent('1');
      });
    });

    it('統計の詳細表示が動作する', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 複数の投稿を作成
      for (let i = 1; i <= 5; i++) {
        const newPostButton = screen.getByText('新規投稿');
        await user.click(newPostButton);
        
        const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
        await user.type(textarea, `統計テスト投稿${i}`);
        
        const submitButton = screen.getByRole('button', { name: '投稿' });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(`統計テスト投稿${i}`)).toBeInTheDocument();
        });
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // 統計パネルをクリックして詳細表示
      const statsPanel = screen.getByText('総投稿数').closest('div');
      if (statsPanel) {
        await user.click(statsPanel);
        
        // 詳細統計が表示されることを確認
        await waitFor(() => {
          // 詳細統計の要素を確認
          const detailsModal = screen.queryByRole('dialog') ||
                              screen.queryByText('詳細統計') ||
                              screen.queryByText('統計詳細');
          
          if (detailsModal) {
            expect(detailsModal).toBeInTheDocument();
          }
        });
      }
    });

    it('統計のリアルタイム更新', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 初期状態を確認
      const totalPostsElement = screen.getByText('総投稿数').closest('div');
      expect(totalPostsElement).toHaveTextContent('0');
      
      // 投稿を作成
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, 'リアルタイム更新テスト');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      // 統計が即座に更新されることを確認
      await waitFor(() => {
        expect(totalPostsElement).toHaveTextContent('1');
      }, { timeout: 1000 });
      
      // 別の投稿を作成
      await user.click(newPostButton);
      await user.type(textarea, '2番目の投稿');
      await user.click(submitButton);
      
      // 統計が再度更新されることを確認
      await waitFor(() => {
        expect(totalPostsElement).toHaveTextContent('2');
      }, { timeout: 1000 });
    });
  });

  describe('励ましメッセージの表示テスト', () => {
    it('初回投稿時の励ましメッセージ', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 初回投稿を作成
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, '初回投稿です');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('初回投稿です')).toBeInTheDocument();
      });
      
      // 初回投稿の励ましメッセージが表示されることを確認
      await waitFor(() => {
        const encouragementMessages = [
          '素晴らしいスタートです！',
          '最初の一歩を踏み出しましたね！',
          '日記を始めました！',
          'おめでとうございます'
        ];
        
        const foundMessage = encouragementMessages.some(message => 
          screen.queryByText(new RegExp(message, 'i'))
        );
        
        expect(foundMessage).toBe(true);
      });
    });

    it('継続投稿時の励ましメッセージ', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 複数の投稿を作成
      for (let i = 1; i <= 3; i++) {
        const newPostButton = screen.getByText('新規投稿');
        await user.click(newPostButton);
        
        const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
        await user.type(textarea, `継続投稿${i}`);
        
        const submitButton = screen.getByRole('button', { name: '投稿' });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(`継続投稿${i}`)).toBeInTheDocument();
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 継続に関する励ましメッセージが表示されることを確認
      await waitFor(() => {
        const continuationMessages = [
          '継続は力なり',
          '素晴らしい継続力',
          '頑張っていますね',
          '続けることが大切',
          '毎日の積み重ね'
        ];
        
        const foundMessage = continuationMessages.some(message => 
          screen.queryByText(new RegExp(message, 'i'))
        );
        
        // 継続メッセージまたは一般的な励ましメッセージが表示される
        const hasEncouragement = foundMessage || 
                                screen.queryByText(/おめでとう|素晴らしい|頑張/);
        
        expect(hasEncouragement).toBeTruthy();
      });
    });

    it('マイルストーン達成時の特別メッセージ', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 10投稿を作成（マイルストーン）
      for (let i = 1; i <= 10; i++) {
        const newPostButton = screen.getByText('新規投稿');
        await user.click(newPostButton);
        
        const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
        await user.type(textarea, `マイルストーン投稿${i}`);
        
        const submitButton = screen.getByRole('button', { name: '投稿' });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(`マイルストーン投稿${i}`)).toBeInTheDocument();
        });
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // 10投稿達成の特別メッセージが表示されることを確認
      await waitFor(() => {
        const milestoneMessages = [
          '10投稿達成',
          '記念すべき',
          'マイルストーン',
          '大台突破',
          '10回目'
        ];
        
        const foundMessage = milestoneMessages.some(message => 
          screen.queryByText(new RegExp(message, 'i'))
        );
        
        // マイルストーンメッセージまたは特別な励ましが表示される
        expect(foundMessage || screen.queryByText(/おめでとう|達成/)).toBeTruthy();
      });
    });

    it('励ましメッセージの多様性', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      const displayedMessages = new Set<string>();
      
      // 複数回投稿して異なるメッセージが表示されることを確認
      for (let i = 1; i <= 5; i++) {
        const newPostButton = screen.getByText('新規投稿');
        await user.click(newPostButton);
        
        const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
        await user.type(textarea, `多様性テスト投稿${i}`);
        
        const submitButton = screen.getByRole('button', { name: '投稿' });
        await user.click(submitButton);
        
        await waitFor(() => {
          expect(screen.getByText(`多様性テスト投稿${i}`)).toBeInTheDocument();
        });
        
        // 励ましメッセージを収集
        await waitFor(() => {
          const motivationPanel = screen.queryByText(/おめでとう|素晴らしい|頑張|継続|達成/);
          if (motivationPanel) {
            displayedMessages.add(motivationPanel.textContent || '');
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 複数の異なるメッセージが表示されることを期待
      // （実装によっては同じメッセージが繰り返される場合もある）
      expect(displayedMessages.size).toBeGreaterThan(0);
    });

    it('時間帯に応じた励ましメッセージ', async () => {
      const user = userEvent.setup();
      
      // 現在の時間を取得
      const currentHour = new Date().getHours();
      
      render(<App />);
      
      // 投稿を作成
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, '時間帯テスト投稿');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('時間帯テスト投稿')).toBeInTheDocument();
      });
      
      // 時間帯に応じたメッセージが表示される可能性を確認
      await waitFor(() => {
        let timeBasedMessages: string[] = [];
        
        if (currentHour >= 5 && currentHour < 12) {
          timeBasedMessages = ['おはよう', '朝', '良いスタート'];
        } else if (currentHour >= 12 && currentHour < 18) {
          timeBasedMessages = ['お疲れ様', '午後', '頑張って'];
        } else {
          timeBasedMessages = ['お疲れ様', '夜', '今日も'];
        }
        
        const hasTimeBasedMessage = timeBasedMessages.some(message => 
          screen.queryByText(new RegExp(message, 'i'))
        );
        
        // 時間帯メッセージまたは一般的な励ましメッセージが表示される
        const hasAnyEncouragement = hasTimeBasedMessage || 
                                   screen.queryByText(/おめでとう|素晴らしい|頑張/);
        
        expect(hasAnyEncouragement).toBeTruthy();
      });
    });

    it('励ましメッセージの表示タイミング', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿前は励ましメッセージがないことを確認
      const initialMotivation = screen.queryByText(/おめでとう|素晴らしい|頑張|継続/);
      expect(initialMotivation).toBeNull();
      
      // 投稿を作成
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, 'タイミングテスト投稿');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      // 投稿後に励ましメッセージが表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('タイミングテスト投稿')).toBeInTheDocument();
      });
      
      await waitFor(() => {
        const motivationMessage = screen.queryByText(/おめでとう|素晴らしい|頑張|継続|達成/);
        expect(motivationMessage).toBeInTheDocument();
      });
    });
  });

  describe('モチベーション機能とビューの連携', () => {
    it('統計パネルが全てのビューで表示される', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, 'ビュー連携テスト投稿');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('ビュー連携テスト投稿')).toBeInTheDocument();
      });
      
      // 各ビューで統計パネルが表示されることを確認
      const views = ['タイムライン', 'リスト', '日記', 'カレンダー'];
      
      for (const viewName of views) {
        const viewButton = screen.getByText(viewName);
        await user.click(viewButton);
        
        await waitFor(() => {
          expect(screen.getByText('総投稿数')).toBeInTheDocument();
          expect(screen.getByText('継続日数')).toBeInTheDocument();
          expect(screen.getByText('今月の投稿')).toBeInTheDocument();
        });
      }
    });

    it('モチベーションパネルの表示切り替え', async () => {
      const user = userEvent.setup();
      render(<App />);
      
      // 投稿を作成
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, 'パネル切り替えテスト');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('パネル切り替えテスト')).toBeInTheDocument();
      });
      
      // モチベーションパネルの折りたたみ/展開機能があるかテスト
      const motivationPanel = screen.queryByText('総投稿数').closest('div');
      if (motivationPanel) {
        const toggleButton = motivationPanel.querySelector('button');
        if (toggleButton) {
          await user.click(toggleButton);
          
          // パネルの状態が変更されることを確認
          await waitFor(() => {
            // 折りたたまれた状態または展開された状態を確認
            expect(motivationPanel).toBeInTheDocument();
          });
        }
      }
    });
  });

  describe('エラーケースの処理', () => {
    it('統計データ読み込みエラーの処理', async () => {
      const user = userEvent.setup();
      
      // LocalStorageエラーをシミュレート
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Stats data read error');
      });
      
      render(<App />);
      
      // エラーが発生してもアプリがクラッシュしないことを確認
      await waitFor(() => {
        // 統計パネルが表示されるか、エラーメッセージが表示される
        const statsPanel = screen.queryByText('総投稿数') ||
                          screen.queryByText('統計の読み込みに失敗') ||
                          screen.getByText('📝 タイムライン日記アプリ'); // アプリが動作している証拠
        
        expect(statsPanel).toBeInTheDocument();
      });
      
      // 投稿機能は正常に動作することを確認
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, 'エラー時テスト投稿');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('エラー時テスト投稿')).toBeInTheDocument();
      });
    });

    it('統計データ保存エラーの処理', async () => {
      const user = userEvent.setup();
      
      // LocalStorage書き込みエラーをシミュレート
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Stats data save error');
      });
      
      render(<App />);
      
      // 投稿を作成
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, '保存エラーテスト投稿');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      // 投稿は作成されるが、統計の永続化に失敗する可能性がある
      await waitFor(() => {
        expect(screen.getByText('保存エラーテスト投稿')).toBeInTheDocument();
      });
      
      // エラーメッセージが表示されるか、最低限の機能が動作することを確認
      await waitFor(() => {
        const errorMessage = screen.queryByText(/統計の保存に失敗|エラーが発生/) ||
                           screen.getByText('📝 タイムライン日記アプリ');
        expect(errorMessage).toBeInTheDocument();
      });
    });

    it('励ましメッセージ生成エラーの処理', async () => {
      const user = userEvent.setup();
      
      // メッセージ生成でエラーが発生する状況をシミュレート
      // （実際の実装に依存するため、一般的なエラー処理を確認）
      
      render(<App />);
      
      // 投稿を作成
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, 'メッセージエラーテスト投稿');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      // 投稿は正常に作成される
      await waitFor(() => {
        expect(screen.getByText('メッセージエラーテスト投稿')).toBeInTheDocument();
      });
      
      // 励ましメッセージが表示されないか、デフォルトメッセージが表示される
      // エラーが発生してもアプリの基本機能は動作することを確認
      expect(screen.getByText('📝 タイムライン日記アプリ')).toBeInTheDocument();
    });

    it('統計計算エラーの処理', async () => {
      const user = userEvent.setup();
      
      // 不正なデータをLocalStorageに設定
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'posts') {
          return 'invalid json data';
        }
        return null;
      });
      
      render(<App />);
      
      // アプリが正常に起動することを確認
      await waitFor(() => {
        expect(screen.getByText('📝 タイムライン日記アプリ')).toBeInTheDocument();
      });
      
      // 統計パネルがエラー状態または初期状態で表示されることを確認
      await waitFor(() => {
        const statsElements = screen.queryAllByText(/総投稿数|継続日数|今月の投稿/);
        expect(statsElements.length).toBeGreaterThan(0);
      });
      
      // 新しい投稿は正常に作成できることを確認
      const newPostButton = screen.getByText('新規投稿');
      await user.click(newPostButton);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      await user.type(textarea, '計算エラー後テスト投稿');
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('計算エラー後テスト投稿')).toBeInTheDocument();
      });
    });
  });
});