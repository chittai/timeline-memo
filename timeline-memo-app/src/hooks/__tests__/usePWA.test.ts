import { renderHook, act } from '@testing-library/react';
import { usePWA } from '../usePWA';

// Service Worker APIのモック
const mockServiceWorker = {
  register: jest.fn(),
  getRegistration: jest.fn(),
};

// Navigator APIのモック
const mockNavigator = {
  serviceWorker: mockServiceWorker,
  onLine: true,
};

// Window APIのモック
const mockWindow = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

// グローバルオブジェクトのモック
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

// Document APIのモック
const mockDocument = {
  head: {
    appendChild: jest.fn(),
  },
  createElement: jest.fn(() => ({
    rel: '',
    href: '',
    name: '',
    content: '',
  })),
  documentElement: {
    requestFullscreen: jest.fn(),
  },
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

describe('usePWA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Service Worker登録の成功をモック
    mockServiceWorker.register.mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: jest.fn(),
    });
  });

  describe('初期化', () => {
    it('Service Workerが正常に登録される', async () => {
      const { result } = renderHook(() => usePWA());

      // 初期状態の確認
      expect(result.current.serviceWorker.isSupported).toBe(true);
      
      // Service Worker登録の確認
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
      });
    });

    it('Service Workerがサポートされていない場合の処理', () => {
      // Service Workerを無効化
      const originalServiceWorker = (global as any).navigator.serviceWorker;
      delete (global as any).navigator.serviceWorker;

      const { result } = renderHook(() => usePWA());

      expect(result.current.serviceWorker.isSupported).toBe(false);
      expect(result.current.serviceWorker.isRegistered).toBe(false);

      // 元に戻す
      (global as any).navigator.serviceWorker = originalServiceWorker;
    });
  });

  describe('ネットワーク状態', () => {
    it('初期のオンライン状態が正しく設定される', () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.isOnline).toBe(true);
    });

    it('ネットワーク状態の変更が検出される', () => {
      const { result } = renderHook(() => usePWA());

      // オフラインイベントをシミュレート
      act(() => {
        mockNavigator.onLine = false;
        result.current.refreshNetworkStatus();
      });

      expect(result.current.isOnline).toBe(false);

      // オンラインイベントをシミュレート
      act(() => {
        mockNavigator.onLine = true;
        result.current.refreshNetworkStatus();
      });

      expect(result.current.isOnline).toBe(true);
    });
  });

  describe('PWA機能', () => {
    it('PWA機能のサポート状況が正しく検出される', () => {
      const { result } = renderHook(() => usePWA());

      expect(result.current.features).toEqual({
        serviceWorker: true,
        pushNotifications: false, // PushManagerが定義されていないため
        notifications: false, // Notificationが定義されていないため
        backgroundSync: false,
        installPrompt: false,
        webShare: false,
        fullscreen: true,
      });
    });

    it('アプリの更新機能が動作する', async () => {
      const mockRegistration = {
        waiting: {
          postMessage: jest.fn(),
        },
      };

      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

      // location.reloadのモック
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      const { result } = renderHook(() => usePWA());

      await act(async () => {
        await result.current.updateApp();
      });

      expect(mockRegistration.waiting.postMessage).toHaveBeenCalledWith({
        type: 'SKIP_WAITING',
      });
      expect(mockReload).toHaveBeenCalled();
    });

    it('インストール機能が動作する', async () => {
      const mockPrompt = jest.fn();
      const mockUserChoice = Promise.resolve({ outcome: 'accepted' });

      // beforeinstallpromptイベントをモック
      const mockDeferredPrompt = {
        prompt: mockPrompt,
        userChoice: mockUserChoice,
      };

      (global as any).window.deferredPrompt = mockDeferredPrompt;

      const { result } = renderHook(() => usePWA());

      const installed = await act(async () => {
        return await result.current.installApp();
      });

      expect(mockPrompt).toHaveBeenCalled();
      expect(installed).toBe(true);
      expect((global as any).window.deferredPrompt).toBeNull();
    });

    it('インストールプロンプトが利用できない場合の処理', async () => {
      (global as any).window.deferredPrompt = null;

      const { result } = renderHook(() => usePWA());

      const installed = await act(async () => {
        return await result.current.installApp();
      });

      expect(installed).toBe(false);
    });
  });

  describe('更新通知', () => {
    it('Service Worker更新時に通知が表示される', () => {
      const { result } = renderHook(() => usePWA());

      // 更新通知イベントをシミュレート
      act(() => {
        const event = new CustomEvent('sw-update-available');
        window.dispatchEvent(event);
      });

      expect(result.current.isUpdateAvailable).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    it('Service Worker登録エラーが適切に処理される', async () => {
      const error = new Error('Service Worker registration failed');
      mockServiceWorker.register.mockRejectedValue(error);

      const { result } = renderHook(() => usePWA());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.serviceWorker.isSupported).toBe(true);
      expect(result.current.serviceWorker.isRegistered).toBe(false);
      expect(result.current.serviceWorker.error).toEqual(error);
    });

    it('アプリ更新エラーが適切に処理される', async () => {
      mockServiceWorker.getRegistration.mockRejectedValue(
        new Error('Failed to get registration')
      );

      const { result } = renderHook(() => usePWA());

      await act(async () => {
        await result.current.updateApp();
      });

      // エラーが発生してもアプリがクラッシュしないことを確認
      expect(result.current.isUpdateAvailable).toBe(false);
    });

    it('インストールエラーが適切に処理される', async () => {
      const mockDeferredPrompt = {
        prompt: jest.fn().mockRejectedValue(new Error('Install failed')),
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      };

      (global as any).window.deferredPrompt = mockDeferredPrompt;

      const { result } = renderHook(() => usePWA());

      const installed = await act(async () => {
        return await result.current.installApp();
      });

      expect(installed).toBe(false);
    });
  });
});