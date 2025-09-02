import React from 'react';
import type { Post } from '../types';

interface DeleteConfirmDialogProps {
  /** 削除対象の投稿 */
  post: Post;
  /** ダイアログが開いているかどうか */
  isOpen: boolean;
  /** 削除確定時のコールバック */
  onConfirm: () => void;
  /** キャンセル時のコールバック */
  onCancel: () => void;
  /** 削除処理中かどうか */
  isDeleting?: boolean;
}

/**
 * 投稿削除確認ダイアログコンポーネント
 * 要件7.3, 7.4に対応
 * - 削除確認ダイアログの表示
 * - 投稿内容のプレビュー表示
 * - 削除処理の実行
 */
const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  post,
  isOpen,
  onConfirm,
  onCancel,
  isDeleting = false
}) => {
  // ダイアログが閉じている場合は何も表示しない
  if (!isOpen) {
    return null;
  }

  // 投稿内容のプレビュー（最大100文字）
  const contentPreview = post.content.length > 100 
    ? `${post.content.slice(0, 100)}...` 
    : post.content;

  // 投稿日時のフォーマット
  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  // ESCキーでキャンセル
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && !isDeleting) {
      onCancel();
    }
  };

  // バックドロップクリックでキャンセル
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !isDeleting) {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
      aria-describedby="delete-dialog-description"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 id="delete-dialog-title" className="text-lg font-semibold text-gray-900">
                投稿を削除
              </h3>
              <p className="text-sm text-gray-500">
                この操作は取り消せません
              </p>
            </div>
          </div>
          
          {!isDeleting && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="ダイアログを閉じる"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          <p id="delete-dialog-description" className="text-gray-700 mb-4">
            以下の投稿を削除してもよろしいですか？
          </p>

          {/* 投稿プレビュー */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <time className="text-xs text-gray-500">
                {formatDateTime(post.createdAt)}
              </time>
              {post.updatedAt && new Date(post.updatedAt).getTime() !== new Date(post.createdAt).getTime() && (
                <span className="text-xs text-gray-400">
                  (更新済み)
                </span>
              )}
            </div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {contentPreview}
            </div>
          </div>

          {/* 警告メッセージ */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-red-800">
                  注意: この操作は取り消せません
                </p>
                <p className="text-xs text-red-700 mt-1">
                  削除された投稿は完全に失われ、復元することはできません。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
          
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>削除中...</span>
              </>
            ) : (
              <span>削除する</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;