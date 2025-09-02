import {
  registerServiceWorker,
  updateServiceWorker,
  checkInstallability,
  promptInstall,
  setupNetworkStatusMonitoring,
  checkPWAFeatures,
  setupPWAMetadata,
} from '../pwaUtils';

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

// グローバルオブジェクトのモック
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

describe('pwaUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerServiceWorker', () => {
    it('Service Workerが正常に登録される', async () => {
      const mockRegistration = {
        installing: null,
        waiting: null,
        active: null,
        addEventListener: jest.fn(),
      };

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      const result = await registerServiceWorker();

      expect(result.isSupported).toBe(true);
      expect(result.isRegistered).toBe(true);
      expect(result.registration).toBe(mockRegistration);
      expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', {
        scope: '/',
      });
    });

    it('Service Workerがサポートされていない場合', async () => {
      // Service Workerを無効化
      const originalServiceWorker = (global as any).navigator.serviceWorker;
      delete (global as any).navigator.serviceWorker;

      const result = await registerServiceWorker();

      expect(result.isSupported).toBe(false);
      expect(result.isRegistered).toBe(false);

      // 元に戻す
      (global as any).navigator.serviceWorker = originalServiceWorker;
    });

    it('Service Worker登録エラーが適切に処理される', async () => {
      const error = new Error('Registration failed');
      mockServiceWorker.register.mockRejectedValue(error);

      const result = await registerServiceWorker();

      expect(result.isSupported).toBe(true);
      expect(result.isRegistered).toBe(false);
      expect(result.error).toBe(error);
    });

    it('Service Worker更新イベントが適切に処理される', async () => {
      const mockNewWorker = {
        state: 'installed',
        addEventListener: jest.fn(),
      };

      const mockRegistration = {
        installing: mockNewWorker,
        waiting: null,
        active: null,
        addEventListener: jest.fn((event, callback) => {
          if (event === 'updatefound') {
            // updatefoundイベントをシミュレート
            setTimeout(() => callback(), 0);
          }
        }),
      };

      mockServiceWorker.register.mockResolvedValue(mockRegistration);

      // showUpdateAvailableNotificationのモック
      const mockDispatchEvent = jest.fn();
      Object.defineProperty(window, 'dispatchEvent', {
        value: mockDispatchEvent,
        writable: true,
      });

      await registerServiceWorker();

      // updatefoundイベントの処理を待つ
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockRegistration.addEventListener).toHaveBeenCalledWith(
        'updatefound',
        expect.any(Function)
      );
    });
  });

  describe('updateServiceWorker', () => {
    it('Service Workerが正常に更新される', async () => {
      const mockWaiting = {
        postMessage: jest.fn(),
      };

      const mockRegistration = {
        waiting: mockWaiting,
      };

      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

      // location.reloadのモック
      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      await updateServiceWorker();

      expect(mockWaiting.postMessage).toHaveBeenCalledWith({
        type: 'SKIP_WAITING',
      });
      expect(mockReload).toHaveBeenCalled();
    });

    it('Service Workerがサポートされていない場合は何もしない', async () => {
      // Service Workerを無効化
      const originalServiceWorker = (global as any).navigator.serviceWorker;
      delete (global as any).navigator.serviceWorker;

      await updateServiceWorker();

      // エラーが発生しないことを確認
      expect(true).toBe(true);

      // 元に戻す
      (global as any).navigator.serviceWorker = originalServiceWorker;
    });

    it('待機中のService Workerがない場合は何もしない', async () => {
      const mockRegistration = {
        waiting: null,
      };

      mockServiceWorker.getRegistration.mockResolvedValue(mockRegistration);

      const mockReload = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });

      await updateServiceWorker();

      expect(mockReload).not.toHaveBeenCalled();
    });
  });

  describe('checkInstallability', () => {
    it('インストール可能な場合にtrueを返す', async () => {
      const promise = checkInstallability();

      // beforeinstallpromptイベントをシミュレート
      setTimeout(() => {
        const event = new Event('beforeinstallprompt');
        event.preventDefault = jest.fn();
        window.dispatchEvent(event);
      }, 100);

      const result = await promise;
      expect(result).toBe(true);
    });

    it('インストール不可能な場合にfalseを返す', async () => {
      const result = await checkInstallability();
      expect(result).toBe(false);
    });
  });

  describe('promptInstall', () => {
    it('インストールプロンプトが正常に動作する', async () => {
      const mockPrompt = jest.fn();
      const mockUserChoice = Promise.resolve({ outcome: 'accepted' });

      const mockDeferredPrompt = {
        prompt: mockPrompt,
        userChoice: mockUserChoice,
      };

      (global as any).window.deferredPrompt = mockDeferredPrompt;

      const result = await promptInstall();

      expect(mockPrompt).toHaveBeenCalled();
      expect(result).toBe(true);
      expect((global as any).window.deferredPrompt).toBeNull();
    });

    it('ユーザーがインストールを拒否した場合', async () => {
      const mockPrompt = jest.fn();
      const mockUserChoice = Promise.resolve({ outcome: 'dismissed' });

      const mockDeferredPrompt = {
        prompt: mockPrompt,
        userChoice: mockUserChoice,
      };

      (global as any).window.deferredPrompt = mockDeferredPrompt;

      const result = await promptInstall();

      expect(result).toBe(false);
    });

    it('deferredPromptが利用できない場合', async () => {
      (global as any).window.deferredPrompt = null;

      const result = await promptInstall();

      expect(result).toBe(false);
    });

    it('プロンプトエラーが適切に処理される', async () => {
      const mockDeferredPrompt = {
        prompt: jest.fn().mockRejectedValue(new Error('Prompt failed')),
        userChoice: Promise.resolve({ outcome: 'dismissed' }),
      };

      (global as any).window.deferredPrompt = mockDeferredPrompt;

      const result = await promptInstall();

      expect(result).toBe(false);
    });
  });

  describe('setupNetworkStatusMonitoring', () => {
    it('ネットワーク状態の監視が正常に設定される', () => {
      const onOnline = jest.fn();
      const onOffline = jest.fn();

      const cleanup = setupNetworkStatusMonitoring(onOnline, onOffline);

      expect(mockWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));

      // 初期状態でonOnlineが呼ばれることを確認
      expect(onOnline).toHaveBeenCalled();

      // クリーンアップ関数の動作確認
      cleanup();

      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
    });

    it('オフライン状態での初期化', () => {
      // オフライン状態をシミュレート
      const originalOnLine = mockNavigator.onLine;
      mockNavigator.onLine = false;

      const onOnline = jest.fn();
      const onOffline = jest.fn();

      setupNetworkStatusMonitoring(onOnline, onOffline);

      // 初期状態でonOfflineが呼ばれることを確認
      expect(onOffline).toHaveBeenCalled();

      // 元に戻す
      mockNavigator.onLine = originalOnLine;
    });
  });

  describe('checkPWAFeatures', () => {
    it('PWA機能のサポート状況を正しく検出する', () => {
      const features = checkPWAFeatures();

      expect(features).toEqual({
        serviceWorker: true,
        pushNotifications: false,
        notifications: false,
        backgroundSync: false,
        installPrompt: false,
        webShare: false,
        fullscreen: true,
      });
    });

    it('すべての機能がサポートされている場合', () => {
      // 各機能をモック
      (global as any).window.PushManager = class {};
      (global as any).window.Notification = class {};
      (global as any).window.ServiceWorkerRegistration = {
        prototype: { sync: {} },
      };
      (global as any).window.BeforeInstallPromptEvent = class {};
      (global as any).navigator.share = jest.fn();

      const features = checkPWAFeatures();

      expect(features.pushNotifications).toBe(true);
      expect(features.notifications).toBe(true);
      expect(features.backgroundSync).toBe(true);
      expect(features.installPrompt).toBe(true);
      expect(features.webShare).toBe(true);

      // クリーンアップ
      delete (global as any).window.PushManager;
      delete (global as any).window.Notification;
      delete (global as any).window.ServiceWorkerRegistration;
      delete (global as any).window.BeforeInstallPromptEvent;
      delete (global as any).navigator.share;
    });
  });

  describe('setupPWAMetadata', () => {
    it('PWAメタデータが正しく設定される', () => {
      const mockElements = {
        manifest: { rel: '', href: '' },
        themeColor: { name: '', content: '' },
        appleCapable: { name: '', content: '' },
        appleStatusBar: { name: '', content: '' },
        appleTitle: { name: '', content: '' },
      };

      let elementIndex = 0;
      const elementTypes = Object.keys(mockElements);

      mockDocument.createElement.mockImplementation(() => {
        const elementType = elementTypes[elementIndex % elementTypes.length];
        elementIndex++;
        return mockElements[elementType as keyof typeof mockElements];
      });

      setupPWAMetadata();

      expect(mockDocument.createElement).toHaveBeenCalledTimes(5);
      expect(mockDocument.head.appendChild).toHaveBeenCalledTimes(5);

      // マニフェストリンクの設定確認
      expect(mockElements.manifest.rel).toBe('manifest');
      expect(mockElements.manifest.href).toBe('/manifest.json');

      // テーマカラーの設定確認
      expect(mockElements.themeColor.name).toBe('theme-color');
      expect(mockElements.themeColor.content).toBe('#3b82f6');

      // Apple PWAメタタグの設定確認
      expect(mockElements.appleCapable.name).toBe('apple-mobile-web-app-capable');
      expect(mockElements.appleCapable.content).toBe('yes');

      expect(mockElements.appleStatusBar.name).toBe('apple-mobile-web-app-status-bar-style');
      expect(mockElements.appleStatusBar.content).toBe('default');

      expect(mockElements.appleTitle.name).toBe('apple-mobile-web-app-title');
      expect(mockElements.appleTitle.content).toBe('TimelineMemo');
    });
  });
});