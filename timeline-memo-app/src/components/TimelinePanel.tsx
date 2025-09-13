import React, { useMemo, useCallback, useState, useEffect, memo } from 'react';
import { useAppContext } from '../context/AppContext';
import TimelineAxis from './TimelineAxis';
import type { TimelineMarkerData } from '../types';
import { calculateTimeRange, generateTimelineMarkers, optimizeMarkerPositions } from '../utils/timelineUtils';
import { useRenderTime } from '../hooks/usePerformanceMonitor';

interface TimelinePanelProps {
  selectedPostId?: string | null;
  highlightedPostIds?: string[];
  onPostSelect?: (postId: string | null) => void;
  onScrollChange?: (percentage: number) => void;
  onHighlightChange?: (postIds: string[]) => void;
}

/**
 * 時間軸パネルコンポーネント
 * 時間軸エリアを管理し、レスポンシブデザインとタッチデバイス対応を提供
 * 要件4.2, 5.1, 6.1, 6.2, 6.3に対応
 */
const TimelinePanel: React.FC<TimelinePanelProps> = ({
  selectedPostId,
  highlightedPostIds = [],
  onPostSelect,
  onScrollChange: _onScrollChange,
  onHighlightChange
}) => {
  // パフォーマンス監視
  useRenderTime('TimelinePanel');
  
  const { state } = useAppContext();
  const { posts } = state;
  
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

  // 時間軸の表示範囲を計算
  const timeRange = useMemo(() => {
    return calculateTimeRange(posts);
  }, [posts]);

  // 時間軸マーカーデータを生成
  const markerData = useMemo((): TimelineMarkerData[] => {
    const markers = generateTimelineMarkers(posts, timeRange);
    return optimizeMarkerPositions(markers);
  }, [posts, timeRange]);

  // マーカークリックハンドラー
  const handleMarkerClick = (postIds: string[]) => {
    // 複数の投稿がある場合は最初の投稿を選択
    const postId = postIds.length > 0 ? postIds[0] : null;
    onPostSelect?.(postId);
  };

  // マーカーホバーハンドラー（ハイライト機能）
  const handleMarkerHover = useCallback((postIds: string[]) => {
    // ハイライト状態を更新
    if (onHighlightChange) {
      onHighlightChange(postIds);
    }
  }, [onHighlightChange]);

  // マーカーホバー終了ハンドラー
  const handleMarkerHoverEnd = useCallback(() => {
    // ハイライト状態をクリア
    if (onHighlightChange) {
      onHighlightChange([]);
    }
  }, [onHighlightChange]);

  return (
    <div className="h-full flex flex-col">
      {/* ヘッダー */}
      <div className={`flex-shrink-0 ${isMobile ? 'mb-2' : 'mb-4'}`}>
        <div className="flex items-center justify-between">
          <h2 className={`font-semibold text-gray-800 ${
            isMobile ? 'text-sm' : 'text-lg'
          }`}>
            タイムライン
          </h2>
          {posts.length > 0 && (
            <span className={`text-gray-600 ${
              isMobile ? 'text-xs' : 'text-sm'
            }`}>
              {posts.length}件
            </span>
          )}
        </div>
      </div>

      {/* 時間軸エリア */}
      <div className="flex-1 min-h-0">
        {posts.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className={`mx-auto mb-2 text-gray-300 ${
                isMobile ? 'w-8 h-8' : 'w-12 h-12'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={isMobile ? 'text-xs' : 'text-sm'}>
                投稿がありません
              </p>
              {!isMobile && (
                <p className="text-xs mt-1 text-gray-400">
                  右側から投稿を作成してください
                </p>
              )}
            </div>
          </div>
        ) : (
          <TimelineAxis
            timeRange={timeRange}
            markers={markerData}
            posts={posts}
            selectedPostId={selectedPostId}
            highlightedPostIds={highlightedPostIds}
            onMarkerClick={handleMarkerClick}
            onMarkerHover={handleMarkerHover}
            onMarkerHoverEnd={handleMarkerHoverEnd}
            isMobile={isMobile}
            isTouchDevice={isTouchDevice}
          />
        )}
      </div>
    </div>
  );
};

// React.memoでコンポーネントをメモ化してパフォーマンス最適化
export default memo(TimelinePanel);