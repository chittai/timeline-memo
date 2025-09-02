import React, { memo, useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { isUrlSafe } from '../utils/securityUtils';
import type { PostItemProps } from '../types';

interface ExtendedPostItemProps extends PostItemProps {
  isMobile?: boolean;
  isTouchDevice?: boolean;
}

/**
 * 個別投稿表示コンポーネント
 * Markdownレンダリング、編集・削除ボタンを含む
 * レスポンシブデザインとタッチデバイス対応
 * 要件2.1, 2.2, 6.1, 6.2, 6.3に対応
 */
const PostItem: React.FC<ExtendedPostItemProps> = ({
  post,
  isSelected = false,
  isHighlighted = false,
  onSelect,
  onEdit,
  onDelete,
  isMobile = false,
  isTouchDevice = false
}) => {
  // 投稿時刻のフォーマット（レスポンシブ対応）- useMemoでメモ化
  const formatDateTime = useMemo(() => {
    const options: Intl.DateTimeFormatOptions = isMobile 
      ? {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }
      : {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        };
    
    const formatter = new Intl.DateTimeFormat('ja-JP', options);
    return (date: Date) => formatter.format(new Date(date));
  }, [isMobile]);

  // 投稿選択ハンドラー - useCallbackでメモ化
  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(post.id);
    }
  }, [onSelect, post.id]);

  // 編集ボタンハンドラー - useCallbackでメモ化
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // 親のクリックイベントを防ぐ
    if (onEdit) {
      onEdit(post);
    }
  }, [onEdit, post]);

  // 削除ボタンハンドラー - useCallbackでメモ化
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // 親のクリックイベントを防ぐ
    if (onDelete) {
      onDelete(post.id);
    }
  }, [onDelete, post.id]);

  // レスポンシブ対応のスタイル計算 - useMemoでメモ化
  const articleClasses = useMemo(() => {
    const baseClasses = "group border border-gray-200 rounded-lg cursor-pointer transition-all duration-200";
    const paddingClasses = isMobile ? "p-3" : "p-4";
    const marginClasses = isMobile ? "mb-2" : "mb-3";
    const touchClasses = isTouchDevice ? "touch-manipulation" : "";
    const hoverClasses = isMobile ? "" : "hover:shadow-md hover:border-gray-300";
    
    const stateClasses = isSelected 
      ? 'ring-2 ring-blue-500 border-blue-300 bg-blue-50' 
      : isHighlighted 
        ? 'ring-1 ring-blue-300 border-blue-200 bg-blue-25' 
        : 'bg-white';
    
    return `${baseClasses} ${paddingClasses} ${marginClasses} ${touchClasses} ${hoverClasses} ${stateClasses}`.trim();
  }, [isMobile, isTouchDevice, isSelected, isHighlighted]);

  return (
    <article
      className={articleClasses}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* ヘッダー部分：投稿時刻とアクションボタン */}
      <header className={`flex justify-between items-start ${isMobile ? 'mb-2' : 'mb-3'}`}>
        <time 
          className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 font-medium`}
          dateTime={new Date(post.createdAt).toISOString()}
        >
          {formatDateTime(post.createdAt)}
        </time>
        
        {/* アクションボタン */}
        <div className={`flex ${isMobile ? 'gap-1' : 'gap-2'} ${
          isMobile || isTouchDevice 
            ? 'opacity-100' // モバイル・タッチデバイスでは常に表示
            : 'opacity-0 group-hover:opacity-100'
        } transition-opacity duration-200`}>
          {onEdit && (
            <button
              onClick={handleEdit}
              className={`text-gray-400 hover:text-blue-600 transition-colors duration-200 ${
                isMobile ? 'p-2' : 'p-1'
              } ${isTouchDevice ? 'touch-manipulation' : ''}`}
              title="投稿を編集"
              aria-label="投稿を編集"
            >
              <svg className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={handleDelete}
              className={`text-gray-400 hover:text-red-600 transition-colors duration-200 ${
                isMobile ? 'p-2' : 'p-1'
              } ${isTouchDevice ? 'touch-manipulation' : ''}`}
              title="投稿を削除"
              aria-label="投稿を削除"
            >
              <svg className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* メインコンテンツ：Markdownレンダリング */}
      <div className={`prose ${isMobile ? 'prose-xs' : 'prose-sm'} max-w-none`}>
        <ReactMarkdown
          components={{
            // カスタムコンポーネントでスタイリングを調整（レスポンシブ対応）
            h1: ({ children }) => (
              <h1 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold ${isMobile ? 'mb-1' : 'mb-2'} text-gray-900`}>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold ${isMobile ? 'mb-1' : 'mb-2'} text-gray-800`}>
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium mb-1 text-gray-700`}>
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 ${isMobile ? 'mb-1' : 'mb-2'} leading-relaxed`}>
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 ${isMobile ? 'mb-1 pl-3' : 'mb-2 pl-4'} list-disc`}>
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700 ${isMobile ? 'mb-1 pl-3' : 'mb-2 pl-4'} list-decimal`}>
                {children}
              </ol>
            ),
            li: ({ children }) => <li className={isMobile ? 'mb-0.5' : 'mb-1'}>{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className={`border-l-4 border-gray-300 ${isMobile ? 'pl-2' : 'pl-3'} italic text-gray-600 ${isMobile ? 'my-1' : 'my-2'}`}>
                {children}
              </blockquote>
            ),
            code: ({ children, className }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className={`bg-gray-100 text-gray-800 px-1 py-0.5 rounded ${isMobile ? 'text-xs' : 'text-xs'} font-mono`}>
                    {children}
                  </code>
                );
              }
              return (
                <pre className={`bg-gray-100 ${isMobile ? 'p-2' : 'p-3'} rounded ${isMobile ? 'text-xs' : 'text-xs'} font-mono overflow-x-auto ${isMobile ? 'my-1' : 'my-2'}`}>
                  <code>{children}</code>
                </pre>
              );
            },
            a: ({ children, href }) => {
              // URLの安全性をチェック
              const safeHref = href && isUrlSafe(href) ? href : '#';
              const isUnsafe = href && !isUrlSafe(href);
              
              return (
                <a 
                  href={safeHref}
                  className={`${isUnsafe ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'} underline`}
                  target={isUnsafe ? undefined : "_blank"}
                  rel={isUnsafe ? undefined : "noopener noreferrer"}
                  title={isUnsafe ? "安全でないURLのため無効化されています" : undefined}
                  onClick={isUnsafe ? (e) => e.preventDefault() : undefined}
                >
                  {children}
                  {isUnsafe && <span className="ml-1 text-xs">⚠️</span>}
                </a>
              );
            },
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      {/* 更新日時表示（作成日時と異なる場合のみ） */}
      {post.updatedAt && new Date(post.updatedAt).getTime() !== new Date(post.createdAt).getTime() && (
        <footer className={`${isMobile ? 'mt-2 pt-1' : 'mt-3 pt-2'} border-t border-gray-100`}>
          <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-400`}>
            更新: {formatDateTime(post.updatedAt)}
          </p>
        </footer>
      )}
    </article>
  );
};

// React.memoでコンポーネントをメモ化してパフォーマンス最適化
export default memo(PostItem);