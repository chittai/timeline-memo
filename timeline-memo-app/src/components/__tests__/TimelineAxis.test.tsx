import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimelineAxis from '../TimelineAxis';
import type { TimelineMarkerData, Post } from '../../types';

// TimelineMarkerコンポーネントをモック
jest.mock('../TimelineMarker', () => {
  return function MockTimelineMarker({ marker, isSelected, isHighlighted, onClick, onHover }: any) {
    return (
      <div
        data-testid={`marker-${marker.postIds.join('-')}`}
        data-selected={isSelected}
        data-highlighted={isHighlighted}
        onClick={() => onClick?.(marker.postIds)}
        onMouseEnter={() => onHover?.(marker.postIds)}
      >
        {marker.postIds.length > 1 && <span>{marker.postIds.length}</span>}
      </div>
    );
  };
});

// ユーティリティ関数をモック
jest.mock('../../utils/timelineUtils', () => ({
  generateTimeLabels: jest.fn(() => [
    { time: new Date('2024-01-01T10:00:00Z'), position: 25, label: '10:00' },
    { time: new Date('2024-01-01T12:00:00Z'), position: 50, label: '12:00' },
    { time: new Date('2024-01-01T14:00:00Z'), position: 75, label: '14:00' },
  ]),
  isCurrentTimeInRange: jest.fn(() => false),
  getCurrentTimePosition: jest.fn(() => 50),
}));

// モックデータ
const mockTimeRange = {
  start: new Date('2024-01-01T08:00:00Z'),
  end: new Date('2024-01-01T16:00:00Z'),
};

const mockMarkers: TimelineMarkerData[] = [
  {
    timestamp: new Date('2024-01-01T10:00:00Z'),
    postIds: ['1'],
    position: 25,
  },
  {
    timestamp: new Date('2024-01-01T12:00:00Z'),
    postIds: ['2', '3'], // 複数投稿
    position: 50,
  },
  {
    timestamp: new Date('2024-01-01T14:00:00Z'),
    postIds: ['4'],
    position: 75,
  },
];

const mockPosts: Post[] = [
  {
    id: '1',
    content: 'テスト投稿1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z')
  },
  {
    id: '2',
    content: 'テスト投稿2',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z')
  },
  {
    id: '3',
    content: 'テスト投稿3',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    updatedAt: new Date('2024-01-01T12:00:00Z')
  },
  {
    id: '4',
    content: 'テスト投稿4',
    createdAt: new Date('2024-01-01T14:00:00Z'),
    updatedAt: new Date('2024-01-01T14:00:00Z')
  }
];

describe('TimelineAxis', () => {
  test('時間軸ラインが表示される', () => {
    const { container } = render(
      <TimelineAxis
        timeRange={mockTimeRange}
        markers={[]}
        posts={[]}
      />
    );
    
    // 時間軸ラインの要素が存在することを確認
    expect(container.firstChild).toBeInTheDocument();
  });

  test('時間ラベルが適切に表示される', () => {
    render(
      <TimelineAxis
        timeRange={mockTimeRange}
        markers={[]}
        posts={[]}
      />
    );
    
    // モックされた時間ラベルが表示されることを確認
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
  });

  test('マーカーが正しく表示される', () => {
    render(
      <TimelineAxis
        timeRange={mockTimeRange}
        markers={mockMarkers}
        posts={mockPosts}
      />
    );
    
    // 各マーカーが表示されることを確認
    expect(screen.getByTestId('marker-1')).toBeInTheDocument();
    expect(screen.getByTestId('marker-2-3')).toBeInTheDocument();
    expect(screen.getByTestId('marker-4')).toBeInTheDocument();
  });

  test('複数投稿のマーカーに数字が表示される', () => {
    render(
      <TimelineAxis
        timeRange={mockTimeRange}
        markers={mockMarkers}
        posts={mockPosts}
      />
    );
    
    // 複数投稿のインジケーター（数字）が表示されることを確認
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('選択されたマーカーが適切にハイライトされる', () => {
    render(
      <TimelineAxis
        timeRange={mockTimeRange}
        markers={mockMarkers}
        posts={mockPosts}
        selectedPostId="1"
      />
    );
    
    // 選択状態のマーカーが適切にマークされることを確認
    const selectedMarker = screen.getByTestId('marker-1');
    expect(selectedMarker).toHaveAttribute('data-selected', 'true');
  });

  test('ハイライトされたマーカーが適切に表示される', () => {
    render(
      <TimelineAxis
        timeRange={mockTimeRange}
        markers={mockMarkers}
        posts={mockPosts}
        highlightedPostIds={['2', '3']}
      />
    );
    
    // ハイライト状態のマーカーが適切にマークされることを確認
    const highlightedMarker = screen.getByTestId('marker-2-3');
    expect(highlightedMarker).toHaveAttribute('data-highlighted', 'true');
  });

  test('マーカークリック時にコールバックが呼ばれる', () => {
    const mockOnMarkerClick = jest.fn();
    
    render(
      <TimelineAxis
        timeRange={mockTimeRange}
        markers={mockMarkers}
        posts={mockPosts}
        onMarkerClick={mockOnMarkerClick}
      />
    );
    
    // マーカーをクリック
    fireEvent.click(screen.getByTestId('marker-1'));
    
    expect(mockOnMarkerClick).toHaveBeenCalledWith(['1']);
  });

  test('マーカーホバー時にコールバックが呼ばれる', () => {
    const mockOnMarkerHover = jest.fn();
    
    render(
      <TimelineAxis
        timeRange={mockTimeRange}
        markers={mockMarkers}
        posts={mockPosts}
        onMarkerHover={mockOnMarkerHover}
      />
    );
    
    // マーカーにホバー
    fireEvent.mouseEnter(screen.getByTestId('marker-2-3'));
    
    expect(mockOnMarkerHover).toHaveBeenCalledWith(['2', '3']);
  });

  test('現在時刻インジケーターの表示制御', () => {
    const { isCurrentTimeInRange } = require('../../utils/timelineUtils');
    
    // 現在時刻が範囲内の場合
    isCurrentTimeInRange.mockReturnValue(true);
    
    const { rerender } = render(
      <TimelineAxis
        timeRange={mockTimeRange}
        markers={[]}
        posts={[]}
      />
    );
    
    expect(screen.getByText('現在')).toBeInTheDocument();
    
    // 現在時刻が範囲外の場合
    isCurrentTimeInRange.mockReturnValue(false);
    
    rerender(
      <TimelineAxis
        timeRange={mockTimeRange}
        markers={[]}
        posts={[]}
      />
    );
    
    expect(screen.queryByText('現在')).not.toBeInTheDocument();
  });
});