import { AppProvider } from './context/AppContext';

/**
 * シンプルなアプリケーションコンポーネント
 */
function SimpleApp() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              📝 タイムライン日記アプリ
            </h1>
            <div className="text-sm text-gray-500">
              v1.0.0
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側: メインコンテンツエリア */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                🎉 アプリケーションが正常に動作しています
              </h2>
              <div className="space-y-4">
                <p className="text-gray-600">
                  タイムライン日記アプリへようこそ！現在、基本的な表示機能が動作しています。
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    📋 現在の状態
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✅ アプリケーションの基本構造</li>
                    <li>✅ レスポンシブデザイン</li>
                    <li>✅ TypeScriptビルド</li>
                    <li>🔄 機能の段階的復元準備中</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 右側: サイドバー */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                📊 統計情報
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">総投稿数</span>
                  <span className="font-semibold text-gray-900">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">継続日数</span>
                  <span className="font-semibold text-gray-900">0日</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">今月の投稿</span>
                  <span className="font-semibold text-gray-900">0</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🚀 次のステップ
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 投稿機能の復元</p>
                <p>• カレンダー表示の復元</p>
                <p>• 統計機能の復元</p>
                <p>• PWA機能の復元</p>
              </div>
            </div>
          </div>
        </div>
      </main>
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