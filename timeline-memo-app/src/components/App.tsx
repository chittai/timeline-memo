import { useEffect } from 'react';
import MainLayout from './MainLayout';
import { ToastContainer } from './ToastContainer';
import { LoadingOverlay } from './LoadingOverlay';
import { useDataPersistence } from '../hooks/useDataPersistence';
import { useAppContext } from '../context/AppContext';
import { usePWA } from '../hooks/usePWA';
import './App.css';

/**
 * アプリケーション初期化コンポーネント
 * データ永続化とオフライン対応の初期化を担当
 */
function AppInitializer() {
  const { state } = useAppContext();
  const {
    loadInitialData,
    handleOfflineStatus,
    handleVisibilityChange,
    handleBeforeUnload
  } = useDataPersistence();
  
  // PWA機能の初期化
  const {
    serviceWorker,
    isUpdateAvailable,
    isInstallable,
    isOnline,
    updateApp,
    installApp
  } = usePWA();

  // アプリケーション初期化
  useEffect(() => {
    console.log('[App初期化] アプリケーションを初期化しています...');
    
    // データの復元
    loadInitialData();

    // オフライン状態の監視を開始
    const cleanupOfflineHandler = handleOfflineStatus();
    
    // ページ可視性変化の監視を開始
    const cleanupVisibilityHandler = handleVisibilityChange();
    
    // ブラウザ終了時の処理を設定
    const cleanupBeforeUnloadHandler = handleBeforeUnload();

    // クリーンアップ
    return () => {
      cleanupOfflineHandler();
      cleanupVisibilityHandler();
      cleanupBeforeUnloadHandler();
    };
  }, [loadInitialData, handleOfflineStatus, handleVisibilityChange, handleBeforeUnload]);

  // 初期ローディング状態の表示
  if (state.loading.isLoading && state.posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {state.loading.operation || 'データを読み込んでいます...'}
          </p>
          {typeof state.loading.progress === 'number' && (
            <div className="w-48 bg-gray-200 rounded-full h-2 mt-4 mx-auto">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.loading.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // エラー状態の表示
  if (state.error && state.posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            データの読み込みに失敗しました
          </h2>
          <p className="text-gray-600 mb-4">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <MainLayout>
        <div>
          {/* PWA関連の通知 */}
          
          {/* アプリ更新通知 */}
          {isUpdateAvailable && (
            <div className="fixed top-4 right-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded z-50 max-w-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">🔄</span>
                  <span className="text-sm">新しいバージョンが利用可能です</span>
                </div>
                <button
                  onClick={updateApp}
                  className="ml-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                >
                  更新
                </button>
              </div>
            </div>
          )}
          
          {/* アプリインストール通知 */}
          {isInstallable && (
            <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 max-w-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">📱</span>
                  <span className="text-sm">アプリをインストールできます</span>
                </div>
                <button
                  onClick={installApp}
                  className="ml-2 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                >
                  インストール
                </button>
              </div>
            </div>
          )}
          
          {/* オフライン状態の通知 */}
          {!isOnline && (
            <div className="fixed top-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded z-50">
              <div className="flex items-center">
                <span className="mr-2">📱</span>
                <span>オフラインモードで動作中</span>
              </div>
            </div>
          )}
          
          {/* Service Worker状態の表示（開発環境のみ） */}
          {process.env.NODE_ENV === 'development' && serviceWorker.isSupported && (
            <div className="fixed bottom-4 left-4 bg-gray-100 border border-gray-300 text-gray-700 px-3 py-2 rounded text-xs z-40">
              SW: {serviceWorker.isRegistered ? '✅ 登録済み' : '❌ 未登録'}
            </div>
          )}
        </div>
      </MainLayout>
      
      {/* ローディングオーバーレイ */}
      <LoadingOverlay loading={state.loading} />
      
      {/* トースト通知コンテナ */}
      <ToastContainer />
    </div>
  );
}

/**
 * メインアプリケーションコンポーネント
 * AppProviderでラップしてAppInitializerを呼び出す
 */
function App() {
  return <AppInitializer />;
}

export default App;