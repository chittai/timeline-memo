import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CalendarView from '../CalendarView';
import { CalendarDay } from '../../types';
import { 
  renderWithProviders, 
  waitForElementToBeVisible, 
  assertElementExists,
  findByTextAndAssertVisible,
  assertMultipleElementsVisible
} from '../../test/helpers/renderHelpers';
import { createMockCalendarDay } from '../../test/fixtures/testData';

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

  describe('表示確認テスト', () => {
    it('カレンダー要素が正しく表示されることを確認する', async () => {
      const { container } = render(<CalendarView {...mockProps} />);
      
      // カレンダーコンテナが表示されていることを確認
      const calendarContainer = assertElementExists(container, '.calendar-view');
      await waitForElementToBeVisible(calendarContainer);
      
      // ヘッダーが表示されていることを確認
      const header = assertElementExists(container, '.calendar-header');
      await waitForElementToBeVisible(header);
      
      // 年月表示が正しく表示されていることを確認
      const title = await findByTextAndAssertVisible('2024年 1月');
      expect(title).toBeInTheDocument();
      
      // ナビゲーションボタンが表示されていることを確認
      const prevButton = screen.getByLabelText('前月');
      const nextButton = screen.getByLabelText('次月');
      await waitForElementToBeVisible(prevButton);
      await waitForElementToBeVisible(nextButton);
      
      // 曜日ヘッダーが表示されていることを確認
      const weekdayHeader = assertElementExists(container, '.calendar-weekdays');
      await waitForElementToBeVisible(weekdayHeader);
      
      // カレンダーグリッドが表示されていることを確認
      const calendarGrid = assertElementExists(container, '.calendar-grid');
      await waitForElementToBeVisible(calendarGrid);
      
      // 凡例が表示されていることを確認
      const legend = assertElementExists(container, '.calendar-legend');
      await waitForElementToBeVisible(legend);
    });

    it('曜日ヘッダーが正しく表示されることを確認する', async () => {
      const { container } = render(<CalendarView {...mockProps} />);
      
      const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
      
      for (const weekday of weekdays) {
        const weekdayElement = await findByTextAndAssertVisible(weekday);
        expect(weekdayElement).toBeInTheDocument();
      }
      
      // 日曜日が赤色、土曜日が青色で表示されていることを確認
      const sundayElement = screen.getByText('日');
      const saturdayElement = screen.getByText('土');
      
      expect(sundayElement).toHaveClass('text-red-600');
      expect(saturdayElement).toHaveClass('text-blue-600');
    });

    it('日付選択時の表示変更が正しく動作することを確認する', async () => {
      const selectedDate = new Date(2024, 0, 15); // 2024年1月15日
      const propsWithSelection = {
        ...mockProps,
        selectedDate,
      };
      
      const { container } = render(<CalendarView {...propsWithSelection} />);
      
      // 選択された日付が青色でハイライトされていることを確認
      const selectedDay = screen.getByLabelText('15日 (5件の投稿)');
      await waitForElementToBeVisible(selectedDay);
      
      expect(selectedDay).toHaveClass('bg-blue-500', 'text-white', 'border-blue-500');
    });

    it('投稿がある日のインジケーターが正しく表示されることを確認する', async () => {
      const { container } = render(<CalendarView {...mockProps} />);
      
      // 投稿がある日（3の倍数）のボタンを確認
      const dayWithPost = screen.getByLabelText('3日 (1件の投稿)');
      await waitForElementToBeVisible(dayWithPost);
      
      expect(dayWithPost).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
      
      // 投稿インジケーターが表示されていることを確認
      const postIndicator = dayWithPost.querySelector('.bg-green-500');
      expect(postIndicator).toBeInTheDocument();
      await waitForElementToBeVisible(postIndicator as HTMLElement);
    });

    it('投稿数バッジが正しく表示されることを確認する', async () => {
      const { container } = render(<CalendarView {...mockProps} />);
      
      // 複数投稿がある日のバッジを確認
      const dayWithMultiplePosts = screen.getByLabelText('6日 (2件の投稿)');
      await waitForElementToBeVisible(dayWithMultiplePosts);
      
      // 投稿数バッジが表示されていることを確認
      const badge = dayWithMultiplePosts.querySelector('.bg-green-600');
      expect(badge).toBeInTheDocument();
      if (badge) {
        await waitForElementToBeVisible(badge as HTMLElement);
        expect(badge).toHaveTextContent('2');
      }
    });

    it('今日の日付が特別にハイライト表示されることを確認する', async () => {
      const today = new Date();
      const todayCalendarData = createMockCalendarData(today.getFullYear(), today.getMonth() + 1);
      
      const todayProps = {
        ...mockProps,
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        calendarData: todayCalendarData,
      };
      
      const { container } = render(<CalendarView {...todayProps} />);
      
      // 今日の日付を見つけて確認
      const todayDate = today.getDate();
      const hasPost = todayDate % 3 === 0;
      const labelText = hasPost ? `${todayDate}日 (${Math.floor(todayDate / 3)}件の投稿)` : `${todayDate}日`;
      
      const todayButton = screen.getByLabelText(labelText);
      await waitForElementToBeVisible(todayButton);
      
      expect(todayButton).toHaveClass('border-blue-400', 'bg-blue-50', 'text-blue-700');
    });

    it('カレンダー凡例が正しく表示されることを確認する', async () => {
      const { container } = render(<CalendarView {...mockProps} />);
      
      // 凡例の各項目が表示されていることを確認
      const todayLegend = await findByTextAndAssertVisible('今日');
      const postLegend = await findByTextAndAssertVisible('投稿あり');
      const selectedLegend = await findByTextAndAssertVisible('選択中');
      
      expect(todayLegend).toBeInTheDocument();
      expect(postLegend).toBeInTheDocument();
      expect(selectedLegend).toBeInTheDocument();
      
      // 凡例のアイコンが表示されていることを確認
      const legend = assertElementExists(container, '.calendar-legend');
      const legendIcons = legend.querySelectorAll('.w-3.h-3, .w-2.h-2');
      expect(legendIcons.length).toBeGreaterThanOrEqual(3);
      
      for (const icon of legendIcons) {
        await waitForElementToBeVisible(icon as HTMLElement);
      }
    });

    it('空のカレンダーセルが正しく表示されることを確認する', async () => {
      const { container } = render(<CalendarView {...mockProps} />);
      
      // 月の最初の日より前の空のセルを確認
      const emptyCells = container.querySelectorAll('.calendar-day-empty');
      
      // 2024年1月1日は月曜日なので、日曜日の空セルが1つあるはず
      expect(emptyCells.length).toBeGreaterThan(0);
      
      for (const emptyCell of emptyCells) {
        await waitForElementToBeVisible(emptyCell as HTMLElement);
      }
    });

    it('投稿数が9を超える場合の表示が正しく動作することを確認する', async () => {
      const calendarDataWithManyPosts = mockProps.calendarData.map((day, index) => 
        index === 14 // 15日目
          ? { ...day, hasPost: true, postCount: 15 }
          : day
      );
      
      const propsWithManyPosts = {
        ...mockProps,
        calendarData: calendarDataWithManyPosts,
      };
      
      const { container } = render(<CalendarView {...propsWithManyPosts} />);
      
      // 15日のボタンを確認
      const dayWithManyPosts = screen.getByLabelText('15日 (15件の投稿)');
      await waitForElementToBeVisible(dayWithManyPosts);
      
      // 9+の表示を確認
      const badge = dayWithManyPosts.querySelector('.bg-green-600');
      if (badge) {
        await waitForElementToBeVisible(badge as HTMLElement);
        expect(badge).toHaveTextContent('9+');
      }
    });

    it('ナビゲーションボタンが正しく表示されることを確認する', async () => {
      const { container } = render(<CalendarView {...mockProps} />);
      
      // 前月ボタンの確認
      const prevButton = screen.getByLabelText('前月');
      await waitForElementToBeVisible(prevButton);
      
      // SVGアイコンが表示されていることを確認
      const prevIcon = prevButton.querySelector('svg');
      expect(prevIcon).toBeInTheDocument();
      await waitForElementToBeVisible(prevIcon as HTMLElement);
      
      // 次月ボタンの確認
      const nextButton = screen.getByLabelText('次月');
      await waitForElementToBeVisible(nextButton);
      
      // SVGアイコンが表示されていることを確認
      const nextIcon = nextButton.querySelector('svg');
      expect(nextIcon).toBeInTheDocument();
      await waitForElementToBeVisible(nextIcon as HTMLElement);
    });
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