
import { LoadingSpinner } from './LoadingSpinner';
import type { LoadingState } from '../types';

interface LoadingOverlayProps {
  loading: LoadingState;
  className?: string;
}

/**
 * 全画面またはコンテナ全体を覆うローディングオーバーレイ
 */
export function LoadingOverlay({ loading, className = '' }: LoadingOverlayProps) {
  if (!loading.isLoading) {
    return null;
  }

  return (
    <div className={`absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-40 ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <LoadingSpinner
          size="lg"
          message={loading.operation || '読み込み中...'}
          progress={loading.progress}
        />
      </div>
    </div>
  );
}