import React from 'react';
import { render, screen } from '@testing-library/react';
import { DiaryStatsPanel } from '../DiaryStatsPanel';
import { DiaryStats } from '../../types';

describe('DiaryStatsPanel', () => {
  const mockStats: DiaryStats = {
    totalPosts: 25,
    totalDays: 15,
    currentStreak: 5,
    longestStreak: 10,
    thisMonthPosts: 8,
    averagePostsPerDay: 1.7
  };

  it('ローディング状態を正しく表示する', () => {
    render(<DiaryStatsPanel stats={mockStats} isLoading={true} />);
    
    // ローディングアニメーションが表示されることを確認
    const loadingElement = screen.getByTestId('loading-skeleton');
    expect(loadingElement).toHaveClass('animate-pulse');
  });

  it('統計情報を正しく表示する', () => {
    render(<DiaryStatsPanel stats={mockStats} isLoading={false} />);
    
    // タイトルの確認
    expect(screen.getByText('📊 統計情報')).toBeInTheDocument();
    
    // 基本統計の確認
    expect(screen.getByText('25')).toBeInTheDocument(); // 総投稿数
    expect(screen.getByText('総投稿数')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // 投稿日数
    expect(screen.getByText('投稿日数')).toBeInTheDocument();
  });

  it('継続記録を正しく表示する', () => {
    render(<DiaryStatsPanel stats={mockStats} isLoading={false} />);
    
    // 継続記録セクションの確認
    expect(screen.getByText('🔥 継続記録')).toBeInTheDocument();
    expect(screen.getByText('現在の連続日数')).toBeInTheDocument();
    expect(screen.getByText('5日')).toBeInTheDocument();
    expect(screen.getByText('最長記録')).toBeInTheDocument();
    expect(screen.getByText('10日')).toBeInTheDocument();
  });

  it('月間サマリーを正しく表示する', () => {
    render(<DiaryStatsPanel stats={mockStats} isLoading={false} />);
    
    // 月間サマリーセクションの確認
    expect(screen.getByText('📅 今月のサマリー')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument(); // 今月の投稿
    expect(screen.getByText('今月の投稿')).toBeInTheDocument();
    expect(screen.getByText('1.7')).toBeInTheDocument(); // 1日平均
    expect(screen.getByText('1日平均')).toBeInTheDocument();
  });

  it('継続日数が0の場合の促進メッセージを表示する', () => {
    const zeroStreakStats: DiaryStats = {
      ...mockStats,
      currentStreak: 0
    };
    
    render(<DiaryStatsPanel stats={zeroStreakStats} isLoading={false} />);
    
    expect(screen.getByText('💡 今日から新しい記録を始めましょう！')).toBeInTheDocument();
  });

  it('継続日数が7日以上の場合の祝福メッセージを表示する', () => {
    const longStreakStats: DiaryStats = {
      ...mockStats,
      currentStreak: 10
    };
    
    render(<DiaryStatsPanel stats={longStreakStats} isLoading={false} />);
    
    expect(screen.getByText('🎉 素晴らしい継続力です！この調子で続けましょう')).toBeInTheDocument();
  });

  it('継続日数が1-6日の場合の励ましメッセージを表示する', () => {
    render(<DiaryStatsPanel stats={mockStats} isLoading={false} />);
    
    expect(screen.getByText('✨ 良いペースです！継続して記録を伸ばしましょう')).toBeInTheDocument();
  });

  it('継続日数のプログレスバーが正しく表示される', () => {
    render(<DiaryStatsPanel stats={mockStats} isLoading={false} />);
    
    // プログレスバーの存在確認（より具体的なセレクターを使用）
    const progressContainer = screen.getByText('現在の連続日数').closest('.p-3');
    const progressFill = progressContainer?.querySelector('.bg-orange-500');
    
    expect(progressFill).toBeInTheDocument();
    // 現在の継続日数(5) / 最長記録(10) * 100 = 50%
    expect(progressFill).toHaveStyle('width: 50%');
  });

  it('最長記録が0の場合でもエラーが発生しない', () => {
    const noStreakStats: DiaryStats = {
      ...mockStats,
      currentStreak: 0,
      longestStreak: 0
    };
    
    expect(() => {
      render(<DiaryStatsPanel stats={noStreakStats} isLoading={false} />);
    }).not.toThrow();
    
    // 複数の「0日」があるので、より具体的にテスト
    expect(screen.getByText('現在の連続日数')).toBeInTheDocument();
    expect(screen.getByText('最長記録')).toBeInTheDocument();
    const allZeroDays = screen.getAllByText('0日');
    expect(allZeroDays).toHaveLength(2); // 現在の連続日数と最長記録の両方
  });

  it('平均投稿数が小数点以下1桁で表示される', () => {
    const preciseStats: DiaryStats = {
      ...mockStats,
      averagePostsPerDay: 2.3456789
    };
    
    render(<DiaryStatsPanel stats={preciseStats} isLoading={false} />);
    
    expect(screen.getByText('2.3')).toBeInTheDocument();
  });
});