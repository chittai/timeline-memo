import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast } from '../Toast';
import type { Toast as ToastType } from '../../types';

// テスト用のトーストデータ
const mockToast: ToastType = {
  id: 'test-toast-1',
  type: 'success',
  title: 'テスト成功',
  message: 'テストメッセージです',
  duration: 5000
};

const mockOnRemove = jest.fn();

describe('Toast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('トーストが正しく表示される', () => {
    render(<Toast toast={mockToast} onRemove={mockOnRemove} />);
    
    expect(screen.getByText('テスト成功')).toBeInTheDocument();
    expect(screen.getByText('テストメッセージです')).toBeInTheDocument();
  });

  it('成功トーストのスタイルが適用される', () => {
    render(<Toast toast={mockToast} onRemove={mockOnRemove} />);
    
    const toastElement = screen.getByText('テスト成功').closest('div');
    expect(toastElement).toHaveClass('bg-green-50', 'border-green-400', 'text-green-800');
  });

  it('エラートーストのスタイルが適用される', () => {
    const errorToast: ToastType = {
      ...mockToast,
      type: 'error',
      title: 'エラー発生'
    };
    
    render(<Toast toast={errorToast} onRemove={mockOnRemove} />);
    
    const toastElement = screen.getByText('エラー発生').closest('div');
    expect(toastElement).toHaveClass('bg-red-50', 'border-red-400', 'text-red-800');
  });

  it('警告トーストのスタイルが適用される', () => {
    const warningToast: ToastType = {
      ...mockToast,
      type: 'warning',
      title: '警告'
    };
    
    render(<Toast toast={warningToast} onRemove={mockOnRemove} />);
    
    const toastElement = screen.getByText('警告').closest('div');
    expect(toastElement).toHaveClass('bg-yellow-50', 'border-yellow-400', 'text-yellow-800');
  });

  it('情報トーストのスタイルが適用される', () => {
    const infoToast: ToastType = {
      ...mockToast,
      type: 'info',
      title: '情報'
    };
    
    render(<Toast toast={infoToast} onRemove={mockOnRemove} />);
    
    const toastElement = screen.getByText('情報').closest('div');
    expect(toastElement).toHaveClass('bg-blue-50', 'border-blue-400', 'text-blue-800');
  });

  it('閉じるボタンをクリックするとonRemoveが呼ばれる', () => {
    render(<Toast toast={mockToast} onRemove={mockOnRemove} />);
    
    const closeButton = screen.getByLabelText('通知を閉じる');
    fireEvent.click(closeButton);
    
    expect(mockOnRemove).toHaveBeenCalledWith('test-toast-1');
  });

  it('指定された時間後に自動で削除される', async () => {
    render(<Toast toast={mockToast} onRemove={mockOnRemove} />);
    
    // 5秒経過
    jest.advanceTimersByTime(5000);
    
    await waitFor(() => {
      expect(mockOnRemove).toHaveBeenCalledWith('test-toast-1');
    });
  });

  it('duration が 0 の場合は自動削除されない', () => {
    const persistentToast: ToastType = {
      ...mockToast,
      duration: 0
    };
    
    render(<Toast toast={persistentToast} onRemove={mockOnRemove} />);
    
    // 10秒経過しても削除されない
    jest.advanceTimersByTime(10000);
    
    expect(mockOnRemove).not.toHaveBeenCalled();
  });

  it('アクション付きトーストでアクションボタンが表示される', () => {
    const actionToast: ToastType = {
      ...mockToast,
      action: {
        label: 'アクション実行',
        onClick: jest.fn()
      }
    };
    
    render(<Toast toast={actionToast} onRemove={mockOnRemove} />);
    
    const actionButton = screen.getByText('アクション実行');
    expect(actionButton).toBeInTheDocument();
  });

  it('アクションボタンをクリックするとonClickが呼ばれる', () => {
    const mockAction = jest.fn();
    const actionToast: ToastType = {
      ...mockToast,
      action: {
        label: 'アクション実行',
        onClick: mockAction
      }
    };
    
    render(<Toast toast={actionToast} onRemove={mockOnRemove} />);
    
    const actionButton = screen.getByText('アクション実行');
    fireEvent.click(actionButton);
    
    expect(mockAction).toHaveBeenCalled();
  });

  it('メッセージがない場合はタイトルのみ表示される', () => {
    const titleOnlyToast: ToastType = {
      ...mockToast,
      message: undefined
    };
    
    render(<Toast toast={titleOnlyToast} onRemove={mockOnRemove} />);
    
    expect(screen.getByText('テスト成功')).toBeInTheDocument();
    expect(screen.queryByText('テストメッセージです')).not.toBeInTheDocument();
  });

  it('コンポーネントがアンマウントされるとタイマーがクリアされる', () => {
    const { unmount } = render(<Toast toast={mockToast} onRemove={mockOnRemove} />);
    
    // アンマウント
    unmount();
    
    // タイマーが進んでも削除されない
    jest.advanceTimersByTime(5000);
    expect(mockOnRemove).not.toHaveBeenCalled();
  });
});