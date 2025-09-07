import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateRangeFilter } from '../DateRangeFilter';
import type { DateRange } from '../../types';

describe('DateRangeFilter', () => {
  const mockOnDateRangeChange = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onDateRangeChange: mockOnDateRangeChange,
    onClear: mockOnClear,
    currentRange: null
  };

  describe('基本的な表示', () => {
    it('開始日と終了日の入力フィールドが表示される', () => {
      render(<DateRangeFilter {...defaultProps} />);
      
      expect(screen.getByLabelText('開始日')).toBeInTheDocument();
      expect(screen.getByLabelText('終了日')).toBeInTheDocument();
    });

    it('適用ボタンとクリアボタンが表示される', () => {
      render(<DateRangeFilter {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: '適用' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'クリア' })).toBeInTheDocument();
    });

    it('適用ボタンは初期状態では無効化されている', () => {
      render(<DateRangeFilter {...defaultProps} />);
      
      const applyButton = screen.getByRole('button', { name: '適用' });
      expect(applyButton).toBeDisabled();
    });
  });

  describe('日付入力', () => {
    it('開始日を入力できる', async () => {
      const user = userEvent.setup();
      render(<DateRangeFilter {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText('開始日');
      await user.type(startDateInput, '2024-01-01');
      
      expect(startDateInput).toHaveValue('2024-01-01');
    });

    it('終了日を入力できる', async () => {
      const user = userEvent.setup();
      render(<DateRangeFilter {...defaultProps} />);
      
      const endDateInput = screen.getByLabelText('終了日');
      await user.type(endDateInput, '2024-01-31');
      
      expect(endDateInput).toHaveValue('2024-01-31');
    });

    it('開始日と終了日の両方が入力されると適用ボタンが有効になる', async () => {
      const user = userEvent.setup();
      render(<DateRangeFilter {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText('開始日');
      const endDateInput = screen.getByLabelText('終了日');
      const applyButton = screen.getByRole('button', { name: '適用' });
      
      await user.type(startDateInput, '2024-01-01');
      await user.type(endDateInput, '2024-01-31');
      
      expect(applyButton).toBeEnabled();
    });
  });

  describe('フィルター適用', () => {
    it('適用ボタンをクリックすると日付範囲が設定される', async () => {
      const user = userEvent.setup();
      render(<DateRangeFilter {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText('開始日');
      const endDateInput = screen.getByLabelText('終了日');
      const applyButton = screen.getByRole('button', { name: '適用' });
      
      await user.type(startDateInput, '2024-01-01');
      await user.type(endDateInput, '2024-01-31');
      await user.click(applyButton);
      
      expect(mockOnDateRangeChange).toHaveBeenCalledWith({
        start: new Date('2024-01-01'),
        end: expect.any(Date) // 終了日は23:59:59に設定される
      });
      
      // 終了日が23:59:59に設定されていることを確認
      const calledRange = mockOnDateRangeChange.mock.calls[0][0] as DateRange;
      expect(calledRange.end.getHours()).toBe(23);
      expect(calledRange.end.getMinutes()).toBe(59);
      expect(calledRange.end.getSeconds()).toBe(59);
    });

    it('クリアボタンをクリックすると入力がクリアされる', async () => {
      const user = userEvent.setup();
      render(<DateRangeFilter {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText('開始日');
      const endDateInput = screen.getByLabelText('終了日');
      const clearButton = screen.getByRole('button', { name: 'クリア' });
      
      // 日付を入力
      await user.type(startDateInput, '2024-01-01');
      await user.type(endDateInput, '2024-01-31');
      
      // クリアボタンをクリック
      await user.click(clearButton);
      
      expect(startDateInput).toHaveValue('');
      expect(endDateInput).toHaveValue('');
      expect(mockOnClear).toHaveBeenCalled();
    });
  });

  describe('現在の範囲表示', () => {
    it('現在の日付範囲が設定されている場合、表示される', () => {
      const currentRange: DateRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };
      
      render(
        <DateRangeFilter 
          {...defaultProps} 
          currentRange={currentRange}
        />
      );
      
      expect(screen.getByText(/フィルター適用中:/)).toBeInTheDocument();
      expect(screen.getByText(/2024\/1\/1/)).toBeInTheDocument();
      expect(screen.getByText(/2024\/1\/31/)).toBeInTheDocument();
    });

    it('現在の日付範囲が設定されていない場合、表示されない', () => {
      render(<DateRangeFilter {...defaultProps} />);
      
      expect(screen.queryByText(/フィルター適用中:/)).not.toBeInTheDocument();
    });
  });

  describe('バリデーション', () => {
    it('終了日の最小値が開始日に設定される', async () => {
      const user = userEvent.setup();
      render(<DateRangeFilter {...defaultProps} />);
      
      const startDateInput = screen.getByLabelText('開始日');
      const endDateInput = screen.getByLabelText('終了日');
      
      await user.type(startDateInput, '2024-01-15');
      
      expect(endDateInput).toHaveAttribute('min', '2024-01-15');
    });

    it('今日の日付が最大値として設定される', () => {
      render(<DateRangeFilter {...defaultProps} />);
      
      const today = new Date().toISOString().split('T')[0];
      const startDateInput = screen.getByLabelText('開始日');
      const endDateInput = screen.getByLabelText('終了日');
      
      expect(startDateInput).toHaveAttribute('max', today);
      expect(endDateInput).toHaveAttribute('max', today);
    });
  });

  describe('アクセシビリティ', () => {
    it('適切なラベルが設定されている', () => {
      render(<DateRangeFilter {...defaultProps} />);
      
      expect(screen.getByLabelText('開始日')).toBeInTheDocument();
      expect(screen.getByLabelText('終了日')).toBeInTheDocument();
    });

    it('ボタンにフォーカスを当てることができる', async () => {
      const user = userEvent.setup();
      render(<DateRangeFilter {...defaultProps} />);
      
      const clearButton = screen.getByRole('button', { name: 'クリア' });
      await user.tab();
      await user.tab();
      await user.tab();
      
      expect(clearButton).toHaveFocus();
    });
  });
});