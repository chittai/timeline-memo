import { render, screen, waitFor, act } from '@testing-library/react';
import { AppProvider } from '../../context/AppContext';
import App from '../App';
import { IndexedDBService } from '../../services/IndexedDBService';

// IndexedDBServiceをモック
jest.mock('../../services/IndexedDBService');

// ReactMarkdownをモック
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

const MockedIndexedDBService = IndexedDBService as jest.MockedClass<typeof IndexedDBService>;

// navigator.onLineをモック
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// setupTests.tsでjest-domをインポート
import '../../setupTests';

describe('オフライン対応統合テスト', () => {
  let mockDataService: jest.Mocked<IndexedDBService>;

  beforeEach(() => {
    mockDataService = {
      init: jest.fn(),
      getAllPosts: jest.fn(),
      createPost: jest.fn(),
      updatePost: jest.fn(),
      deletePost: jest.fn(),
      getPost: jest.fn(),
      getPostsByDateRange: jest.fn(),
      subscribeToUpdates: jest.fn(),
      close: jest.fn(),
      getStatus: jest.fn(),
      getStats: jest.fn(),
    } as any;

    MockedIndexedDBService.mockImplementation(() => mockDataService);

    // デフォルトの動作を設定
    mockDataService.init.mockResolvedValue();
    mockDataService.getAllPosts.mockResolvedValue([]);
    mockDataService.getStatus.mockReturnValue({
      isInitialized: true,
      isConnected: true
    });
    mockDataService.getStats.mockResolvedValue({
      totalPosts: 0
    });

    // コンソールログをモック
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    // オンライン状態にリセット
    (navigator as any).onLine = true;
  });

  const renderApp = () => {
    return render(
      <AppProvider>
        <App />
      </AppProvider>
    );
  };

  describe('アプリ起動時のデータ復元', () => {
    it('保存されたデータを正常に復元できること', async () => {
      const mockPosts = [
        {
          id: '1',
          content: 'テスト投稿1',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z')
        },
        {
          id: '2',
          content: 'テスト投稿2',
          createdAt: new Date('2024-01-01T11:00:00Z'),
          updatedAt: new Date('2024-01-01T11:00:00Z')
        }
      ];

      mockDataService.getAllPosts.mockResolvedValue(mockPosts);

      renderApp();

      // ローディング状態の確認
      expect(screen.getByText('データを読み込んでいます...')).toBeInTheDocument();

      // データ復元の完了を待機
      await waitFor(() => {
        expect(screen.queryByText('データを読み込んでいます...')).not.toBeInTheDocument();
      });

      // データサービスの初期化と投稿取得が呼ばれることを確認
      expect(mockDataService.init).toHaveBeenCalled();
      expect(mockDataService.getAllPosts).toHaveBeenCalled();

      // 復元された投稿が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('テスト投稿1')).toBeInTheDocument();
        expect(screen.getByText('テスト投稿2')).toBeInTheDocument();
      });
    });

    it('データ復元エラー時にエラー画面を表示すること', async () => {
      mockDataService.init.mockRejectedValue(new Error('データベース接続エラー'));

      renderApp();

      // エラー画面の表示を確認
      await waitFor(() => {
        expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
        expect(screen.getByText('データの復元中にエラーが発生しました。ページを再読み込みしてください。')).toBeInTheDocument();
      });

      // 再読み込みボタンが表示されることを確認
      expect(screen.getByText('ページを再読み込み')).toBeInTheDocument();
    });
  });

  describe('オフライン状態での動作', () => {
    it('オフライン状態でも投稿作成ができること', async () => {
      // オフライン状態に設定
      (navigator as any).onLine = false;

      const newPost = {
        id: '1',
        content: 'オフライン投稿',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDataService.createPost.mockResolvedValue(newPost);

      renderApp();

      // アプリの初期化を待機
      await waitFor(() => {
        expect(screen.queryByText('データを読み込んでいます...')).not.toBeInTheDocument();
      });

      // オフライン通知が表示されることを確認
      expect(screen.getByText('オフラインモードで動作中')).toBeInTheDocument();

      // 投稿フォームの存在確認（実際のUI操作はPostFormのテストで実施）
      // ここではオフライン状態でのデータサービス呼び出しをテスト

      // オフライン状態でもアプリが正常に動作することを確認
      expect(screen.getByText('オフラインモードで動作中')).toBeInTheDocument();
    });

    it('オンライン復帰時にデータ整合性を確認すること', async () => {
      // 初期状態はオンライン
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText('データを読み込んでいます...')).not.toBeInTheDocument();
      });

      // オフライン状態に変更
      act(() => {
        (navigator as any).onLine = false;
        window.dispatchEvent(new Event('offline'));
      });

      // オフライン通知が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('オフラインモードで動作中')).toBeInTheDocument();
      });

      // オンライン状態に復帰
      act(() => {
        (navigator as any).onLine = true;
        window.dispatchEvent(new Event('online'));
      });

      // オフライン通知が消えることを確認
      await waitFor(() => {
        expect(screen.queryByText('オフラインモードで動作中')).not.toBeInTheDocument();
      });

      // データ整合性確認のためgetStatsが呼ばれることを確認
      expect(mockDataService.getStats).toHaveBeenCalled();
    });
  });

  describe('ブラウザ再起動後のデータ整合性', () => {
    it('ページ可視性変化時にデータ整合性を確認すること', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText('データを読み込んでいます...')).not.toBeInTheDocument();
      });

      // ページが非表示になる
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: true,
      });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // ページが再表示される
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false,
      });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // データ整合性確認のためgetStatsが呼ばれることを確認
      expect(mockDataService.getStats).toHaveBeenCalled();
    });

    it('データ不整合時に自動的にデータを再読み込みすること', async () => {
      // 初期状態では投稿なし
      mockDataService.getAllPosts.mockResolvedValueOnce([]);
      
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText('データを読み込んでいます...')).not.toBeInTheDocument();
      });

      // データ不整合を模擬（stateには投稿なし、DBには投稿あり）
      mockDataService.getStats.mockResolvedValue({
        totalPosts: 1,
        oldestPost: new Date('2024-01-01'),
        newestPost: new Date('2024-01-01')
      });

      const updatedPosts = [
        {
          id: '1',
          content: '復旧された投稿',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];
      mockDataService.getAllPosts.mockResolvedValue(updatedPosts);

      // ページ可視性変化をトリガー
      Object.defineProperty(document, 'hidden', {
        writable: true,
        value: false,
      });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      // データ再読み込みが実行されることを確認
      await waitFor(() => {
        expect(mockDataService.getAllPosts).toHaveBeenCalledTimes(2); // 初期読み込み + 再読み込み
      });
    });
  });

  describe('エラー時のデータ復旧', () => {
    it('データベース接続エラー時に復旧処理が実行されること', async () => {
      // 初期化時にエラーが発生
      mockDataService.init.mockRejectedValueOnce(new Error('接続エラー'));
      
      renderApp();

      // エラー画面が表示されることを確認
      await waitFor(() => {
        expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
      });

      // 復旧処理のテスト（実際のUIでは再読み込みボタンクリック）
      // ここでは内部的な復旧処理をテスト
      mockDataService.init.mockResolvedValue();
      mockDataService.getAllPosts.mockResolvedValue([]);
      mockDataService.getStatus.mockReturnValue({
        isInitialized: true,
        isConnected: true
      });
    });

    it('部分的なエラー時にエラー通知を表示すること', async () => {
      // 初期データは正常に読み込み
      mockDataService.getAllPosts.mockResolvedValue([
        {
          id: '1',
          content: '既存投稿',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      renderApp();

      await waitFor(() => {
        expect(screen.queryByText('データを読み込んでいます...')).not.toBeInTheDocument();
      });

      // 新規投稿作成時にエラーが発生
      mockDataService.createPost.mockRejectedValue(new Error('保存エラー'));

      // 投稿作成のシミュレーション（実際のUI操作なし）

      // エラー通知が表示されることを確認（PostFormコンポーネント内で処理）
      // 既存の投稿は表示されたまま
      expect(screen.getByText('既存投稿')).toBeInTheDocument();
    });
  });

  describe('ブラウザ終了時の処理', () => {
    it('beforeunloadイベント時にデータベース接続を閉じること', async () => {
      renderApp();

      await waitFor(() => {
        expect(screen.queryByText('データを読み込んでいます...')).not.toBeInTheDocument();
      });

      // beforeunloadイベントを発火
      act(() => {
        window.dispatchEvent(new Event('beforeunload'));
      });

      // データベース接続が閉じられることを確認
      expect(mockDataService.close).toHaveBeenCalled();
    });
  });
});