import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastContainer } from '../ToastContainer';
import type { Toast } from '../../types';

// モックトースト
const mockToasts: Toast[] = [
  {
    id: 'toast-1',
    type: 'success',
    title: '成功メッセージ',
    message: '操作が完了しました'
  },
  {
    id: 'toast-2',
    type: 'error',
    title: 'エラーメッセージ',
    message: 'エラーが発生しました'
  }
];

// AppContextのモック
const mockState = {
  posts: [],
  selectedPostId: null,
  highlightedPostIds: [],
  loading: { isLoading: false },
  error: null,
  toasts: mockToasts,
  viewMode: 'timeline' as const
};

const mockDispatch = jest.fn();

jest.mock('../../context/AppContext', () => ({
  ...jest.requireActual('../../context/AppContext'),
  useAppContext: () => ({
    state: mockState,
    dispatch: mockDispatch
  })
}));

describe('ToastContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('トーストがない場合は何も表示されない', () => {
    // トーストが空の状態をモック
    const emptyState = { ...mockState, toasts: [] };
    jest.mocked(require('../../context/AppContext').useAppContext).mockReturnValue({
      state: emptyState,
      dispatch: mockDispatch
    });

    const { container } = render(<ToastContainer />);
    expect(container.firstChild).toBeNull();
  });

  it('複数のトーストが表示される', () => {
    render(<ToastContainer />);
    
    expect(screen.getByText('成功メッセージ')).toBeInTheDocument();
    expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();
    expect(screen.getByText('操作が完了しました')).toBeInTheDocument();
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
  });

  it('正しい位置にコンテナが配置される', () => {
    const { container } = render(<ToastContainer />);
    
    const toastContainer = container.firstChild as HTMLElement;
    expect(toastContainer).toHaveClass('fixed', 'top-4', 'right-4', 'z-50', 'space-y-2');
  });

  it('トーストの削除時にREMOVE_TOASTアクションがディスパッチされる', () => {
    render(<ToastContainer />);
    
    // 最初のトーストの閉じるボタンをクリック
    const closeButtons = screen.getAllByLabelText('通知を閉じる');
    closeButtons[0].click();
    
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'REMOVE_TOAST',
      payload: 'toast-1'
    });
  });

  it('各トーストに正しいpropsが渡される', () => {
    render(<ToastContainer />);
    
    // 各トーストのタイトルが表示されていることを確認
    mockToasts.forEach(toast => {
      expect(screen.getByText(toast.title)).toBeInTheDocument();
      if (toast.message) {
        expect(screen.getByText(toast.message)).toBeInTheDocument();
      }
    });
  });
});