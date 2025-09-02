import { useCallback, useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * 時間軸とリスト間の双方向連携を管理するカスタムフック
 * 要件4.4, 4.5, 5.5, 5.6に対応
 */
export function useTimelineSync() {
  const { state, dispatch } = useAppContext();
  const { selectedPostId, highlightedPostIds } = state;
  
  // スクロール制御用のタイマー参照
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // 投稿選択ハンドラー（時間軸・リスト共通）
  const selectPost = useCallback((postId: string | null) => {
    dispatch({ type: 'SELECT_POST', payload: postId });
  }, [dispatch]);

  // ハイライト変更ハンドラー（時間軸・リスト共通）
  const highlightPosts = useCallback((postIds: string[]) => {
    dispatch({ type: 'HIGHLIGHT_POSTS', payload: postIds });
  }, [dispatch]);

  // マーカークリック時のハンドラー（時間軸→リスト連携）
  const handleMarkerClick = useCallback((postIds: string[]) => {
    // 複数投稿がある場合は最初の投稿を選択
    const postId = postIds.length > 0 ? postIds[0] : null;
    selectPost(postId);
  }, [selectPost]);

  // マーカーホバー時のハンドラー（時間軸→リスト連携）
  const handleMarkerHover = useCallback((postIds: string[]) => {
    highlightPosts(postIds);
  }, [highlightPosts]);

  // マーカーホバー終了時のハンドラー
  const handleMarkerHoverEnd = useCallback(() => {
    highlightPosts([]);
  }, [highlightPosts]);

  // リストスクロール時のハンドラー（リスト→時間軸連携）
  const handleListScroll = useCallback((scrollPercentage: number) => {
    // 将来的に時間軸の表示範囲調整で使用予定
    console.log('List scroll percentage:', scrollPercentage);
  }, []);

  // リストの可視投稿変更時のハンドラー（リスト→時間軸連携）
  const handleVisiblePostsChange = useCallback((postIds: string[]) => {
    // ユーザーがスクロール中でない場合のみハイライトを更新
    if (!isUserScrolling) {
      highlightPosts(postIds);
    }
  }, [highlightPosts, isUserScrolling]);

  // ユーザースクロール状態の管理
  const setUserScrollingState = useCallback((scrolling: boolean) => {
    setIsUserScrolling(scrolling);
    
    if (scrolling) {
      // スクロール終了を検知するためのタイマー
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 150);
    }
  }, []);

  // スムーズスクロール制御
  const scrollToPost = useCallback((postId: string) => {
    selectPost(postId);
    // PostListPanelのuseEffectでスクロールが実行される
  }, [selectPost]);

  return {
    // 状態
    selectedPostId,
    highlightedPostIds,
    isUserScrolling,
    
    // アクション
    selectPost,
    highlightPosts,
    scrollToPost,
    setUserScrolling: setUserScrollingState,
    
    // イベントハンドラー
    handleMarkerClick,
    handleMarkerHover,
    handleMarkerHoverEnd,
    handleListScroll,
    handleVisiblePostsChange,
  };
}