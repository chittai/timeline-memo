import { useEffect, useState } from 'react';
import { AppProvider } from './context/AppContext';
import MainLayout from './components/MainLayout';
import { ToastContainer } from './components/ToastContainer';
import { LoadingOverlay } from './components/LoadingOverlay';
import { useAppContext } from './context/AppContext';

/**
 * アプリケーション初期化コンポーネント（簡素版）
 */
function AppInitializer() {
  const { state } = useAppContext();
  const [isInitialized, setIsInitialized] = useState(false);

  // 簡単な初期化処理
  useEffect(() => {
    console.log('[App初期化] アプリケーションを初期化しています...');
    
    // 簡単な初期化処理
    setTimeout(() => {
      setIsInitialized(true);
      console.log('[App初期化] 初期化完了');
    }, 1000);
  }, []);

  // 初期化中の表示
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">アプリケーションを初期化しています...</p>
        </div>
      </div>
    );
  }

  // エラー状態の表示
  if (state.error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            エラーが発生しました
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
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            タイムライン日記アプリ
          </h1>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600">
              アプリケーションが正常に動作しています。
            </p>
            <p className="text-sm text-gray-500 mt-2">
              メイン機能を段階的に復元中です。
            </p>
          </div>
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
 */
function App() {
  return <AppInitializer />;
}

function AppRoot() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

export default AppRoot;