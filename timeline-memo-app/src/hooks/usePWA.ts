import { useState, useEffect, useCallback } from 'react';
import {
  registerServiceWorker,
  updateServiceWorker,
  checkInstallability,
  promptInstall,
  setupNetworkStatusMonitoring,
  checkPWAFeatures,
  setupPWAMetadata,
  type ServiceWorkerRegistrationState,
} from '../utils/pwaUtils';

export interface PWAState {
  // Service Worker関連
  serviceWorker: ServiceWorkerRegistrationState;
  isUpdateAvailable: boolean;
  
  // インストール関連
  isInstallable: boolean;
  isInstalled: boolean;
  
  // ネットワーク状態
  isOnline: boolean;
  
  // PWA機能サポート
  features: ReturnType<typeof checkPWAFeatures>;
}

export interface PWAActions {
  // Service Worker操作
  updateApp: () => Promise<void>;
  
  // インストール操作
  installApp: () => Promise<boolean>;
  
  // 手動でのオンライン/オフライン状態更新
  refreshNetworkStatus: () => void;
}

/**
 * PWA機能を管理するカスタムフック
 */
export const usePWA = (): PWAState & PWAActions => {
  const [serviceWorker, setServiceWorker] = useState<ServiceWorkerRegistrationState>({
    isSupported: false,
    isRegistered: false,
  });
  
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [features] = useState(() => checkPWAFeatures());

  // Service Workerの初期化
  useEffect(() => {
    const initializeServiceWorker = async () => {
      try {
        const swState = await registerServiceWorker();
        setServiceWorker(swState);
        
        if (swState.isRegistered) {
          console.log('[PWA Hook] Service Worker登録完了');
        }
      } catch (error) {
        console.error('[PWA Hook] Service Worker初期化エラー:', error);
      }
    };

    initializeServiceWorker();
  }, []);

  // PWAメタデータの設定
  useEffect(() => {
    setupPWAMetadata();
  }, []);

  // インストール可能性のチェック
  useEffect(() => {
    const checkInstall = async () => {
      const installable = await checkInstallability();
      setIsInstallable(installable);
    };

    checkInstall();

    // beforeinstallpromptイベントをリッスン
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // アプリがインストールされた時の処理
    const handleAppInstalled = () => {
      console.log('[PWA Hook] アプリがインストールされました');
      setIsInstalled(true);
      setIsInstallable(false);
      (window as any).deferredPrompt = null;
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // ネットワーク状態の監視
  useEffect(() => {
    const cleanup = setupNetworkStatusMonitoring(
      () => setIsOnline(true),
      () => setIsOnline(false)
    );

    return cleanup;
  }, []);

  // Service Worker更新の監視
  useEffect(() => {
    const handleUpdateAvailable = () => {
      console.log('[PWA Hook] アプリの更新が利用可能です');
      setIsUpdateAvailable(true);
    };

    window.addEventListener('sw-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
    };
  }, []);

  // アプリの更新
  const updateApp = useCallback(async () => {
    try {
      await updateServiceWorker();
      setIsUpdateAvailable(false);
    } catch (error) {
      console.error('[PWA Hook] アプリ更新エラー:', error);
    }
  }, []);

  // アプリのインストール
  const installApp = useCallback(async (): Promise<boolean> => {
    try {
      const installed = await promptInstall();
      if (installed) {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      return installed;
    } catch (error) {
      console.error('[PWA Hook] アプリインストールエラー:', error);
      return false;
    }
  }, []);

  // ネットワーク状態の手動更新
  const refreshNetworkStatus = useCallback(() => {
    setIsOnline(navigator.onLine);
  }, []);

  return {
    // 状態
    serviceWorker,
    isUpdateAvailable,
    isInstallable,
    isInstalled,
    isOnline,
    features,
    
    // アクション
    updateApp,
    installApp,
    refreshNetworkStatus,
  };
};