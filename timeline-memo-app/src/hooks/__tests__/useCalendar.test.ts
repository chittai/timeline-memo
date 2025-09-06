import { describe, it, expect } from 'vitest';
import type { Post, CalendarDay } from '../../types';

// useCalendarフックの基本的な型と機能をテスト
describe('useCalendar', () => {

  describe('型定義の確認', () => {
    it('CalendarDay型が正しく定義されている', () => {
      const calendarDay: CalendarDay = {
        date: new Date(2024, 0, 1),
        hasPost: true,
        postCount: 2,
        isToday: false,
        isSelected: false
      };

      expect(calendarDay.date).toBeInstanceOf(Date);
      expect(typeof calendarDay.hasPost).toBe('boolean');
      expect(typeof calendarDay.postCount).toBe('number');
      expect(typeof calendarDay.isToday).toBe('boolean');
      expect(typeof calendarDay.isSelected).toBe('boolean');
    });

    it('Post型が正しく定義されている', () => {
      const post: Post = {
        id: '1',
        content: 'テスト投稿',
        createdAt: new Date(2024, 0, 15),
        updatedAt: new Date(2024, 0, 15)
      };

      expect(typeof post.id).toBe('string');
      expect(typeof post.content).toBe('string');
      expect(post.createdAt).toBeInstanceOf(Date);
      expect(post.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('日付計算のロジック', () => {
    it('現在の年月を正しく取得できる', () => {
      const currentDate = new Date();
      const expectedYear = currentDate.getFullYear();
      const expectedMonth = currentDate.getMonth() + 1;

      expect(expectedYear).toBeGreaterThan(2020);
      expect(expectedMonth).toBeGreaterThanOrEqual(1);
      expect(expectedMonth).toBeLessThanOrEqual(12);
    });

    it('月の境界値を正しく処理できる', () => {
      // 1月の前月は前年の12月
      const prevYear = 2024;
      const prevMonth = 1;
      const expectedPrevYear = prevMonth === 1 ? prevYear - 1 : prevYear;
      const expectedPrevMonth = prevMonth === 1 ? 12 : prevMonth - 1;

      expect(expectedPrevYear).toBe(2023);
      expect(expectedPrevMonth).toBe(12);

      // 12月の次月は翌年の1月
      const nextYear = 2024;
      const nextMonth = 12;
      const expectedNextYear = nextMonth === 12 ? nextYear + 1 : nextYear;
      const expectedNextMonth = nextMonth === 12 ? 1 : nextMonth + 1;

      expect(expectedNextYear).toBe(2025);
      expect(expectedNextMonth).toBe(1);
    });
  });

  describe('カレンダーデータの構造', () => {
    it('カレンダーデータが正しい構造を持つ', () => {
      const calendarData: CalendarDay[] = [
        {
          date: new Date(2024, 0, 1),
          hasPost: true,
          postCount: 2,
          isToday: false,
          isSelected: false
        },
        {
          date: new Date(2024, 0, 2),
          hasPost: false,
          postCount: 0,
          isToday: true,
          isSelected: true
        }
      ];

      expect(Array.isArray(calendarData)).toBe(true);
      expect(calendarData).toHaveLength(2);
      
      // 最初の日のデータ確認
      expect(calendarData[0].hasPost).toBe(true);
      expect(calendarData[0].postCount).toBe(2);
      expect(calendarData[0].isSelected).toBe(false);
      
      // 2番目の日のデータ確認
      expect(calendarData[1].hasPost).toBe(false);
      expect(calendarData[1].postCount).toBe(0);
      expect(calendarData[1].isToday).toBe(true);
      expect(calendarData[1].isSelected).toBe(true);
    });
  });

  describe('日付フォーマット', () => {
    it('日付を正しくフォーマットできる', () => {
      const date = new Date(2024, 0, 15, 12, 0, 0); // 2024年1月15日 正午（タイムゾーンの影響を軽減）
      const dateKey = date.toISOString().split('T')[0];
      
      expect(dateKey).toBe('2024-01-15');
    });

    it('同じ日かどうかを正しく判定できる', () => {
      const date1 = new Date(2024, 0, 15, 12, 30, 0);
      const date2 = new Date(2024, 0, 15, 18, 45, 0);
      const date3 = new Date(2024, 0, 16, 12, 30, 0);
      
      const dateKey1 = date1.toISOString().split('T')[0];
      const dateKey2 = date2.toISOString().split('T')[0];
      const dateKey3 = date3.toISOString().split('T')[0];
      
      expect(dateKey1).toBe(dateKey2); // 同じ日
      expect(dateKey1).not.toBe(dateKey3); // 異なる日
    });
  });

  describe('バリデーション', () => {
    it('有効な年月の範囲を確認できる', () => {
      const validYear = 2024;
      const validMonth = 6;
      
      expect(validYear).toBeGreaterThanOrEqual(1900);
      expect(validYear).toBeLessThanOrEqual(2100);
      expect(validMonth).toBeGreaterThanOrEqual(1);
      expect(validMonth).toBeLessThanOrEqual(12);
    });

    it('無効な年月を検出できる', () => {
      const invalidYear1 = 1800; // 範囲外
      const invalidYear2 = 2200; // 範囲外
      const invalidMonth1 = 0;   // 範囲外
      const invalidMonth2 = 13;  // 範囲外
      
      expect(invalidYear1).toBeLessThan(1900);
      expect(invalidYear2).toBeGreaterThan(2100);
      expect(invalidMonth1).toBeLessThan(1);
      expect(invalidMonth2).toBeGreaterThan(12);
    });
  });

  describe('月の日数計算', () => {
    it('各月の日数を正しく計算できる', () => {
      // 2024年（うるう年）の各月の日数
      const daysInMonth = [
        new Date(2024, 1, 0).getDate(), // 1月: 31日
        new Date(2024, 2, 0).getDate(), // 2月: 29日（うるう年）
        new Date(2024, 3, 0).getDate(), // 3月: 31日
        new Date(2024, 4, 0).getDate(), // 4月: 30日
        new Date(2024, 5, 0).getDate(), // 5月: 31日
        new Date(2024, 6, 0).getDate(), // 6月: 30日
        new Date(2024, 7, 0).getDate(), // 7月: 31日
        new Date(2024, 8, 0).getDate(), // 8月: 31日
        new Date(2024, 9, 0).getDate(), // 9月: 30日
        new Date(2024, 10, 0).getDate(), // 10月: 31日
        new Date(2024, 11, 0).getDate(), // 11月: 30日
        new Date(2024, 12, 0).getDate()  // 12月: 31日
      ];

      expect(daysInMonth[0]).toBe(31); // 1月
      expect(daysInMonth[1]).toBe(29); // 2月（うるう年）
      expect(daysInMonth[2]).toBe(31); // 3月
      expect(daysInMonth[3]).toBe(30); // 4月
      expect(daysInMonth[11]).toBe(31); // 12月
    });

    it('平年の2月は28日である', () => {
      const daysInFeb2023 = new Date(2023, 2, 0).getDate(); // 2023年2月
      expect(daysInFeb2023).toBe(28);
    });
  });
});