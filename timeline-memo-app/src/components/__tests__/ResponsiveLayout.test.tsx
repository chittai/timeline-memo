import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import CalendarView from '../CalendarView';
import { DiaryStatsPanel } from '../DiaryStatsPanel';
import { ViewModeSelector } from '../ViewModeSelector';
import type { CalendarDay, DiaryStats, ViewMode } from '../../types';

// モックデータ
const mockCalendarData: CalendarDay[] = [
  {
    date: new Date('2024-01-01'),
    hasPost: true,
    postCount: 3,
    isToday: false
  },
  {
    date: new Date('2024-01-02'),
    hasPost: false,
    postCount: 0,
    isToday: true
  }
];

const mockStats: DiaryStats = {
  totalPosts: 150,
  totalDays: 45,
  currentStreak: 7,
  longestStreak: 21,
  thisMonthPosts: 25,
  averagePostsPerDay: 3.3
};

// ウィンドウサイズのモック
const mockWindowSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // リサイズイベントを発火
  fireEvent(window, new Event('resize'));
};

// オリエンテーション変更のモック
const mockOrientationChange = () => {
  fireEvent(window, new Event('orientationchange'));
};

describe('レスポンシブレイアウトのテスト', () => {
  beforeEach(() => {
    // デフォルトのウィンドウサイズを設定
    mockWindowSize(1024, 768);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('CalendarView レスポンシブ対応', () => {
    const defaultProps = {
      year: 2024,
      month: 1,
      calendarData: mockCalendarData,
      onDateClick: vi.fn(),
      onMonthChange: vi.fn()
    };

    it('デスクトップサイズで正常に表示される', () => {
      mockWindowSize(1200, 800);
      render(<CalendarView {...defaultProps} />);
      
      expect(screen.getByText('2024年 1月')).toBeInTheDocument();
      expect(screen.getByText('今日')).toBeInTheDocument();
      expect(screen.getByText('投稿あり')).toBeInTheDocument();
    });

    it('タブレットサイズで適切にレイアウトが調整される', async () => {
      mockWindowSize(800, 600);
      render(<CalendarView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('2024年 1月')).toBeInTheDocument();
      });
    });

    it('モバイルサイズ（縦向き）で適切にレイアウトが調整される', async () => {
      mockWindowSize(375, 667);
      render(<CalendarView {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('2024年 1月')).toBeInTheDocument();
      });
    });

    it('モバイルサイズ（横向き）で適切にレイアウトが調整される', async () => {
      mockWindowSize(667, 375);
      render(<CalendarView {...defaultProps} />);
      
      await waitFor(() => {
        // 横向きモバイルでは短縮表示
        expect(screen.getByText('2024/1')).toBeInTheDocument();
      });
    });

    it('オリエンテーション変更に対応する', async () => {
      mockWindowSize(375, 667);
      render(<CalendarView {...defaultProps} />);
      
      // 縦向きから横向きに変更
      mockWindowSize(667, 375);
      mockOrientationChange();
      
      await waitFor(() => {
        expect(screen.getByText('2024/1')).toBeInTheDocument();
      });
    });
  });

  describe('DiaryStatsPanel レスポンシブ対応', () => {
    const defaultProps = {
      stats: mockStats,
      isLoading: false
    };

    it('デスクトップサイズで正常に表示される', () => {
      mockWindowSize(1200, 800);
      render(<DiaryStatsPanel {...defaultProps} />);
      
      expect(screen.getByText('📊 統計情報')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('モバイルサイズで適切にレイアウトが調整される', async () => {
      mockWindowSize(375, 667);
      render(<DiaryStatsPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('📊 統計情報')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });

    it('ローディング状態でモバイル対応のスケルトンが表示される', async () => {
      mockWindowSize(375, 667);
      render(<DiaryStatsPanel stats={mockStats} isLoading={true} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      });
    });
  });

  describe('ViewModeSelector レスポンシブ対応', () => {
    const defaultProps = {
      currentMode: 'diary' as ViewMode,
      onModeChange: vi.fn()
    };

    it('デスクトップサイズで全てのモードボタンが表示される', () => {
      mockWindowSize(1200, 800);
      render(<ViewModeSelector {...defaultProps} />);
      
      expect(screen.getByText('タイムライン')).toBeInTheDocument();
      expect(screen.getByText('リスト')).toBeInTheDocument();
      expect(screen.getAllByText('日記')).toHaveLength(2); // 現在のモード表示とボタンの両方
      expect(screen.getByText('カレンダー')).toBeInTheDocument();
    });

    it('モバイルサイズ（縦向き）でセレクトボックスが表示される', async () => {
      mockWindowSize(375, 667);
      render(<ViewModeSelector {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('表示モード選択')).toBeInTheDocument();
      });
    });

    it('モバイルサイズ（横向き）で短縮ラベルが表示される', async () => {
      mockWindowSize(667, 375);
      render(<ViewModeSelector {...defaultProps} />);
      
      await waitFor(() => {
        // 横向きモバイルでは短縮表示（実際の実装に合わせて修正）
        expect(screen.getByText('タイ')).toBeInTheDocument(); // タイムライン → タイ
        expect(screen.getByText('リス')).toBeInTheDocument(); // リスト → リス
        expect(screen.getByText('日')).toBeInTheDocument(); // 日記 → 日
        expect(screen.getByText('カレ')).toBeInTheDocument(); // カレンダー → カレ
      });
    });

    it('モードの切り替えが正常に動作する', async () => {
      mockWindowSize(1200, 800);
      render(<ViewModeSelector {...defaultProps} />);
      
      const timelineButton = screen.getByLabelText('タイムラインビューに切り替え');
      fireEvent.click(timelineButton);
      
      expect(defaultProps.onModeChange).toHaveBeenCalledWith('timeline');
    });
  });

  describe('タッチデバイス対応', () => {
    beforeEach(() => {
      // タッチデバイスをシミュレート
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: true,
      });
      
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 5,
      });
    });

    it('タッチデバイスでボタンサイズが適切に調整される', async () => {
      mockWindowSize(375, 667);
      render(<ViewModeSelector currentMode="diary" onModeChange={vi.fn()} />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveClass('touch-manipulation');
        });
      });
    });
  });

  describe('ウィンドウリサイズ対応', () => {
    it('ウィンドウサイズ変更時にレイアウトが更新される', async () => {
      const { rerender } = render(<CalendarView {...{
        year: 2024,
        month: 1,
        calendarData: mockCalendarData,
        onDateClick: vi.fn(),
        onMonthChange: vi.fn()
      }} />);
      
      // デスクトップサイズ
      mockWindowSize(1200, 800);
      rerender(<CalendarView {...{
        year: 2024,
        month: 1,
        calendarData: mockCalendarData,
        onDateClick: vi.fn(),
        onMonthChange: vi.fn()
      }} />);
      
      await waitFor(() => {
        expect(screen.getByText('2024年 1月')).toBeInTheDocument();
      });
      
      // モバイルサイズに変更
      mockWindowSize(375, 667);
      rerender(<CalendarView {...{
        year: 2024,
        month: 1,
        calendarData: mockCalendarData,
        onDateClick: vi.fn(),
        onMonthChange: vi.fn()
      }} />);
      
      await waitFor(() => {
        expect(screen.getByText('2024年 1月')).toBeInTheDocument();
      });
    });
  });
});