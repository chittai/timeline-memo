import React from 'react';
import type { CalendarDay } from '../types';

interface CalendarViewProps {
  year: number;
  month: number;
  calendarData: CalendarDay[];
  selectedDate?: Date;
  onDateClick: (date: Date) => void;
  onMonthChange: (year: number, month: number) => void;
}

/**
 * カレンダー形式で投稿履歴を表示するコンポーネント
 * 投稿がある日をハイライト表示し、日付クリックで投稿表示機能を提供
 */
const CalendarView: React.FC<CalendarViewProps> = ({
  year,
  month,
  calendarData,
  selectedDate,
  onDateClick,
  onMonthChange,
}) => {
  // 月の名前を取得
  const getMonthName = (month: number): string => {
    const monthNames = [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月'
    ];
    return monthNames[month - 1];
  };

  // 曜日のヘッダーを取得
  const getDayHeaders = (): string[] => {
    return ['日', '月', '火', '水', '木', '金', '土'];
  };

  // 前月に移動
  const handlePreviousMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  // 次月に移動
  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  // 日付が選択されているかチェック
  const isDateSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  // カレンダーグリッドを生成（月の最初の日の曜日に合わせて空のセルを追加）
  const generateCalendarGrid = (): (CalendarDay | null)[] => {
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0: 日曜日, 1: 月曜日, ...
    
    // 月の最初の日より前の空のセルを追加
    const grid: (CalendarDay | null)[] = Array(firstDayOfWeek).fill(null);
    
    // カレンダーデータを追加
    grid.push(...calendarData);
    
    return grid;
  };

  const calendarGrid = generateCalendarGrid();

  return (
    <div className="calendar-view bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* カレンダーヘッダー */}
      <div className="calendar-header flex items-center justify-between mb-6">
        <button
          onClick={handlePreviousMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="前月"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-xl font-semibold text-gray-900">
          {year}年 {getMonthName(month)}
        </h2>
        
        <button
          onClick={handleNextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="次月"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="calendar-weekdays grid grid-cols-7 gap-1 mb-2">
        {getDayHeaders().map((day, index) => (
          <div
            key={day}
            className={`text-center text-sm font-medium py-2 ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className="calendar-grid grid grid-cols-7 gap-1">
        {calendarGrid.map((dayData, index) => {
          if (!dayData) {
            // 空のセル
            return <div key={`empty-${index}`} className="calendar-day-empty h-12" />;
          }

          const isSelected = isDateSelected(dayData.date);
          const dayOfWeek = dayData.date.getDay();
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;

          return (
            <button
              key={dayData.date.toISOString()}
              onClick={() => onDateClick(dayData.date)}
              className={`
                calendar-day h-12 rounded-lg border transition-all duration-200 relative
                ${isSelected 
                  ? 'bg-blue-500 text-white border-blue-500 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
                ${dayData.isToday && !isSelected 
                  ? 'border-blue-400 bg-blue-50 text-blue-700 font-semibold' 
                  : ''
                }
                ${dayData.hasPost && !isSelected 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : ''
                }
                ${isSunday && !isSelected && !dayData.isToday 
                  ? 'text-red-600' 
                  : isSaturday && !isSelected && !dayData.isToday 
                    ? 'text-blue-600' 
                    : !isSelected && !dayData.isToday 
                      ? 'text-gray-700' 
                      : ''
                }
              `}
              aria-label={`${dayData.date.getDate()}日${dayData.hasPost ? ` (${dayData.postCount}件の投稿)` : ''}`}
            >
              <span className="text-sm font-medium">
                {dayData.date.getDate()}
              </span>
              
              {/* 投稿数インジケーター */}
              {dayData.hasPost && (
                <div className={`
                  absolute bottom-1 right-1 w-2 h-2 rounded-full
                  ${isSelected ? 'bg-white' : 'bg-green-500'}
                `}>
                  {dayData.postCount > 1 && (
                    <span className={`
                      absolute -top-1 -right-1 text-xs font-bold min-w-4 h-4 
                      rounded-full flex items-center justify-center
                      ${isSelected 
                        ? 'bg-white text-blue-500' 
                        : 'bg-green-600 text-white'
                      }
                    `}>
                      {dayData.postCount > 9 ? '9+' : dayData.postCount}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* カレンダー凡例 */}
      <div className="calendar-legend mt-6 flex flex-wrap gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-50 border border-blue-400"></div>
          <span>今日</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-50 border border-green-200"></div>
          <span>投稿あり</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span>選択中</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;