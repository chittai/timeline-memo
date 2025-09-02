import React, { useCallback, useEffect, useRef, useState, memo, useMemo } from 'react';
import PostItem from './PostItem';
import { PostForm } from './PostForm';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { usePosts } from '../hooks/usePosts';
import { useAppContext } from '../context/AppContext';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useRenderTime } from '../hooks/usePerformanceMonitor';
import type { Post } from '../types';

interface PostListPanelProps {
  /** 選択された投稿ID（時間軸からの連携用） */
  selectedPostId?: string | null;
  /** 投稿選択時のコールバック（時間軸との連携用） */
  onPostSelect?: (postId: string | null) => void;
  /** スクロール位置変更時のコールバック（時間軸との連携用） */
  onScrollChange?: (scrollPercentage: number) => void;
  /** ハイライト変更時のコールバック（時間軸との連携用） */
  onHighlightChange?: (postIds: string[]) => void;
  /** 外部からのスクロール制御用（時間軸からの連携） */
  scrollToPost?: string | null;
}

/**
 * 投稿リストパネルコンポーネント
 * 投稿の一覧表示、スクロール制御、パフォーマンス最適化を提供
 * レスポンシブデザインとタッチデバイス対応
 * 要件2.1, 2.2, 4.3, 7.1, 7.2, 7.3, 7.4, 6.1, 6.2, 6.3に対応
 */
const PostListPanel: React.FC<PostListPanelProps> = ({
  selectedPostId,
  onPostSelect,
  onScrollChange,
  onHighlightChange,
  scrollToPost
}) => {
  // パフォーマンス監視
  useRenderTime('PostListPanel');
  
  const { posts, isLoading, error, selectPost, deletePost } = usePosts();
  const { state } = useAppContext();
  const { highlightedPostIds } = state;
  const { showSuccess } = useErrorHandler();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // デバイス情報の状態管理
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

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
  
  // 編集・削除の状態管理
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPost, setDeletingPost] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 投稿を新しい順（降順）でソート - useMemoでメモ化
  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [posts]);

  // 仮想スクロール用の設定
  const VIRTUAL_SCROLL_THRESHOLD = 50; // 50件以上で仮想スクロールを有効化
  const ITEM_HEIGHT = isMobile ? 120 : 150; // 1つの投稿アイテムの推定高さ
  const BUFFER_SIZE = 5; // 表示範囲外でも描画するアイテム数

  // 仮想スクロールが有効かどうか
  const isVirtualScrollEnabled = useMemo(() => 
    sortedPosts.length > VIRTUAL_SCROLL_THRESHOLD, 
    [sortedPosts.length]
  );

  // 仮想スクロール用の状態
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // 表示する投稿の範囲を計算（仮想スクロール用）
  const visibleRange = useMemo(() => {
    if (!isVirtualScrollEnabled) {
      return { start: 0, end: sortedPosts.length };
    }

    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
    const endIndex = Math.min(
      sortedPosts.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
    );

    return { start: startIndex, end: endIndex };
  }, [isVirtualScrollEnabled, scrollTop, containerHeight, sortedPosts.length, ITEM_HEIGHT]);

  // 表示する投稿リスト
  const visiblePosts = useMemo(() => {
    if (!isVirtualScrollEnabled) {
      return sortedPosts;
    }
    return sortedPosts.slice(visibleRange.start, visibleRange.end);
  }, [isVirtualScrollEnabled, sortedPosts, visibleRange]);

  // 投稿選択ハンドラー
  const handlePostSelect = useCallback((postId: string) => {
    selectPost(postId);
    if (onPostSelect) {
      onPostSelect(postId);
    }
  }, [selectPost, onPostSelect]);

  // 投稿編集ハンドラー
  const handlePostEdit = useCallback((post: Post) => {
    setEditingPost(post);
  }, []);

  // 編集完了ハンドラー
  const handleEditComplete = useCallback(() => {
    setEditingPost(null);
  }, []);

  // 編集キャンセルハンドラー
  const handleEditCancel = useCallback(() => {
    setEditingPost(null);
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
        showSuccess('投稿を削除しました', '投稿がタイムラインから削除されました');
        
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
  }, [deletingPost, deletePost, selectedPostId, selectPost, onPostSelect, editingPost]);

  // 削除キャンセルハンドラー
  const handleDeleteCancel = useCallback(() => {
    if (!isDeleting) {
      setDeletingPost(null);
    }
  }, [isDeleting]);

  // スクロールイベントハンドラー（仮想スクロール対応）
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const currentScrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    
    // 仮想スクロール用の状態更新
    setScrollTop(currentScrollTop);
    
    // スクロール位置の通知
    if (onScrollChange && scrollHeight > 0) {
      const scrollPercentage = (currentScrollTop / scrollHeight) * 100;
      onScrollChange(scrollPercentage);
    }

    // 現在表示されている投稿のハイライト処理
    if (onHighlightChange) {
      const visiblePostIds = getVisiblePostIds(container);
      onHighlightChange(visiblePostIds);
    }

    // ユーザーがスクロール中であることを示すフラグを設定
    setIsUserScrolling(true);
    
    // スクロール終了を検知するためのタイマー
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 150);
  }, [onScrollChange, onHighlightChange]);

  // コンテナサイズの監視（仮想スクロール用）
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isVirtualScrollEnabled) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight);

    return () => {
      resizeObserver.disconnect();
    };
  }, [isVirtualScrollEnabled]);

  // 現在表示されている投稿IDを取得する関数
  const getVisiblePostIds = useCallback((container: HTMLElement): string[] => {
    const containerRect = container.getBoundingClientRect();
    const postElements = container.querySelectorAll('[data-post-id]');
    const visiblePostIds: string[] = [];

    postElements.forEach((element) => {
      const elementRect = element.getBoundingClientRect();
      const isVisible = (
        elementRect.top < containerRect.bottom &&
        elementRect.bottom > containerRect.top
      );

      if (isVisible) {
        const postId = element.getAttribute('data-post-id');
        if (postId) {
          visiblePostIds.push(postId);
        }
      }
    });

    return visiblePostIds;
  }, []);

  // 外部からの投稿選択に応じてスクロール位置を調整
  useEffect(() => {
    const targetPostId = scrollToPost || selectedPostId;
    if (!targetPostId || isUserScrolling || !scrollContainerRef.current) return;

    const selectedIndex = sortedPosts.findIndex(post => post.id === targetPostId);
    if (selectedIndex === -1) return;

    const container = scrollContainerRef.current;
    const postElements = container.querySelectorAll('[data-post-id]');
    const targetElement = postElements[selectedIndex] as HTMLElement;

    if (targetElement) {
      // スムーズスクロールで選択された投稿を表示
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [selectedPostId, scrollToPost, sortedPosts, isUserScrolling]);

  // スクロールイベントリスナーの設定
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  // レスポンシブ対応のスタイル計算
  const getLoadingSpinnerSize = () => {
    return isMobile ? 'h-6 w-6' : 'h-8 w-8';
  };

  const getEmptyStateIconSize = () => {
    return isMobile ? 'w-8 h-8' : 'w-12 h-12';
  };

  const getTextSizes = () => {
    return {
      loading: isMobile ? 'text-xs' : 'text-sm',
      errorTitle: isMobile ? 'text-xs' : 'text-sm',
      errorDetail: isMobile ? 'text-xs' : 'text-xs',
      emptyTitle: isMobile ? 'text-sm' : 'text-base',
      emptySubtitle: isMobile ? 'text-xs' : 'text-sm',
      header: isMobile ? 'text-base' : 'text-lg',
      count: isMobile ? 'text-xs' : 'text-sm'
    };
  };

  const textSizes = getTextSizes();

  // ローディング状態
  if (isLoading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className={`animate-spin rounded-full ${getLoadingSpinnerSize()} border-b-2 border-blue-600 mx-auto mb-2`}></div>
          <p className={`text-gray-500 ${textSizes.loading}`}>投稿を読み込み中...</p>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <svg className={`${getLoadingSpinnerSize()} mx-auto mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className={`${textSizes.errorTitle} font-medium`}>エラーが発生しました</p>
          <p className={`${textSizes.errorDetail} text-gray-500 mt-1`}>{error}</p>
        </div>
      </div>
    );
  }

  // 投稿が空の状態
  if (sortedPosts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <svg className={`${getEmptyStateIconSize()} mx-auto ${isMobile ? 'mb-2' : 'mb-3'} text-gray-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className={`${textSizes.emptyTitle} font-medium mb-1`}>まだ投稿がありません</p>
          {!isMobile && (
            <p className={textSizes.emptySubtitle}>上部のフォームから最初の投稿を作成してみましょう</p>
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
          <PostForm
            editingPost={editingPost}
            onSubmitSuccess={handleEditComplete}
            onCancel={handleEditCancel}
            className="border-2 border-blue-200"
          />
        </div>
      )}

      {/* ヘッダー */}
      <div className={`flex-shrink-0 ${isMobile ? 'pb-2' : 'pb-3'} border-b border-gray-200`}>
        <div className="flex justify-between items-center">
          <h2 className={`${textSizes.header} font-semibold text-gray-800`}>
            投稿リスト
          </h2>
          <span className={`${textSizes.count} text-gray-500`}>
            {isMobile ? `${sortedPosts.length}件` : `${sortedPosts.length}件の投稿`}
          </span>
        </div>
      </div>

      {/* 投稿リスト（仮想スクロール対応） */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto ${isMobile ? 'mt-2' : 'mt-4'} ${
          isMobile ? 'pr-1 -mr-1' : 'pr-2 -mr-2'
        } group ${isTouchDevice ? 'touch-manipulation' : ''}`}
        style={{ 
          scrollbarWidth: 'thin',
          WebkitOverflowScrolling: 'touch' // iOS向けのスムーズスクロール
        }}
      >
        {isVirtualScrollEnabled ? (
          // 仮想スクロール有効時
          <div 
            style={{ 
              height: sortedPosts.length * ITEM_HEIGHT,
              position: 'relative'
            }}
          >
            <div
              style={{
                transform: `translateY(${visibleRange.start * ITEM_HEIGHT}px)`,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0
              }}
            >
              {visiblePosts.map((post) => {
                return (
                  <div 
                    key={post.id} 
                    data-post-id={post.id}
                    style={{ 
                      height: ITEM_HEIGHT,
                      display: 'flex',
                      alignItems: 'stretch'
                    }}
                  >
                    <div style={{ flex: 1 }}>
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
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // 通常のスクロール
          <div className="space-y-0">
            {sortedPosts.map((post) => (
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
        )}

        {/* 読み込み中インジケーター（追加読み込み時用） */}
        {isLoading && posts.length > 0 && (
          <div className={`flex justify-center ${isMobile ? 'py-2' : 'py-4'}`}>
            <div className={`animate-spin rounded-full ${isMobile ? 'h-4 w-4' : 'h-6 w-6'} border-b-2 border-blue-600`}></div>
          </div>
        )}
      </div>

      {/* スクロールヒント（投稿が多い場合、デスクトップのみ） */}
      {!isMobile && sortedPosts.length > 5 && (
        <div className="flex-shrink-0 pt-2 border-t border-gray-100 mt-2">
          <p className="text-xs text-gray-400 text-center">
            スクロールして他の投稿を表示
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
export default memo(PostListPanel);