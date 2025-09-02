import React from 'react';
import { sanitizeMarkdown } from '../utils/securityUtils';
import type { Post } from '../types';

interface PostPreviewProps {
  posts: Post[];
  position: { x: number; y: number };
  isVisible: boolean;
  isMobile?: boolean;
  isTouchDevice?: boolean;
}

/**
 * 投稿プレビューコンポーネント
 * マーカーホバー時にツールチップとして投稿内容のプレビューを表示
 * レスポンシブデザインとタッチデバイス対応
 * 要件5.3, 6.1, 6.2, 6.3に対応
 */
const PostPreview: React.FC<PostPreviewProps> = ({
  posts,
  position,
  isVisible,
  isMobile = false,
  isTouchDevice = false
}) => {
  if (!isVisible || posts.length === 0) {
    return null;
  }

  /**
   * コンテンツをデバイスに応じて制限してプレビュー用に整形
   */
  const formatPreviewContent = (content: string): string => {
    // まずセキュリティサニタイズを実行
    const sanitizedContent = sanitizeMarkdown(content);
    
    // Markdownの記号を除去（簡易版）
    const plainText = sanitizedContent
      .replace(/#{1,6}\s+/g, '') // ヘッダー記号を除去
      .replace(/\*\*(.*?)\*\*/g, '$1') // 太字記号を除去
      .replace(/\*(.*?)\*/g, '$1') // イタリック記号を除去
      .replace(/`(.*?)`/g, '$1') // インラインコード記号を除去
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // リンク記号を除去
      .replace(/\n+/g, ' ') // 改行をスペースに変換
      .replace(/<[^>]*>/g, '') // 残存するHTMLタグを除去
      .trim();

    // モバイルでは短めに制限
    const maxLength = isMobile ? 60 : 100;
    
    if (plainText.length <= maxLength) {
      return plainText;
    }
    
    return plainText.substring(0, maxLength) + '...';
  };

  /**
   * 時刻を表示用にフォーマット
   */
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 複数投稿がある場合の処理
  const isMultiplePosts = posts.length > 1;

  // レスポンシブ対応のスタイル計算
  const getContainerClasses = () => {
    const baseClasses = "bg-white border border-gray-200 rounded-lg shadow-lg";
    const sizeClasses = isMobile ? "p-2 max-w-xs" : "p-3 max-w-xs";
    const touchClasses = isTouchDevice ? "touch-manipulation" : "";
    return `${baseClasses} ${sizeClasses} ${touchClasses}`.trim();
  };

  const getPositionStyle = () => {
    if (isMobile) {
      // モバイルでは画面端を考慮した位置調整
      const viewportWidth = window.innerWidth;
      const previewWidth = 280; // max-w-xsの概算幅
      
      let adjustedX = position.x;
      
      // 左端からはみ出る場合
      if (position.x - previewWidth / 2 < 10) {
        adjustedX = previewWidth / 2 + 10;
      }
      // 右端からはみ出る場合
      else if (position.x + previewWidth / 2 > viewportWidth - 10) {
        adjustedX = viewportWidth - previewWidth / 2 - 10;
      }
      
      return {
        left: adjustedX,
        top: Math.max(position.y - 10, 10), // 上端からはみ出ないように
        transform: 'translate(-50%, -100%)'
      };
    }
    
    return {
      left: position.x,
      top: position.y,
      transform: 'translate(-50%, -100%)'
    };
  };

  const getTextSizes = () => {
    return {
      header: isMobile ? 'text-xs' : 'text-xs',
      time: isMobile ? 'text-xs' : 'text-xs',
      content: isMobile ? 'text-xs' : 'text-sm',
      more: isMobile ? 'text-xs' : 'text-xs'
    };
  };

  const textSizes = getTextSizes();
  const maxDisplayPosts = isMobile ? 2 : 3; // モバイルでは表示件数を減らす

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={getPositionStyle()}
    >
      <div className={getContainerClasses()}>
        {/* ツールチップの矢印 */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-200"></div>
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
          </div>
        </div>

        {/* 複数投稿の場合のヘッダー */}
        {isMultiplePosts && (
          <div className={`${textSizes.header} text-blue-600 font-medium ${isMobile ? 'mb-1' : 'mb-2'} border-b border-gray-100 pb-1`}>
            {posts.length}件の投稿
          </div>
        )}

        {/* 投稿プレビュー */}
        <div className={isMobile ? 'space-y-1' : 'space-y-2'}>
          {posts.slice(0, maxDisplayPosts).map((post, index) => (
            <div key={post.id} className={index > 0 ? `border-t border-gray-100 ${isMobile ? 'pt-1' : 'pt-2'}` : ''}>
              {/* 時刻表示 */}
              <div className={`${textSizes.time} text-gray-500 ${isMobile ? 'mb-0.5' : 'mb-1'}`}>
                {formatTime(post.createdAt)}
              </div>
              
              {/* コンテンツプレビュー */}
              <div className={`${textSizes.content} text-gray-800 leading-relaxed`}>
                {formatPreviewContent(post.content)}
              </div>
            </div>
          ))}
          
          {/* 表示制限を超える場合の省略表示 */}
          {posts.length > maxDisplayPosts && (
            <div className={`${textSizes.more} text-gray-500 text-center ${isMobile ? 'pt-0.5' : 'pt-1'} border-t border-gray-100`}>
              他 {posts.length - maxDisplayPosts} 件...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostPreview;