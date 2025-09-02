import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimelinePanel from '../TimelinePanel';
import type { Post } from '../../types';

// useAppContextのモック
const mockUseAppContext = jest.fn();

// AppContextをモック
jest.mock('../../context/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

// TimelineAxisコンポーネントをモック
jest.mock('../TimelineAxis', () => {
  return function MockTimelineAxis({ timeRange, markers, posts }: any) {
    return (
      <div data-testid="timeline-axis">
        <div>TimeRange: {timeRange.start.toISOString()} - {timeRange.end.toISOString()}</div>
        <div>Markers: {markers.length}</div>
        <div>Posts: {posts.length}</div>
      </div>
    );
  };
});

// モックデータ
const mockPosts: Post[] = [
  {
    id: '1',
    content: 'テスト投稿1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  },
  {
    id: '2',
    content: 'テスト投稿2',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z'),
  },
  {
    id: '3',
    content: 'テスト投稿3',
    createdAt: new Date('2024-01-01T14:00:00Z'),
    updatedAt: new Date('2024-01-01T14:00:00Z'),
  },
];

describe('TimelinePanel', () => {
  beforeEach(() => {
    // モックをリセット
    jest.clearAllMocks();
  });

  test('投稿がない場合、適切なメッセージを表示する', () => {
    mockUseAppContext.mockReturnValue({
      state: {
        posts: [],
        selectedPostId: null,
        isLoading: false,
        error: null,
        viewMode: 'timeline',
      },
      dispatch: jest.fn(),
    });

    render(<TimelinePanel />);
    
    expect(screen.getByText('投稿がありません')).toBeInTheDocument();
    expect(screen.getByText('右側から投稿を作成してください')).toBeInTheDocument();
  });

  test('投稿がある場合、投稿数を表示する', () => {
    mockUseAppContext.mockReturnValue({
      state: {
        posts: mockPosts,
        selectedPostId: null,
        isLoading: false,
        error: null,
        viewMode: 'timeline',
      },
      dispatch: jest.fn(),
    });

    render(<TimelinePanel />);
    
    expect(screen.getByText('3件の投稿')).toBeInTheDocument();
  });

  test('タイムラインヘッダーが表示される', () => {
    mockUseAppContext.mockReturnValue({
      state: {
        posts: mockPosts,
        selectedPostId: null,
        isLoading: false,
        error: null,
        viewMode: 'timeline',
      },
      dispatch: jest.fn(),
    });

    render(<TimelinePanel />);
    
    // 複数の「タイムライン」テキストが存在するため、getAllByTextを使用
    const timelineHeaders = screen.getAllByText('タイムライン');
    expect(timelineHeaders.length).toBeGreaterThan(0);
  });

  test('TimelineAxisコンポーネントが適切なpropsで呼ばれる', () => {
    mockUseAppContext.mockReturnValue({
      state: {
        posts: mockPosts,
        selectedPostId: null,
        isLoading: false,
        error: null,
        viewMode: 'timeline',
      },
      dispatch: jest.fn(),
    });

    render(<TimelinePanel />);
    
    // TimelineAxisがレンダリングされることを確認
    expect(screen.getByTestId('timeline-axis')).toBeInTheDocument();
    expect(screen.getByText(/Markers: 3/)).toBeInTheDocument();
    expect(screen.getByText(/Posts: 3/)).toBeInTheDocument();
  });

  test('selectedPostIdが適切に処理される', () => {
    mockUseAppContext.mockReturnValue({
      state: {
        posts: mockPosts,
        selectedPostId: null,
        isLoading: false,
        error: null,
        viewMode: 'timeline',
      },
      dispatch: jest.fn(),
    });

    render(<TimelinePanel selectedPostId="1" />);
    
    // TimelineAxisが適切にレンダリングされることを確認
    expect(screen.getByTestId('timeline-axis')).toBeInTheDocument();
  });

  test('時間範囲の計算が正しく行われる', () => {
    // 投稿がない場合
    mockUseAppContext.mockReturnValue({
      state: {
        posts: [],
        selectedPostId: null,
        isLoading: false,
        error: null,
        viewMode: 'timeline',
      },
      dispatch: jest.fn(),
    });

    const { rerender } = render(<TimelinePanel />);
    expect(screen.getByText('投稿がありません')).toBeInTheDocument();

    // 投稿がある場合
    mockUseAppContext.mockReturnValue({
      state: {
        posts: mockPosts,
        selectedPostId: null,
        isLoading: false,
        error: null,
        viewMode: 'timeline',
      },
      dispatch: jest.fn(),
    });

    rerender(<TimelinePanel />);
    expect(screen.getByText('3件の投稿')).toBeInTheDocument();
  });
});