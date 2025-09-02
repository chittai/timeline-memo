/**
 * PWA関連のユーティリティ関数
 */

// Service Worker登録の状態
export interface ServiceWorkerRegistrationState {
  isSupported: boolean;
  isRegistered: boolean;
  registration?: ServiceWorkerRegistration;
  error?: Error;
}

/**
 * Service Workerを登録する
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistrationState> => {
  // Service Workerがサポートされているかチェック
  if (!('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Workerはサポートされていません');
    return {
      isSupported: false,
      isRegistered: false,
    };
  }

  try {
    console.log('[PWA] Service Worker登録を開始...');
    
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker登録成功:', registration);

    // 更新チェック
    registration.addEventListener('updatefound', () => {
      console.log('[PWA] Service Workerの更新が見つかりました');
      
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] 新しいService Workerがインストールされました');
            // ユーザーに更新を通知する処理をここに追加
            showUpdateAvailableNotification();
          }
        });
      }
    });

    return {
      isSupported: true,
      isRegistered: true,
      registration,
    };
  } catch (error) {
    console.error('[PWA] Service Worker登録エラー:', error);
    return {
      isSupported: true,
      isRegistered: false,
      error: error as Error,
    };
  }
};

/**
 * Service Workerの更新を適用する
 */
export const updateServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration && registration.waiting) {
    console.log('[PWA] Service Workerの更新を適用中...');
    
    // 新しいService Workerに切り替えを指示
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // ページをリロード
    window.location.reload();
  }
};

/**
 * アプリのインストール可能性をチェック
 */
export const checkInstallability = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // beforeinstallpromptイベントをリッスン
    let deferredPrompt: any = null;
    
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('[PWA] アプリはインストール可能です');
      e.preventDefault();
      deferredPrompt = e;
      resolve(true);
    });
    
    // タイムアウト後にfalseを返す
    setTimeout(() => {
      if (!deferredPrompt) {
        resolve(false);
      }
    }, 1000);
  });
};

/**
 * アプリのインストールを促す
 */
export const promptInstall = async (): Promise<boolean> => {
  // beforeinstallpromptイベントが発生していない場合は何もしない
  const deferredPrompt = (window as any).deferredPrompt;
  if (!deferredPrompt) {
    console.warn('[PWA] インストールプロンプトは利用できません');
    return false;
  }

  try {
    // インストールプロンプトを表示
    deferredPrompt.prompt();
    
    // ユーザーの選択を待つ
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] ユーザーの選択:', outcome);
    
    // プロンプトをクリア
    (window as any).deferredPrompt = null;
    
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] インストールプロンプトエラー:', error);
    return false;
  }
};

/**
 * オンライン/オフライン状態を監視
 */
export const setupNetworkStatusMonitoring = (
  onOnline: () => void,
  onOffline: () => void
): (() => void) => {
  const handleOnline = () => {
    console.log('[PWA] オンラインになりました');
    onOnline();
  };
  
  const handleOffline = () => {
    console.log('[PWA] オフラインになりました');
    onOffline();
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // 初期状態をチェック
  if (navigator.onLine) {
    onOnline();
  } else {
    onOffline();
  }
  
  // クリーンアップ関数を返す
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * 更新通知を表示
 */
const showUpdateAvailableNotification = (): void => {
  // トースト通知やモーダルで更新を通知
  const event = new CustomEvent('sw-update-available');
  window.dispatchEvent(event);
};

/**
 * PWAの機能をチェック
 */
export const checkPWAFeatures = () => {
  const features = {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    notifications: 'Notification' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    installPrompt: 'BeforeInstallPromptEvent' in window,
    webShare: 'share' in navigator,
    fullscreen: 'requestFullscreen' in document.documentElement,
  };
  
  console.log('[PWA] サポートされている機能:', features);
  return features;
};

/**
 * アプリのメタデータを設定
 */
export const setupPWAMetadata = (): void => {
  // マニフェストリンクを追加
  const manifestLink = document.createElement('link');
  manifestLink.rel = 'manifest';
  manifestLink.href = '/manifest.json';
  document.head.appendChild(manifestLink);
  
  // テーマカラーを設定
  const themeColorMeta = document.createElement('meta');
  themeColorMeta.name = 'theme-color';
  themeColorMeta.content = '#3b82f6';
  document.head.appendChild(themeColorMeta);
  
  // Apple用のメタタグを設定
  const appleCapableMeta = document.createElement('meta');
  appleCapableMeta.name = 'apple-mobile-web-app-capable';
  appleCapableMeta.content = 'yes';
  document.head.appendChild(appleCapableMeta);
  
  const appleStatusBarMeta = document.createElement('meta');
  appleStatusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
  appleStatusBarMeta.content = 'default';
  document.head.appendChild(appleStatusBarMeta);
  
  const appleTitleMeta = document.createElement('meta');
  appleTitleMeta.name = 'apple-mobile-web-app-title';
  appleTitleMeta.content = 'TimelineMemo';
  document.head.appendChild(appleTitleMeta);
};