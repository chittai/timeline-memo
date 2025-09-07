import React, { useState, useEffect } from 'react';
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
 * レスポンシブデザイン対応
 */
const CalendarView: React.FC<CalendarViewProps> = ({
  year,
  month,
  calendarData,
  selectedDate,
  onDateClick,
  onMonthChange,
}) => {
  // デバイス情報の状態管理
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

  // レスポンシブ対応のスタイル計算
  const getResponsiveStyles = () => {
    return {
      container: screenSize === 'mobile' 
        ? 'calendar-view bg-white rounded-lg shadow-sm border border-gray-200 p-3' 
        : screenSize === 'tablet'
        ? 'calendar-view bg-white rounded-lg shadow-sm border border-gray-200 p-4'
        : 'calendar-view bg-white rounded-lg shadow-sm border border-gray-200 p-6',
      
      header: screenSize === 'mobile' 
        ? 'calendar-header flex items-center justify-between mb-4' 
        : 'calendar-header flex items-center justify-between mb-6',
      
      headerButton: screenSize === 'mobile'
        ? `p-3 rounded-lg hover:bg-gray-100 transition-colors ${isTouchDevice ? 'min-h-11 min-w-11' : ''}`
        : 'p-2 rounded-lg hover:bg-gray-100 transition-colors',
      
      headerIcon: screenSize === 'mobile' ? 'w-6 h-6' : 'w-5 h-5',
      
      headerTitle: screenSize === 'mobile' 
        ? 'text-lg font-semibold text-gray-900' 
        : screenSize === 'tablet'
        ? 'text-xl font-semibold text-gray-900'
        : 'text-xl font-semibold text-gray-900',
      
      weekdayHeader: screenSize === 'mobile'
        ? 'calendar-weekdays grid grid-cols-7 gap-1 mb-2'
        : 'calendar-weekdays grid grid-cols-7 gap-1 mb-2',
      
      weekdayCell: screenSize === 'mobile'
        ? 'text-center text-xs font-medium py-1'
        : 'text-center text-sm font-medium py-2',
      
      calendarGrid: screenSize === 'mobile'
        ? 'calendar-grid grid grid-cols-7 gap-1'
        : 'calendar-grid grid grid-cols-7 gap-1',
      
      dayCell: screenSize === 'mobile'
        ? `calendar-day ${orientation === 'portrait' ? 'h-10' : 'h-8'} rounded-lg border transition-all duration-200 relative ${isTouchDevice ? 'min-h-11' : ''}`
        : screenSize === 'tablet'
        ? 'calendar-day h-12 rounded-lg border transition-all duration-200 relative'
        : 'calendar-day h-12 rounded-lg border transition-all duration-200 relative',
      
      dayText: screenSize === 'mobile' 
        ? 'text-xs font-medium' 
        : 'text-sm font-medium',
      
      legend: screenSize === 'mobile'
        ? 'calendar-legend mt-4 flex flex-wrap gap-2 text-xs text-gray-600'
        : 'calendar-legend mt-6 flex flex-wrap gap-4 text-sm text-gray-600',
      
      legendIcon: screenSize === 'mobile' ? 'w-2 h-2' : 'w-3 h-3',
      
      postCountBadge: screenSize === 'mobile'
        ? 'absolute -top-1 -right-1 text-xs font-bold min-w-3 h-3 rounded-full flex items-center justify-center'
        : 'absolute -top-1 -right-1 text-xs font-bold min-w-4 h-4 rounded-full flex items-center justify-center',
      
      postIndicator: screenSize === 'mobile'
        ? 'absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full'
        : 'absolute bottom-1 right-1 w-2 h-2 rounded-full'
    };
  };

  const styles = getResponsiveStyles();

  return (
    <div className={styles.container}>
      {/* カレンダーヘッダー */}
      <div className={styles.header}>
        <button
          onClick={handlePreviousMonth}
          className={styles.headerButton}
          aria-label="前月"
        >
          <svg className={styles.headerIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className={styles.headerTitle}>
          {screenSize === 'mobile' && orientation === 'landscape' 
            ? `${year}/${month}` 
            : `${year}年 ${getMonthName(month)}`
          }
        </h2>
        
        <button
          onClick={handleNextMonth}
          className={styles.headerButton}
          aria-label="次月"
        >
          <svg className={styles.headerIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className={styles.weekdayHeader}>
        {getDayHeaders().map((day, index) => (
          <div
            key={day}
            className={`${styles.weekdayCell} ${
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
            }`}
          >
            {screenSize === 'mobile' && orientation === 'landscape' 
              ? day.charAt(0) // 横向きモバイルでは1文字表示
              : day
            }
          </div>
        ))}
      </div>

      {/* カレンダーグリッド */}
      <div className={styles.calendarGrid}>
        {calendarGrid.map((dayData, index) => {
          if (!dayData) {
            // 空のセル
            return <div key={`empty-${index}`} className={`calendar-day-empty ${styles.dayCell.split(' ')[1]}`} />;
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
                ${styles.dayCell}
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
                ${isTouchDevice ? 'touch-manipulation' : ''}
              `}
              aria-label={`${dayData.date.getDate()}日${dayData.hasPost ? ` (${dayData.postCount}件の投稿)` : ''}`}
            >
              <span className={styles.dayText}>
                {dayData.date.getDate()}
              </span>
              
              {/* 投稿数インジケーター */}
              {dayData.hasPost && (
                <div className={`
                  ${styles.postIndicator}
                  ${isSelected ? 'bg-white' : 'bg-green-500'}
                `}>
                  {dayData.postCount > 1 && (
                    <span className={`
                      ${styles.postCountBadge}
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
      {!(screenSize === 'mobile' && orientation === 'landscape') && (
        <div className={styles.legend}>
          <div className="flex items-center gap-2">
            <div className={`${styles.legendIcon} rounded bg-blue-50 border border-blue-400`}></div>
            <span>今日</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`${styles.legendIcon} rounded bg-green-50 border border-green-200`}></div>
            <span>投稿あり</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`${styles.legendIcon} rounded bg-blue-500`}></div>
            <span>選択中</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;