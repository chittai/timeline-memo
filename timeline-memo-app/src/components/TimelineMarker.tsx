import React, { useState, useRef, memo, useMemo, useCallback } from 'react';
import type { TimelineMarkerData, Post } from '../types';
import PostPreview from './PostPreview';

interface TimelineMarkerProps {
  marker: TimelineMarkerData;
  posts: Post[]; // プレビュー表示用の投稿データ
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: (postIds: string[]) => void;
  onHover?: (postIds: string[]) => void;
  onHoverEnd?: () => void;
  isMobile?: boolean;
  isTouchDevice?: boolean;
}

/**
 * 時間軸マーカーコンポーネント
 * 投稿時刻に基づくマーカーを表示し、レスポンシブデザインとタッチデバイス対応
 * 要件5.2, 5.4, 6.1, 6.2, 6.3に対応
 */
const TimelineMarker: React.FC<TimelineMarkerProps> = ({
  marker,
  posts,
  isSelected = false,
  isHighlighted = false,
  onClick,
  onHover,
  onHoverEnd,
  isMobile = false,
  isTouchDevice: propIsTouchDevice
}) => {
  // プレビュー表示の状態管理
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const markerRef = useRef<HTMLDivElement>(null);
  
  // タッチデバイスの判定（propsから受け取るか自動検出）
  const [detectedTouchDevice, setDetectedTouchDevice] = useState(false);
  const isTouchDevice = propIsTouchDevice ?? detectedTouchDevice;
  
  // 複数投稿があるかどうか - useMemoでメモ化
  const hasMultiplePosts = useMemo(() => marker.postIds.length > 1, [marker.postIds.length]);
  
  // このマーカーに関連する投稿を取得 - useMemoでメモ化
  const markerPosts = useMemo(() => 
    posts.filter(post => marker.postIds.includes(post.id)), 
    [posts, marker.postIds]
  );
  
  // タッチデバイスの検出（propsで指定されていない場合）
  React.useEffect(() => {
    if (propIsTouchDevice !== undefined) return;
    
    const checkTouchDevice = () => {
      const hasTouch = 'ontouchstart' in window || 
                      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
                      ('msMaxTouchPoints' in navigator && (navigator as { msMaxTouchPoints: number }).msMaxTouchPoints > 0);
      setDetectedTouchDevice(hasTouch);
    };
    
    checkTouchDevice();
    window.addEventListener('resize', checkTouchDevice);
    
    return () => window.removeEventListener('resize', checkTouchDevice);
  }, [propIsTouchDevice]);

  // プレビュー位置を計算 - useCallbackでメモ化
  const calculatePreviewPosition = useCallback(() => {
    if (!markerRef.current) return { x: 0, y: 0 };
    
    const rect = markerRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top - 10 // マーカーの少し上に表示
    };
  }, []);

  // クリックハンドラー - useCallbackでメモ化
  const handleClick = useCallback(() => {
    if (isTouchDevice) {
      // タッチデバイスではクリックでプレビューを切り替え
      if (showPreview) {
        setShowPreview(false);
      } else {
        setPreviewPosition(calculatePreviewPosition());
        setShowPreview(true);
      }
    }
    
    // 親コンポーネントのクリックハンドラーを呼び出し
    onClick?.(marker.postIds);
  }, [isTouchDevice, showPreview, calculatePreviewPosition, onClick, marker.postIds]);

  // ホバー開始ハンドラー（デスクトップのみ）
  const handleMouseEnter = () => {
    if (!isTouchDevice) {
      setPreviewPosition(calculatePreviewPosition());
      setShowPreview(true);
    }
    onHover?.(marker.postIds);
  };

  // ホバー終了ハンドラー（デスクトップのみ）
  const handleMouseLeave = () => {
    if (!isTouchDevice) {
      setShowPreview(false);
    }
    onHoverEnd?.();
  };

  // タッチデバイスでのプレビュー非表示（外部クリック）
  React.useEffect(() => {
    if (!isTouchDevice || !showPreview) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (markerRef.current && !markerRef.current.contains(event.target as Node)) {
        setShowPreview(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTouchDevice, showPreview]);

  // マーカーのスタイルクラスを決定（レスポンシブ対応）
  const getMarkerClasses = () => {
    const baseClasses = 'rounded-full border-2 transition-all duration-200 cursor-pointer';
    const touchClasses = isTouchDevice ? 'touch-manipulation' : '';
    
    // モバイルでは少し大きめのマーカーサイズ
    const sizeClasses = {
      selected: isMobile ? 'w-4 h-4' : 'w-3 h-3',
      highlighted: isMobile ? 'w-3 h-3' : 'w-2.5 h-2.5',
      normal: isMobile ? 'w-2.5 h-2.5' : 'w-2 h-2',
      hover: isMobile ? 'hover:w-3 hover:h-3' : 'hover:w-2.5 hover:h-2.5'
    };
    
    if (isSelected) {
      return `${baseClasses} ${touchClasses} ${sizeClasses.selected} bg-blue-500 border-blue-600 shadow-lg`;
    }
    
    if (isHighlighted) {
      return `${baseClasses} ${touchClasses} ${sizeClasses.highlighted} bg-blue-100 border-blue-400 shadow-md`;
    }
    
    return `${baseClasses} ${touchClasses} ${sizeClasses.normal} bg-white border-gray-400 hover:border-blue-400 hover:bg-blue-50 ${sizeClasses.hover}`;
  };

  // 複数投稿インジケーターのスタイル
  const getMultiplePostsIndicatorClasses = () => {
    if (isSelected) {
      return 'ring-2 ring-blue-300 ring-offset-1';
    }
    if (isHighlighted) {
      return 'ring-2 ring-blue-200';
    }
    return 'hover:ring-2 hover:ring-blue-200';
  };

  // マーカーの左マージンを動的に設定
  const getMarkerMargin = () => {
    return isMobile ? 'ml-4' : 'ml-6';
  };

  // 複数投稿インジケーターのテキストサイズ
  const getIndicatorTextSize = () => {
    return isMobile ? 'text-xs' : 'text-xs';
  };

  return (
    <>
      <div
        ref={markerRef}
        className="absolute flex items-center group"
        style={{ top: `${marker.position}%` }}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* マーカードット */}
        <div
          className={`
            ${getMarkerMargin()} ${getMarkerClasses()}
            ${hasMultiplePosts ? getMultiplePostsIndicatorClasses() : ''}
          `}
        />
        
        {/* 複数投稿インジケーター */}
        {hasMultiplePosts && (
          <span 
            className={`
              ${isMobile ? 'ml-1' : 'ml-2'} ${getIndicatorTextSize()} font-medium transition-colors duration-200
              ${isSelected 
                ? 'text-blue-700' 
                : isHighlighted 
                  ? 'text-blue-600' 
                  : 'text-blue-500 group-hover:text-blue-600'
              }
            `}
          >
            {marker.postIds.length}
          </span>
        )}
        
        {/* ホバー時の時刻表示（デスクトップのみ） */}
        {!isMobile && (
          <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <span className="text-xs text-gray-700 bg-white px-2 py-1 rounded shadow-sm border whitespace-nowrap">
              {marker.timestamp.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
              })}
              {hasMultiplePosts && (
                <span className="ml-1 text-blue-600">
                  ({marker.postIds.length}件)
                </span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* 投稿プレビュー */}
      <PostPreview
        posts={markerPosts}
        position={previewPosition}
        isVisible={showPreview}
        isMobile={isMobile}
        isTouchDevice={isTouchDevice}
      />
    </>
  );
};

// React.memoでコンポーネントをメモ化してパフォーマンス最適化
export default memo(TimelineMarker);