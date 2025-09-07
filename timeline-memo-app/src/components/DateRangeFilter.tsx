import React, { useState } from 'react';
import type { DateRange } from '../types';

interface DateRangeFilterProps {
  onDateRangeChange: (range: DateRange | null) => void;
  onClear: () => void;
  currentRange?: DateRange | null;
}

/**
 * 日付範囲フィルタリングコンポーネント
 * ユーザーが開始日と終了日を指定して投稿を絞り込むためのUI
 */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  onDateRangeChange,
  onClear,
  currentRange
}) => {
  const [startDate, setStartDate] = useState<string>(
    currentRange?.start ? currentRange.start.toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState<string>(
    currentRange?.end ? currentRange.end.toISOString().split('T')[0] : ''
  );

  // 日付範囲の適用
  const handleApplyFilter = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // 終了日を23:59:59に設定して、その日の投稿も含める
      end.setHours(23, 59, 59, 999);
      
      if (start <= end) {
        onDateRangeChange({ start, end });
      }
    }
  };

  // フィルターのクリア
  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    onClear();
  };

  // 今日の日付を取得（最大値として使用）
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1">
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
            開始日
          </label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex-1">
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
            終了日
          </label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
            max={today}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleApplyFilter}
            disabled={!startDate || !endDate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            適用
          </button>
          
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            クリア
          </button>
        </div>
      </div>
      
      {currentRange && (
        <div className="mt-3 p-2 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            フィルター適用中: {currentRange.start.toLocaleDateString('ja-JP')} 〜 {currentRange.end.toLocaleDateString('ja-JP')}
          </p>
        </div>
      )}
    </div>
  );
};