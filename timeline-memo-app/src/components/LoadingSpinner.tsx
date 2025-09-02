

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  progress?: number; // 0-100のプログレス値
}

/**
 * ローディング状態を表示するスピナーコンポーネント
 */
export function LoadingSpinner({ size = 'md', message, progress }: LoadingSpinnerProps) {
  // サイズに応じたスタイル
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'w-4 h-4';
      case 'lg':
        return 'w-8 h-8';
      default:
        return 'w-6 h-6';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {/* スピナー */}
      <div className={`${getSizeStyles()} animate-spin`}>
        <svg
          className="w-full h-full text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>

      {/* プログレスバー（プログレス値が指定されている場合） */}
      {typeof progress === 'number' && (
        <div className="w-32 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {/* メッセージ */}
      {message && (
        <p className="text-sm text-gray-600 text-center max-w-xs">
          {message}
        </p>
      )}

      {/* プログレス値の表示 */}
      {typeof progress === 'number' && (
        <span className="text-xs text-gray-500">
          {Math.round(progress)}%
        </span>
      )}
    </div>
  );
}