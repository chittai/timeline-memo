import React, { useCallback, useState, useEffect } from 'react';
import Header from './Header';
import PostListPanel from './PostListPanel';
import TimelinePanel from './TimelinePanel';
import DiaryView from './DiaryView';
import CalendarView from './CalendarView';
import { ViewModeSelector } from './ViewModeSelector';
import MotivationPanel from './MotivationPanel';
import { DiaryStatsPanel } from './DiaryStatsPanel';
import { useAppContext } from '../context/AppContext';
import { useDiary } from '../hooks/useDiary';
import { useCalendar } from '../hooks/useCalendar';
import { useStats } from '../hooks/useStats';
import type { ViewMode, DateRange } from '../types';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * メインレイアウトコンポーネント
 * レスポンシブデザインと双方向連携機能を提供
 * 要件4.1, 4.4, 4.5, 5.5, 5.6, 6.1, 6.2, 6.3に対応
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { state, dispatch } = useAppContext();
  const { selectedPostId, highlightedPostIds, viewMode, selectedDate } = state;
  
  // 日記機能用のhooks
  const { 
    diaryEntries, 
    applyDateRangeFilter 
  } = useDiary();
  const { 
    currentYear, 
    currentMonth, 
    calendarData,
    goToMonth 
  } = useCalendar();
  const { 
    stats, 
    isLoading: statsLoading 
  } = useStats();
  
  // 日付フィルタリング用の状態
  const [currentDateRange, setCurrentDateRange] = useState<DateRange | null>(null);
  
  // 画面サイズの状態管理
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');

  // 画面サイズとデバイス情報の検出
  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // 画面サイズの判定
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
      
      // 向きの判定
      setOrientation(width > height ? 'landscape' : 'portrait');
      
      // タッチデバイスの判定
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    // 初期設定
    updateScreenInfo();

    // リサイズイベントリスナー
    const handleResize = () => {
      updateScreenInfo();
    };

    // オリエンテーション変更イベントリスナー
    const handleOrientationChange = () => {
      // オリエンテーション変更後に少し遅延してサイズを再計算
      setTimeout(updateScreenInfo, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // 投稿選択ハンドラー（時間軸からの選択）
  const handlePostSelect = useCallback((postId: string | null) => {
    dispatch({ type: 'SELECT_POST', payload: postId });
  }, [dispatch]);

  // ハイライト変更ハンドラー（リストからのハイライト）
  const handleHighlightChange = useCallback((postIds: string[]) => {
    dispatch({ type: 'HIGHLIGHT_POSTS', payload: postIds });
  }, [dispatch]);

  // スクロール変更ハンドラー（将来の拡張用）
  const handleScrollChange = useCallback((percentage: number) => {
    // 将来的に時間軸の表示範囲調整などで使用予定
    console.log('Scroll percentage:', percentage);
  }, []);

  // ビューモード変更ハンドラー
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  }, [dispatch]);

  // 日付選択ハンドラー（カレンダービュー用）
  const handleDateSelect = useCallback((date: Date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  }, [dispatch]);

  // 月変更ハンドラー（カレンダービュー用）
  const handleMonthChange = useCallback((year: number, month: number) => {
    goToMonth(year, month);
  }, [goToMonth]);

  // 日付範囲フィルター変更ハンドラー
  const handleDateRangeChange = useCallback(async (range: DateRange | null) => {
    setCurrentDateRange(range);
    await applyDateRangeFilter(range);
  }, [applyDateRangeFilter]);
  // レイアウトクラスの動的生成
  const getLayoutClasses = () => {
    const baseClasses = "min-h-screen bg-gray-50";
    const touchClasses = isTouchDevice ? "touch-device" : "";
    return `${baseClasses} ${touchClasses}`.trim();
  };

  // コンテナクラスの動的生成
  const getContainerClasses = () => {
    const baseClasses = "container mx-auto px-4 py-6";
    
    switch (screenSize) {
      case 'mobile':
        return `${baseClasses} px-2 py-4 max-w-full`;
      case 'tablet':
        return `${baseClasses} px-6 max-w-6xl`;
      case 'desktop':
      default:
        return `${baseClasses} max-w-7xl`;
    }
  };

  // パネル高さの動的計算
  const getPanelHeight = () => {
    switch (screenSize) {
      case 'mobile':
        return orientation === 'portrait' 
          ? 'h-[calc(100vh-12rem)]' 
          : 'h-[calc(100vh-8rem)]';
      case 'tablet':
        return 'h-[calc(100vh-7rem)]';
      case 'desktop':
      default:
        return 'h-[calc(100vh-8rem)]';
    }
  };

  // 時間軸パネルの高さ（モバイル用）
  const getTimelinePanelHeight = () => {
    if (screenSize !== 'mobile') return 'h-48';
    
    return orientation === 'portrait' ? 'h-40' : 'h-32';
  };

  return (
    <div className={getLayoutClasses()}>
      {/* ヘッダー */}
      <Header />
      
      {/* メインコンテンツエリア */}
      <main className={getContainerClasses()}>
        {/* ビューモードセレクター */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <ViewModeSelector
              currentMode={viewMode}
              onModeChange={handleViewModeChange}
            />
          </div>
        </div>

        {/* 継続促進パネル */}
        <div className="mb-6">
          <MotivationPanel />
        </div>

        {/* ビューモードに応じたコンテンツ表示 */}
        {(viewMode === 'timeline' || viewMode === 'list') && (
          <>
            {/* デスクトップ・タブレット: 左右分割レイアウト */}
            {screenSize !== 'mobile' && (
              <div className={`flex ${getPanelHeight()} gap-4 lg:gap-6`}>
                {/* 左側パネル: 時間軸エリア（timelineモードのみ） */}
                {viewMode === 'timeline' && (
                  <div className={`flex-shrink-0 ${
                    screenSize === 'tablet' ? 'w-64' : 'w-80 lg:w-96'
                  }`}>
                    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 h-full ${
                      screenSize === 'tablet' ? 'p-3' : 'p-4'
                    }`}>
                      <TimelinePanel
                        selectedPostId={selectedPostId}
                        highlightedPostIds={highlightedPostIds}
                        onPostSelect={handlePostSelect}
                        onScrollChange={handleScrollChange}
                        onHighlightChange={handleHighlightChange}
                      />
                    </div>
                  </div>
                )}
                
                {/* 右側パネル: 投稿リストエリア */}
                <div className="flex-1 min-w-0">
                  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 h-full ${
                    screenSize === 'tablet' ? 'p-3' : 'p-4'
                  }`}>
                    <PostListPanel
                      selectedPostId={selectedPostId}
                      onPostSelect={handlePostSelect}
                      onScrollChange={handleScrollChange}
                      onHighlightChange={handleHighlightChange}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* モバイル: 上下分割レイアウト */}
            {screenSize === 'mobile' && (
              <div className="space-y-3">
                {/* 上部: 時間軸エリア（timelineモードのみ） */}
                {viewMode === 'timeline' && (
                  <div className={getTimelinePanelHeight()}>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full p-3">
                      <TimelinePanel
                        selectedPostId={selectedPostId}
                        highlightedPostIds={highlightedPostIds}
                        onPostSelect={handlePostSelect}
                        onScrollChange={handleScrollChange}
                        onHighlightChange={handleHighlightChange}
                      />
                    </div>
                  </div>
                )}
                
                {/* 下部: 投稿リストエリア */}
                <div className={`${getPanelHeight()}`}>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full p-3">
                    <PostListPanel
                      selectedPostId={selectedPostId}
                      onPostSelect={handlePostSelect}
                      onScrollChange={handleScrollChange}
                      onHighlightChange={handleHighlightChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 日記ビュー */}
        {viewMode === 'diary' && (
          <>
            {/* デスクトップ・タブレット: 左右分割レイアウト（統計パネル付き） */}
            {screenSize !== 'mobile' && (
              <div className={`flex ${getPanelHeight()} gap-4 lg:gap-6`}>
                {/* 左側: 日記ビュー */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full p-4">
                    <DiaryView
                      entries={diaryEntries}
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                      onPostSelect={handlePostSelect}
                      selectedPostId={selectedPostId}
                      showDateFilter={true}
                      onDateRangeChange={handleDateRangeChange}
                      currentDateRange={currentDateRange}
                    />
                  </div>
                </div>
                
                {/* 右側: 統計パネル */}
                <div className={`flex-shrink-0 ${screenSize === 'tablet' ? 'w-64' : 'w-80'}`}>
                  <DiaryStatsPanel
                    stats={stats}
                    isLoading={statsLoading}
                  />
                </div>
              </div>
            )}
            
            {/* モバイル: 上下分割レイアウト */}
            {screenSize === 'mobile' && (
              <div className="space-y-3">
                {/* 上部: 統計パネル（コンパクト表示） */}
                <div className="h-48">
                  <DiaryStatsPanel
                    stats={stats}
                    isLoading={statsLoading}
                  />
                </div>
                
                {/* 下部: 日記ビュー */}
                <div className={`${getPanelHeight()}`}>
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full p-3">
                    <DiaryView
                      entries={diaryEntries}
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                      onPostSelect={handlePostSelect}
                      selectedPostId={selectedPostId}
                      showDateFilter={true}
                      onDateRangeChange={handleDateRangeChange}
                      currentDateRange={currentDateRange}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* カレンダービュー */}
        {viewMode === 'calendar' && (
          <div className={`${getPanelHeight()}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full p-4">
              <CalendarView
                year={currentYear}
                month={currentMonth}
                calendarData={calendarData}
                selectedDate={selectedDate || undefined}
                onDateClick={handleDateSelect}
                onMonthChange={handleMonthChange}
              />
            </div>
          </div>
        )}
        
        {/* 子コンポーネント（モーダルなど） */}
        {children}
      </main>
    </div>
  );
};

export default MainLayout;