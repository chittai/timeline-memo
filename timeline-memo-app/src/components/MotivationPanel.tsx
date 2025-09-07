import React from 'react';
import { useMotivation } from '../hooks/useMotivation';
import { MotivationMessage } from '../types';

interface MotivationPanelProps {
  className?: string;
}

/**
 * 継続促進メッセージを表示するパネルコンポーネント
 * 投稿促進メッセージ、達成通知、月末サマリーなどを表示する
 */
export function MotivationPanel({ className = '' }: MotivationPanelProps) {
  const { motivationMessages, dismissMessage, daysSinceLastPost, streakInfo } = useMotivation();

  // 表示するメッセージをフィルタリング（非表示のメッセージは除外）
  const visibleMessages = motivationMessages.filter(message => message.isVisible);

  if (visibleMessages.length === 0) {
    return null;
  }

  /**
   * メッセージタイプに応じたスタイルクラスを取得
   */
  const getMessageStyleClass = (type: MotivationMessage['type']): string => {
    switch (type) {
      case 'encouragement':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'achievement':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'reminder':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  /**
   * メッセージタイプに応じたアイコンを取得
   */
  const getMessageIcon = (type: MotivationMessage['type']): string => {
    switch (type) {
      case 'encouragement':
        return '💭'; // 思考バルーン
      case 'achievement':
        return '🎉'; // お祝い
      case 'reminder':
        return '📊'; // グラフ
      default:
        return '💡'; // 電球
    }
  };

  /**
   * メッセージを閉じるハンドラー
   */
  const handleDismiss = (messageId: string) => {
    dismissMessage(messageId);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 継続状況の概要表示 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              最後の投稿から: <span className="font-medium text-gray-900">{daysSinceLastPost}日</span>
            </div>
            <div className="text-sm text-gray-600">
              現在の連続記録: <span className="font-medium text-gray-900">{streakInfo.current}日</span>
            </div>
            <div className="text-sm text-gray-600">
              最長記録: <span className="font-medium text-gray-900">{streakInfo.longest}日</span>
            </div>
          </div>
        </div>
      </div>

      {/* メッセージリスト */}
      {visibleMessages.map((message) => (
        <div
          key={message.id}
          className={`rounded-lg border p-4 ${getMessageStyleClass(message.type)}`}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <span className="text-lg" role="img" aria-label={message.type}>
                {getMessageIcon(message.type)}
              </span>
              <div className="flex-1">
                <h3 className="font-medium text-sm mb-1">
                  {message.title}
                </h3>
                <p className="text-sm opacity-90">
                  {message.message}
                </p>
                
                {/* 追加情報の表示 */}
                {message.daysSinceLastPost && (
                  <div className="mt-2 text-xs opacity-75">
                    {message.daysSinceLastPost}日間投稿がありません
                  </div>
                )}
                
                {message.streakCount && (
                  <div className="mt-2 text-xs opacity-75">
                    {message.streakCount}日連続達成！
                  </div>
                )}
              </div>
            </div>
            
            {/* 閉じるボタン */}
            <button
              onClick={() => handleDismiss(message.id)}
              className="ml-4 text-current opacity-50 hover:opacity-75 transition-opacity"
              aria-label="メッセージを閉じる"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          
          {/* 期限表示（期限がある場合のみ） */}
          {message.expiresAt && (
            <div className="mt-3 pt-2 border-t border-current border-opacity-20">
              <div className="text-xs opacity-60">
                期限: {message.expiresAt.toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default MotivationPanel;