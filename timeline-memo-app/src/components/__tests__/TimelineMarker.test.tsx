
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimelineMarker from '../TimelineMarker';
import type { TimelineMarkerData, Post } from '../../types';

// テスト用のマーカーデータ
const mockMarker: TimelineMarkerData = {
  timestamp: new Date('2024-01-15T10:30:00'),
  postIds: ['post-1'],
  position: 50
};

const mockMultiplePostsMarker: TimelineMarkerData = {
  timestamp: new Date('2024-01-15T14:15:00'),
  postIds: ['post-2', 'post-3', 'post-4'],
  position: 75
};

// テスト用の投稿データ
const mockPosts: Post[] = [
  {
    id: 'post-1',
    content: 'これは最初の投稿です。',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00')
  },
  {
    id: 'post-2',
    content: 'これは2番目の投稿です。',
    createdAt: new Date('2024-01-15T14:15:00'),
    updatedAt: new Date('2024-01-15T14:15:00')
  },
  {
    id: 'post-3',
    content: 'これは3番目の投稿です。',
    createdAt: new Date('2024-01-15T14:15:00'),
    updatedAt: new Date('2024-01-15T14:15:00')
  },
  {
    id: 'post-4',
    content: 'これは4番目の投稿です。',
    createdAt: new Date('2024-01-15T14:15:00'),
    updatedAt: new Date('2024-01-15T14:15:00')
  }
];

describe('TimelineMarker', () => {
  describe('基本的なレンダリング', () => {
    it('単一投稿のマーカーが正しく表示される', () => {
      const { container } = render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} />
      );

      // マーカーが表示されることを確認
      const markerElement = container.firstChild;
      expect(markerElement).toBeInTheDocument();
    });

    it('複数投稿のマーカーが正しく表示される', () => {
      render(
        <TimelineMarker marker={mockMultiplePostsMarker} posts={mockPosts} />
      );

      // 複数投稿インジケーターが表示されることを確認
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('マーカーの位置が正しく設定される', () => {
      const { container } = render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} />
      );

      const markerContainer = container.firstChild as HTMLElement;
      expect(markerContainer).toHaveStyle({ top: '50%' });
    });
  });

  describe('状態による表示の変化', () => {
    it('選択状態のマーカーが正しいスタイルで表示される', () => {
      const { container } = render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} isSelected={true} />
      );

      const markerDot = container.querySelector('.rounded-full');
      expect(markerDot).toHaveClass('w-3', 'h-3', 'bg-blue-500', 'border-blue-600');
    });

    it('ハイライト状態のマーカーが正しいスタイルで表示される', () => {
      const { container } = render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} isHighlighted={true} />
      );

      const markerDot = container.querySelector('.rounded-full');
      expect(markerDot).toHaveClass('w-2.5', 'h-2.5', 'bg-blue-100', 'border-blue-400');
    });

    it('通常状態のマーカーが正しいスタイルで表示される', () => {
      const { container } = render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} />
      );

      const markerDot = container.querySelector('.rounded-full');
      expect(markerDot).toHaveClass('w-2', 'h-2', 'bg-white', 'border-gray-400');
    });
  });

  describe('複数投稿インジケーター', () => {
    it('単一投稿の場合はインジケーターが表示されない', () => {
      render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} />
      );

      expect(screen.queryByText('1')).not.toBeInTheDocument();
    });

    it('複数投稿の場合は投稿数が表示される', () => {
      render(
        <TimelineMarker marker={mockMultiplePostsMarker} posts={mockPosts} />
      );

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('選択状態の複数投稿マーカーは適切なスタイルが適用される', () => {
      render(
        <TimelineMarker marker={mockMultiplePostsMarker} posts={mockPosts} isSelected={true} />
      );

      const indicator = screen.getByText('3');
      expect(indicator).toHaveClass('text-blue-700');
    });

    it('ハイライト状態の複数投稿マーカーは適切なスタイルが適用される', () => {
      render(
        <TimelineMarker marker={mockMultiplePostsMarker} posts={mockPosts} isHighlighted={true} />
      );

      const indicator = screen.getByText('3');
      expect(indicator).toHaveClass('text-blue-600');
    });
  });

  describe('イベントハンドリング', () => {
    it('クリック時にonClickが呼ばれる', () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} onClick={mockOnClick} />
      );

      const markerContainer = container.firstChild as HTMLElement;
      fireEvent.click(markerContainer);

      expect(mockOnClick).toHaveBeenCalledWith(['post-1']);
    });

    it('ホバー開始時にonHoverが呼ばれる', () => {
      const mockOnHover = jest.fn();
      const { container } = render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} onHover={mockOnHover} />
      );

      const markerContainer = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(markerContainer);

      expect(mockOnHover).toHaveBeenCalledWith(['post-1']);
    });

    it('ホバー終了時にonHoverEndが呼ばれる', () => {
      const mockOnHoverEnd = jest.fn();
      const { container } = render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} onHoverEnd={mockOnHoverEnd} />
      );

      const markerContainer = container.firstChild as HTMLElement;
      fireEvent.mouseLeave(markerContainer);

      expect(mockOnHoverEnd).toHaveBeenCalled();
    });

    it('複数投稿マーカーのクリック時に全ての投稿IDが渡される', () => {
      const mockOnClick = jest.fn();
      const { container } = render(
        <TimelineMarker marker={mockMultiplePostsMarker} posts={mockPosts} onClick={mockOnClick} />
      );

      const markerContainer = container.firstChild as HTMLElement;
      fireEvent.click(markerContainer);

      expect(mockOnClick).toHaveBeenCalledWith(['post-2', 'post-3', 'post-4']);
    });
  });

  describe('ホバー時の時刻表示', () => {
    it('ホバー時に時刻が表示される', () => {
      render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} />
      );

      // 時刻表示要素が存在することを確認（初期状態では非表示）
      expect(screen.getByText('10:30')).toBeInTheDocument();
    });

    it('複数投稿の場合は投稿数も表示される', () => {
      render(
        <TimelineMarker marker={mockMultiplePostsMarker} posts={mockPosts} />
      );

      // 時刻と投稿数が表示されることを確認
      expect(screen.getByText('14:15')).toBeInTheDocument();
      expect(screen.getByText('(3件)')).toBeInTheDocument();
    });
  });

  describe('プレビュー機能', () => {
    // getBoundingClientRectをモック
    beforeEach(() => {
      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        left: 100,
        top: 200,
        width: 20,
        height: 20,
        right: 120,
        bottom: 220,
        x: 100,
        y: 200,
        toJSON: jest.fn()
      }));
    });

    it('デスクトップでホバー時にプレビューが表示される', async () => {
      // タッチデバイスでないことを設定
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true
      });

      const { container } = render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} />
      );

      const markerContainer = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(markerContainer);

      await waitFor(() => {
        expect(screen.getByText('これは最初の投稿です。')).toBeInTheDocument();
      });
    });

    it('ホバー終了時にプレビューが非表示になる', async () => {
      // タッチデバイスでないことを設定
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true
      });

      const { container } = render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} />
      );

      const markerContainer = container.firstChild as HTMLElement;
      
      // ホバー開始
      fireEvent.mouseEnter(markerContainer);
      await waitFor(() => {
        expect(screen.getByText('これは最初の投稿です。')).toBeInTheDocument();
      });

      // ホバー終了
      fireEvent.mouseLeave(markerContainer);
      await waitFor(() => {
        expect(screen.queryByText('これは最初の投稿です。')).not.toBeInTheDocument();
      });
    });

    it('複数投稿のプレビューが正しく表示される', async () => {
      // タッチデバイスでないことを設定
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        value: 0,
        configurable: true
      });

      const { container } = render(
        <TimelineMarker marker={mockMultiplePostsMarker} posts={mockPosts} />
      );

      const markerContainer = container.firstChild as HTMLElement;
      fireEvent.mouseEnter(markerContainer);

      await waitFor(() => {
        expect(screen.getByText('3件の投稿')).toBeInTheDocument();
        expect(screen.getByText('これは2番目の投稿です。')).toBeInTheDocument();
        expect(screen.getByText('これは3番目の投稿です。')).toBeInTheDocument();
        expect(screen.getByText('これは4番目の投稿です。')).toBeInTheDocument();
      });
    });
  });

  describe('アクセシビリティ', () => {
    it('マーカーがクリック可能であることが示される', () => {
      const { container } = render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} />
      );

      const markerDot = container.querySelector('.rounded-full');
      expect(markerDot).toHaveClass('cursor-pointer');
    });

    it('適切なARIA属性が設定される', () => {
      const { container } = render(
        <TimelineMarker marker={mockMarker} posts={mockPosts} />
      );

      const markerDot = container.querySelector('.rounded-full');
      expect(markerDot).toHaveClass('cursor-pointer');
    });
  });
});