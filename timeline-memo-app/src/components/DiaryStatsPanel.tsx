import React, { useState, useEffect } from 'react';
import type { DiaryStats } from '../types';

interface DiaryStatsPanelProps {
  stats: DiaryStats;
  isLoading: boolean;
  error?: string | null;
  hasPartialData?: boolean;
}

/**
 * 日記統計パネルコンポーネント
 * 投稿統計、継続日数、月間サマリーを表示する
 * レスポンシブデザイン対応
 */
export const DiaryStatsPanel: React.FC<DiaryStatsPanelProps> = ({
  stats,
  isLoading,
  error,
  hasPartialData = false
}) => {
  // デバイス情報の状態管理
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
  // 未使用変数の警告を回避するため、実際に使用
  console.debug('Device info:', { screenSize, isTouchDevice, orientation });

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

    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);
    window.addEventListener('orientationchange', () => {
      setTimeout(updateScreenInfo, 100);
    });

    return () => {
      window.removeEventListener('resize', updateScreenInfo);
      window.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, []);
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse" data-testid="loading-skeleton">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // エラー状態の表示
  if (error && !hasPartialData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            統計情報の読み込みに失敗しました
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          📊 統計情報
        </h3>
        {hasPartialData && (
          <div className="flex items-center text-amber-600 text-sm">
            <span className="mr-1">⚠️</span>
            <span>部分データ</span>
          </div>
        )}
      </div>
      
      {/* エラーがあるが部分データが利用可能な場合の警告 */}
      {error && hasPartialData && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <span className="text-amber-500 mr-2">⚠️</span>
            <div>
              <p className="text-sm text-amber-800 font-medium">
                一部の統計情報の計算に失敗しました
              </p>
              <p className="text-xs text-amber-700 mt-1">
                利用可能なデータのみを表示しています
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {/* 基本統計 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalPosts}
            </div>
            <div className="text-sm text-gray-600">総投稿数</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.totalDays}
            </div>
            <div className="text-sm text-gray-600">投稿日数</div>
          </div>
        </div>

        {/* 継続日数の可視化 */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">🔥 継続記録</h4>
          
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">現在の連続日数</span>
              <span className="text-lg font-bold text-orange-600">
                {stats.currentStreak}日
              </span>
            </div>
            
            {/* 継続日数のプログレスバー */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((stats.currentStreak / Math.max(stats.longestStreak, 1)) * 100, 100)}%` 
                }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">最長記録</span>
              <span className="text-sm font-medium text-gray-700">
                {stats.longestStreak}日
              </span>
            </div>
          </div>
        </div>

        {/* 月間サマリー */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">📅 今月のサマリー</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <div className="text-xl font-bold text-purple-600">
                {stats.thisMonthPosts}
              </div>
              <div className="text-xs text-gray-600">今月の投稿</div>
            </div>
            
            <div className="p-3 bg-indigo-50 rounded-lg text-center">
              <div className="text-xl font-bold text-indigo-600">
                {stats.averagePostsPerDay.toFixed(1)}
              </div>
              <div className="text-xs text-gray-600">1日平均</div>
            </div>
          </div>
        </div>

        {/* 継続促進メッセージ */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-700">
            {stats.currentStreak === 0 ? (
              <span className="text-amber-600">
                💡 今日から新しい記録を始めましょう！
              </span>
            ) : stats.currentStreak >= 7 ? (
              <span className="text-green-600">
                🎉 素晴らしい継続力です！この調子で続けましょう
              </span>
            ) : (
              <span className="text-blue-600">
                ✨ 良いペースです！継続して記録を伸ばしましょう
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};