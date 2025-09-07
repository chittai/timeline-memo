import { AppProvider } from './context/AppContext';

// 簡単なテスト用コンポーネント
function SimpleApp() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          タイムライン日記アプリ
        </h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600">
            アプリケーションが正常に読み込まれました。
          </p>
          <p className="text-sm text-gray-500 mt-2">
            現在、基本的な表示テストを実行中です。
          </p>
        </div>
      </div>
    </div>
  );
}

function AppRoot() {
  return (
    <AppProvider>
      <SimpleApp />
    </AppProvider>
  );
}

export default AppRoot;