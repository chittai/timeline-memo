import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CalendarView from '../CalendarView';
import { CalendarDay } from '../../types';

// モックデータの作成
const createMockCalendarData = (year: number, month: number): CalendarDay[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const calendarData: CalendarDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const isToday = 
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    calendarData.push({
      date,
      hasPost: day % 3 === 0, // 3の倍数の日に投稿があると仮定
      postCount: day % 3 === 0 ? Math.floor(day / 3) : 0,
      isToday,
      isSelected: false,
    });
  }

  return calendarData;
};

describe('CalendarView', () => {
  const mockProps = {
    year: 2024,
    month: 1,
    calendarData: createMockCalendarData(2024, 1),
    onDateClick: vi.fn(),
    onMonthChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本表示', () => {
    it('カレンダーが正しく表示される', () => {
      render(<CalendarView {...mockProps} />);
      
      // ヘッダーの年月表示を確認
      expect(screen.getByText('2024年 1月')).toBeInTheDocument();
      
      // 曜日ヘッダーを確認
      expect(screen.getByText('日')).toBeInTheDocument();
      expect(screen.getByText('月')).toBeInTheDocument();
      expect(screen.getByText('火')).toBeInTheDocument();
      expect(screen.getByText('水')).toBeInTheDocument();
      expect(screen.getByText('木')).toBeInTheDocument();
      expect(screen.getByText('金')).toBeInTheDocument();
      expect(screen.getByText('土')).toBeInTheDocument();
    });

    it('カレンダーグリッドが正しく表示される', () => {
      render(<CalendarView {...mockProps} />);
      
      // aria-labelを使用して日付ボタンの存在を確認
      // 投稿がない日
      expect(screen.getByLabelText('1日')).toBeInTheDocument();
      expect(screen.getByLabelText('2日')).toBeInTheDocument();
      expect(screen.getByLabelText('4日')).toBeInTheDocument();
      expect(screen.getByLabelText('5日')).toBeInTheDocument();
      
      // 投稿がある日（3の倍数）は投稿数と一緒に表示されることを確認
      expect(screen.getByLabelText('3日 (1件の投稿)')).toBeInTheDocument();
      expect(screen.getByLabelText('6日 (2件の投稿)')).toBeInTheDocument();
      expect(screen.getByLabelText('9日 (3件の投稿)')).toBeInTheDocument();
      expect(screen.getByLabelText('12日 (4件の投稿)')).toBeInTheDocument();
      expect(screen.getByLabelText('15日 (5件の投稿)')).toBeInTheDocument();
      
      // 月末の日付も確認
      expect(screen.getByLabelText('30日 (10件の投稿)')).toBeInTheDocument();
      expect(screen.getByLabelText('31日')).toBeInTheDocument();
    });

    it('投稿がある日がハイライト表示される', () => {
      render(<CalendarView {...mockProps} />);
      
      // 3の倍数の日（投稿がある日）のボタンを確認
      const dayWithPost = screen.getByLabelText('3日 (1件の投稿)');
      expect(dayWithPost).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
    });

    it('投稿数インジケーターが表示される', () => {
      render(<CalendarView {...mockProps} />);
      
      // 投稿数が複数ある日のインジケーターを確認
      const dayWithMultiplePosts = screen.getByLabelText('6日 (2件の投稿)');
      expect(dayWithMultiplePosts).toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('日付クリック時にonDateClickが呼ばれる', () => {
      render(<CalendarView {...mockProps} />);
      
      const dayButton = screen.getByLabelText('3日 (1件の投稿)');
      fireEvent.click(dayButton);
      
      expect(mockProps.onDateClick).toHaveBeenCalledWith(
        new Date(2024, 0, 3) // 2024年1月3日
      );
    });

    it('前月ボタンクリック時にonMonthChangeが呼ばれる', () => {
      render(<CalendarView {...mockProps} />);
      
      const prevButton = screen.getByLabelText('前月');
      fireEvent.click(prevButton);
      
      expect(mockProps.onMonthChange).toHaveBeenCalledWith(2023, 12);
    });

    it('次月ボタンクリック時にonMonthChangeが呼ばれる', () => {
      render(<CalendarView {...mockProps} />);
      
      const nextButton = screen.getByLabelText('次月');
      fireEvent.click(nextButton);
      
      expect(mockProps.onMonthChange).toHaveBeenCalledWith(2024, 2);
    });

    it('12月から次月に移動すると翌年の1月になる', () => {
      const decemberProps = {
        ...mockProps,
        month: 12,
        calendarData: createMockCalendarData(2024, 12),
      };
      
      render(<CalendarView {...decemberProps} />);
      
      const nextButton = screen.getByLabelText('次月');
      fireEvent.click(nextButton);
      
      expect(mockProps.onMonthChange).toHaveBeenCalledWith(2025, 1);
    });

    it('1月から前月に移動すると前年の12月になる', () => {
      render(<CalendarView {...mockProps} />);
      
      const prevButton = screen.getByLabelText('前月');
      fireEvent.click(prevButton);
      
      expect(mockProps.onMonthChange).toHaveBeenCalledWith(2023, 12);
    });
  });

  describe('選択状態', () => {
    it('選択された日付がハイライト表示される', () => {
      const selectedDate = new Date(2024, 0, 3); // 2024年1月3日
      const propsWithSelection = {
        ...mockProps,
        selectedDate,
      };
      
      render(<CalendarView {...propsWithSelection} />);
      
      const selectedDay = screen.getByLabelText('3日 (1件の投稿)');
      expect(selectedDay).toHaveClass('bg-blue-500', 'text-white', 'border-blue-500');
    });

    it('今日の日付が特別にハイライト表示される', () => {
      const today = new Date();
      const todayCalendarData = createMockCalendarData(today.getFullYear(), today.getMonth() + 1);
      
      const todayProps = {
        ...mockProps,
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        calendarData: todayCalendarData,
      };
      
      render(<CalendarView {...todayProps} />);
      
      // 今日の日付に投稿があるかどうかで表示が変わるため、より柔軟にテスト
      const todayDate = today.getDate();
      const hasPost = todayDate % 3 === 0;
      const labelText = hasPost ? `${todayDate}日 (${Math.floor(todayDate / 3)}件の投稿)` : `${todayDate}日`;
      
      const todayButton = screen.getByLabelText(labelText);
      expect(todayButton).toHaveClass('border-blue-400', 'bg-blue-50', 'text-blue-700');
    });
  });

  describe('カレンダー凡例', () => {
    it('凡例が表示される', () => {
      render(<CalendarView {...mockProps} />);
      
      expect(screen.getByText('今日')).toBeInTheDocument();
      expect(screen.getByText('投稿あり')).toBeInTheDocument();
      expect(screen.getByText('選択中')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('日付ボタンに適切なaria-labelが設定される', () => {
      render(<CalendarView {...mockProps} />);
      
      // 投稿がない日
      expect(screen.getByLabelText('1日')).toBeInTheDocument();
      
      // 投稿がある日
      expect(screen.getByLabelText('3日 (1件の投稿)')).toBeInTheDocument();
    });

    it('ナビゲーションボタンに適切なaria-labelが設定される', () => {
      render(<CalendarView {...mockProps} />);
      
      expect(screen.getByLabelText('前月')).toBeInTheDocument();
      expect(screen.getByLabelText('次月')).toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('投稿数が9を超える場合は9+と表示される', () => {
      const calendarDataWithManyPosts = mockProps.calendarData.map((day, index) => 
        index === 14 // 15日目
          ? { ...day, hasPost: true, postCount: 15 }
          : day
      );
      
      const propsWithManyPosts = {
        ...mockProps,
        calendarData: calendarDataWithManyPosts,
      };
      
      render(<CalendarView {...propsWithManyPosts} />);
      
      expect(screen.getAllByText('9+').length).toBeGreaterThan(0);
    });

    it('空のカレンダーデータでもエラーが発生しない', () => {
      const emptyProps = {
        ...mockProps,
        calendarData: [],
      };
      
      expect(() => render(<CalendarView {...emptyProps} />)).not.toThrow();
    });
  });
});