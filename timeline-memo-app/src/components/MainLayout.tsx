import React, { useCallback, useState, useEffect } from 'react';
import Header from './Header';
import PostListPanel from './PostListPanel';
import TimelinePanel from './TimelinePanel';
import { useAppContext } from '../context/AppContext';

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
  const { selectedPostId, highlightedPostIds } = state;
  
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
        {/* デスクトップ・タブレット: 左右分割レイアウト */}
        {screenSize !== 'mobile' && (
          <div className={`flex ${getPanelHeight()} gap-4 lg:gap-6`}>
            {/* 左側パネル: 時間軸エリア */}
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
            {/* 上部: 時間軸エリア */}
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
        
        {/* 子コンポーネント（モーダルなど） */}
        {children}
      </main>
    </div>
  );
};

export default MainLayout;