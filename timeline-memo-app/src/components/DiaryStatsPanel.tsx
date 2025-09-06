import React from 'react';
import type { DiaryStats } from '../types';

interface DiaryStatsPanelProps {
  stats: DiaryStats;
  isLoading: boolean;
}

/**
 * 日記統計パネルコンポーネント
 * 投稿統計、継続日数、月間サマリーを表示する
 */
export const DiaryStatsPanel: React.FC<DiaryStatsPanelProps> = ({
  stats,
  isLoading
}) => {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📊 統計情報
      </h3>
      
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