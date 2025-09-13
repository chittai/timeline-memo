import React from 'react';
import { AppProvider } from './context/AppContext';
import MainLayout from './components/MainLayout';
import { SimpleToastContainer } from './components/SimpleToastContainer';
import { useToast } from './hooks/useToast';

/**
 * エラーバウンダリーコンポーネント
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('アプリケーションエラー:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              エラーが発生しました
            </h1>
            <p className="text-gray-600 mb-4">
              アプリケーションの読み込み中にエラーが発生しました。
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              ページを再読み込み
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  エラー詳細
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 統合されたアプリケーションコンポーネント
 * MainLayoutを使用してタイムライン機能を提供
 */
function IntegratedApp() {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {/* MainLayoutを使用してタイムライン機能を統合 */}
      <MainLayout>
        {/* モーダルやダイアログなどの子コンポーネントがここに配置される */}
        <></>
      </MainLayout>

      {/* トースト通知（既存機能を維持） */}
      <SimpleToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}

/**
 * アプリケーションルートコンポーネント
 * AppProviderでコンテキストを提供し、MainLayoutを統合
 */
function AppRoot() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <IntegratedApp />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default AppRoot;