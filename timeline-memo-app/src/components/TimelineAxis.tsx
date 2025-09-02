import React, { useMemo, useState } from 'react';
import type { TimelineMarkerData, Post } from '../types';
import TimelineMarker from './TimelineMarker';
import { 
  generateTimeLabels, 
  isCurrentTimeInRange, 
  getCurrentTimePosition 
} from '../utils/timelineUtils';

interface TimelineAxisProps {
  timeRange: {
    start: Date;
    end: Date;
  };
  markers: TimelineMarkerData[];
  posts: Post[]; // プレビュー表示用の投稿データ
  selectedPostId?: string | null;
  highlightedPostIds?: string[];
  onMarkerClick?: (postIds: string[]) => void;
  onMarkerHover?: (postIds: string[]) => void;
  onMarkerHoverEnd?: () => void;
  isMobile?: boolean;
  isTouchDevice?: boolean;
}

/**
 * 時間軸コンポーネント
 * 縦の時間軸ラインと時間ラベル、マーカーを表示
 * レスポンシブデザインとタッチデバイス対応
 * 要件5.1, 6.1, 6.2, 6.3に対応
 */
const TimelineAxis: React.FC<TimelineAxisProps> = ({
  timeRange,
  markers,
  posts,
  selectedPostId,
  highlightedPostIds = [],
  onMarkerClick,
  onMarkerHover,
  onMarkerHoverEnd,
  isMobile = false,
  isTouchDevice = false
}) => {
  // ホバー状態の管理
  const [hoveredPostIds, setHoveredPostIds] = useState<string[]>([]);

  // 時間ラベルを生成
  const timeLabels = useMemo(() => {
    return generateTimeLabels(timeRange);
  }, [timeRange]);

  // マーカークリックハンドラー
  const handleMarkerClick = (postIds: string[]) => {
    onMarkerClick?.(postIds);
  };

  // マーカーホバー開始ハンドラー
  const handleMarkerHover = (postIds: string[]) => {
    setHoveredPostIds(postIds);
    onMarkerHover?.(postIds);
  };

  // マーカーホバー終了ハンドラー
  const handleMarkerHoverEnd = () => {
    setHoveredPostIds([]);
    onMarkerHoverEnd?.();
  };

  // レスポンシブ対応のスタイル計算
  const getAxisLineClasses = () => {
    const leftPosition = isMobile ? 'left-6' : 'left-8';
    const padding = isMobile ? 'top-2 bottom-2' : 'top-4 bottom-4';
    return `absolute ${leftPosition} ${padding} w-0.5 bg-gray-300`;
  };

  const getLabelLineClasses = () => {
    const width = isMobile ? 'w-4' : 'w-6';
    const margin = isMobile ? 'ml-1' : 'ml-2';
    return `${width} h-0.5 bg-gray-400 ${margin}`;
  };

  const getLabelTextClasses = () => {
    const size = isMobile ? 'text-xs' : 'text-xs';
    const margin = isMobile ? 'ml-1' : 'ml-2';
    return `${margin} ${size} text-gray-600 whitespace-nowrap`;
  };

  const getCurrentTimeIndicatorClasses = () => {
    const margin = isMobile ? 'ml-4' : 'ml-6';
    const size = isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2';
    return `${margin} ${size} bg-red-500 rounded-full animate-pulse`;
  };

  return (
    <div className={`relative h-full w-full ${isTouchDevice ? 'touch-manipulation' : ''}`}>
      {/* 時間軸ライン */}
      <div className={getAxisLineClasses()}></div>
      
      {/* 時間ラベル */}
      <div className="absolute left-0 top-0 bottom-0 w-full">
        {timeLabels.map((label, index) => (
          <div
            key={index}
            className="absolute flex items-center"
            style={{ top: `${label.position}%` }}
          >
            {/* ラベル用の短い横線 */}
            <div className={getLabelLineClasses()}></div>
            
            {/* 時間テキスト */}
            <span className={getLabelTextClasses()}>
              {isMobile ? label.shortLabel || label.label : label.label}
            </span>
          </div>
        ))}
      </div>
      
      {/* 投稿マーカー */}
      <div className="absolute left-0 top-0 bottom-0 w-full">
        {markers.map((marker, index) => {
          // マーカーの状態を判定
          const isSelected = Boolean(selectedPostId && marker.postIds.includes(selectedPostId));
          const isHighlighted = highlightedPostIds.some(id => marker.postIds.includes(id)) ||
                               hoveredPostIds.some(id => marker.postIds.includes(id));
          
          return (
            <TimelineMarker
              key={`marker-${index}-${marker.postIds.join('-')}`}
              marker={marker}
              posts={posts}
              isSelected={isSelected}
              isHighlighted={isHighlighted}
              onClick={handleMarkerClick}
              onHover={handleMarkerHover}
              onHoverEnd={handleMarkerHoverEnd}
              isMobile={isMobile}
              isTouchDevice={isTouchDevice}
            />
          );
        })}
      </div>
      
      {/* 現在時刻インジケーター（現在時刻が表示範囲内の場合） */}
      {isCurrentTimeInRange(timeRange) && (
        <div
          className="absolute flex items-center"
          style={{ top: `${getCurrentTimePosition(timeRange)}%` }}
        >
          <div className={getCurrentTimeIndicatorClasses()}></div>
          <span className={`${isMobile ? 'ml-1 text-xs' : 'ml-2 text-xs'} text-red-600 font-medium`}>
            {isMobile ? '今' : '現在'}
          </span>
        </div>
      )}
    </div>
  );
};

export default TimelineAxis;