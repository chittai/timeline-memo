import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import PostItem from './PostItem';

import DeleteConfirmDialog from './DeleteConfirmDialog';
import { DateRangeFilter } from './DateRangeFilter';
import { usePosts } from '../hooks/usePosts';
import { useAppContext } from '../context/AppContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useRenderTime } from '../hooks/usePerformanceMonitor';
import type { Post, DiaryEntry, DateRange } from '../types';

interface DiaryViewProps {
  /** 日記エントリーのリスト */
  entries: DiaryEntry[];
  /** 選択された日付 */
  selectedDate?: Date | null;
  /** 日付選択時のコールバック */
  onDateSelect?: (date: Date) => void;
  /** 投稿選択時のコールバック */
  onPostSelect?: (postId: string | null) => void;
  /** 選択された投稿ID */
  selectedPostId?: string | null;
  /** 日付範囲フィルターの表示フラグ */
  showDateFilter?: boolean;
  /** 日付範囲変更時のコールバック */
  onDateRangeChange?: (range: DateRange | null) => void;
  /** 現在の日付範囲フィルター */
  currentDateRange?: DateRange | null;
}

/**
 * 日記ビューコンポーネント
 * 日付ごとにグループ化された投稿を表示
 * 要件1.1, 1.2, 1.3に対応
 */
const DiaryView: React.FC<DiaryViewProps> = ({
  entries,
  selectedDate,
  onDateSelect,
  onPostSelect,
  selectedPostId,
  showDateFilter = true,
  onDateRangeChange,
  currentDateRange
}) => {
  // パフォーマンス監視
  useRenderTime('DiaryView');
  
  const { posts, isLoading, error, selectPost, deletePost } = usePosts();
  const { state } = useAppContext();
  const { highlightedPostIds } = state;
  const { showSuccess } = useErrorHandler();
  
  // デバイス情報の状態管理
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // 編集・削除の状態管理
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // デバイス情報の検出
  useEffect(() => {
    const updateDeviceInfo = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
    };
  }, []);

  // 日付フォーマット関数
  const formatDate = useMemo(() => {
    return (dateString: string) => {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // 今日、昨日の判定
      if (date.toDateString() === today.toDateString()) {
        return '今日';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return '昨日';
      }
      
      // 通常の日付フォーマット
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      };
      
      return new Intl.DateTimeFormat('ja-JP', options).format(date);
    };
  }, []);

  // 投稿選択ハンドラー
  const handlePostSelect = useCallback((postId: string) => {
    selectPost(postId);
    if (onPostSelect) {
      onPostSelect(postId);
    }
  }, [selectPost, onPostSelect]);

  // 日付ヘッダークリックハンドラー
  const handleDateClick = useCallback((dateString: string) => {
    const date = new Date(dateString);
    if (onDateSelect) {
      onDateSelect(date);
    }
  }, [onDateSelect]);

  // 投稿編集ハンドラー
  const handlePostEdit = useCallback((post: Post) => {
    setEditingPost(post);
  }, []);



  // 投稿削除ハンドラー（確認ダイアログ表示）
  const handlePostDelete = useCallback((postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    setDeletingPost(post);
  }, [posts]);

  // 削除確定ハンドラー
  const handleDeleteConfirm = useCallback(async () => {
    if (!deletingPost) return;
    
    setIsDeleting(true);
    
    try {
      const success = await deletePost(deletingPost.id);
      if (success) {
        // 成功通知を表示
        showSuccess('投稿を削除しました', '投稿が日記から削除されました');
        
        // 削除された投稿が選択されていた場合、選択を解除
        if (selectedPostId === deletingPost.id) {
          selectPost(null);
          if (onPostSelect) {
            onPostSelect(null);
          }
        }
        // 削除された投稿が編集中だった場合、編集を終了
        if (editingPost?.id === deletingPost.id) {
          setEditingPost(null);
        }
        setDeletingPost(null);
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deletingPost, deletePost, selectedPostId, selectPost, onPostSelect, editingPost, showSuccess]);

  // 削除キャンセルハンドラー
  const handleDeleteCancel = useCallback(() => {
    if (!isDeleting) {
      setDeletingPost(null);
    }
  }, [isDeleting]);

  // 日付範囲フィルター変更ハンドラー
  const handleDateRangeChange = useCallback((range: DateRange | null) => {
    if (onDateRangeChange) {
      onDateRangeChange(range);
    }
  }, [onDateRangeChange]);

  // 日付範囲フィルタークリアハンドラー
  const handleDateRangeClear = useCallback(() => {
    if (onDateRangeChange) {
      onDateRangeChange(null);
    }
  }, [onDateRangeChange]);

  // レスポンシブ対応のスタイル計算
  const getTextSizes = () => {
    return {
      loading: isMobile ? 'text-xs' : 'text-sm',
      errorTitle: isMobile ? 'text-xs' : 'text-sm',
      errorDetail: isMobile ? 'text-xs' : 'text-xs',
      emptyTitle: isMobile ? 'text-sm' : 'text-base',
      emptySubtitle: isMobile ? 'text-xs' : 'text-sm',
      header: isMobile ? 'text-base' : 'text-lg',
      dateHeader: isMobile ? 'text-sm' : 'text-base',
      postCount: isMobile ? 'text-xs' : 'text-sm'
    };
  };

  const textSizes = getTextSizes();

  // ローディング状態
  if (isLoading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className={`animate-spin rounded-full ${isMobile ? 'h-6 w-6' : 'h-8 w-8'} border-b-2 border-blue-600 mx-auto mb-2`}></div>
          <p className={`text-gray-500 ${textSizes.loading}`}>日記を読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <svg className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} mx-auto mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className={`${textSizes.errorTitle} font-medium`}>エラーが発生しました</p>
          <p className={`${textSizes.errorDetail} text-gray-500 mt-1`}>{error}</p>
        </div>
      </div>
    );
  }

  // 投稿が空の状態（空の日付は表示しない - 要件1.3）
  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <svg className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} mx-auto ${isMobile ? 'mb-2' : 'mb-3'} text-gray-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 4v10m6-10v10m-6-4h6" />
          </svg>
          <p className={`${textSizes.emptyTitle} font-medium mb-1`}>まだ日記がありません</p>
          {!isMobile && (
            <p className={textSizes.emptySubtitle}>投稿を作成すると日記として表示されます</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 編集フォーム（編集モード時） */}
      {editingPost && (
        <div className={`flex-shrink-0 ${isMobile ? 'mb-2' : 'mb-4'}`}>
          {/* PostForm - 一時的に無効化 */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800">編集機能は新しいPostFormで利用可能です</p>
          </div>
        </div>
      )}

      {/* 日付範囲フィルター */}
      {showDateFilter && (
        <div className="flex-shrink-0 mb-4">
          <DateRangeFilter
            onDateRangeChange={handleDateRangeChange}
            onClear={handleDateRangeClear}
            currentRange={currentDateRange}
          />
        </div>
      )}

      {/* ヘッダー */}
      <div className={`flex-shrink-0 ${isMobile ? 'pb-2' : 'pb-3'} border-b border-gray-200`}>
        <div className="flex justify-between items-center">
          <h2 className={`${textSizes.header} font-semibold text-gray-800`}>
            日記
          </h2>
          <span className={`${textSizes.postCount} text-gray-500`}>
            {isMobile ? `${entries.length}日` : `${entries.length}日間の記録`}
          </span>
        </div>
        
        {/* フィルター適用時の結果表示 */}
        {currentDateRange && entries.length === 0 && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-yellow-800">
                指定した期間に該当する投稿がありません
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 日記エントリーリスト */}
      <div 
        className={`flex-1 overflow-y-auto ${isMobile ? 'mt-2' : 'mt-4'} ${
          isMobile ? 'pr-1 -mr-1' : 'pr-2 -mr-2'
        } ${isTouchDevice ? 'touch-manipulation' : ''}`}
        style={{ 
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch' // iOS向けのスムーズスクロール
        }}
      >
        <div className="space-y-0">
          {entries.map((entry) => (
            <div key={entry.date} className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
              {/* 日付ヘッダー */}
              <div 
                className={`sticky top-0 bg-white z-10 ${isMobile ? 'py-2' : 'py-3'} border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200`}
                onClick={() => handleDateClick(entry.date)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDateClick(entry.date);
                  }
                }}
              >
                <div className="flex justify-between items-center">
                  <h3 className={`${textSizes.dateHeader} font-semibold text-gray-800`}>
                    {formatDate(entry.date)}
                  </h3>
                  <div className="flex items-center gap-2">
                    {/* 投稿数表示（要件1.2） */}
                    <span className={`${textSizes.postCount} text-gray-500 bg-gray-100 px-2 py-1 rounded-full`}>
                      {entry.postCount}件
                    </span>
                    {/* 選択された日付のインジケーター */}
                    {selectedDate && 
                     new Date(selectedDate).toDateString() === new Date(entry.date).toDateString() && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* その日の投稿リスト */}
              <div className={`${isMobile ? 'mt-2' : 'mt-3'} space-y-0`}>
                {entry.posts.map((post) => (
                  <div key={post.id} data-post-id={post.id}>
                    <PostItem
                      post={post}
                      isSelected={selectedPostId === post.id}
                      isHighlighted={highlightedPostIds.includes(post.id)}
                      onSelect={handlePostSelect}
                      onEdit={handlePostEdit}
                      onDelete={handlePostDelete}
                      isMobile={isMobile}
                      isTouchDevice={isTouchDevice}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 読み込み中インジケーター（追加読み込み時用） */}
        {isLoading && entries.length > 0 && (
          <div className={`flex justify-center ${isMobile ? 'py-2' : 'py-4'}`}>
            <div className={`animate-spin rounded-full ${isMobile ? 'h-4 w-4' : 'h-6 w-6'} border-b-2 border-blue-600`}></div>
          </div>
        )}
      </div>

      {/* スクロールヒント（エントリーが多い場合、デスクトップのみ） */}
      {!isMobile && entries.length > 3 && (
        <div className="flex-shrink-0 pt-2 border-t border-gray-100 mt-2">
          <p className="text-xs text-gray-400 text-center">
            スクロールして他の日の記録を表示
          </p>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deletingPost && (
        <DeleteConfirmDialog
          post={deletingPost}
          isOpen={!!deletingPost}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

// React.memoでコンポーネントをメモ化してパフォーマンス最適化
export default memo(DiaryView);