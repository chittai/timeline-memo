import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MotivationPanel } from '../MotivationPanel';
import { MotivationMessage } from '../../types';

// useMotivationフックのモック
const mockDismissMessage = vi.fn();
const mockMotivationData = {
  motivationMessages: [] as MotivationMessage[],
  lastPostDate: null,
  daysSinceLastPost: 0,
  dismissMessage: mockDismissMessage,
  clearAllMessages: vi.fn(),
  updateDaysSinceLastPost: vi.fn(),
  isEndOfMonth: false,
  streakInfo: { current: 0, longest: 0 }
};

vi.mock('../../hooks/useMotivation', () => ({
  useMotivation: () => mockMotivationData
}));

describe('MotivationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // モックデータをリセット
    Object.assign(mockMotivationData, {
      motivationMessages: [],
      daysSinceLastPost: 0,
      streakInfo: { current: 0, longest: 0 }
    });
  });

  describe('基本表示', () => {
    it('メッセージがない場合は何も表示されない', () => {
      const { container } = render(<MotivationPanel />);
      expect(container.firstChild).toBeNull();
    });

    it('継続状況の概要が表示される', () => {
      Object.assign(mockMotivationData, {
        daysSinceLastPost: 2,
        streakInfo: { current: 5, longest: 10 },
        motivationMessages: [{
          id: 'test-message',
          type: 'encouragement',
          title: 'テストメッセージ',
          message: 'テスト内容',
          isVisible: true,
          createdAt: new Date()
        }]
      });

      render(<MotivationPanel />);
      
      expect(screen.getByText('最後の投稿から:')).toBeInTheDocument();
      expect(screen.getByText('2日')).toBeInTheDocument();
      expect(screen.getByText('現在の連続記録:')).toBeInTheDocument();
      expect(screen.getByText('5日')).toBeInTheDocument();
      expect(screen.getByText('最長記録:')).toBeInTheDocument();
      expect(screen.getByText('10日')).toBeInTheDocument();
    });
  });

  describe('促進メッセージの表示', () => {
    it('促進メッセージが正しく表示される', () => {
      const encouragementMessage: MotivationMessage = {
        id: 'encouragement-1',
        type: 'encouragement',
        title: '投稿をお待ちしています',
        message: '3日間投稿がありません。今日の出来事を記録してみませんか？',
        daysSinceLastPost: 3,
        isVisible: true,
        createdAt: new Date()
      };

      Object.assign(mockMotivationData, {
        motivationMessages: [encouragementMessage],
        daysSinceLastPost: 3
      });

      render(<MotivationPanel />);
      
      expect(screen.getByText('投稿をお待ちしています')).toBeInTheDocument();
      expect(screen.getByText('3日間投稿がありません。今日の出来事を記録してみませんか？')).toBeInTheDocument();
      expect(screen.getByText('3日間投稿がありません')).toBeInTheDocument();
      expect(screen.getByText('💭')).toBeInTheDocument();
    });

    it('達成通知メッセージが正しく表示される', () => {
      const achievementMessage: MotivationMessage = {
        id: 'achievement-1',
        type: 'achievement',
        title: '3日連続達成！',
        message: '素晴らしい！3日連続で投稿を続けています。',
        streakCount: 3,
        isVisible: true,
        createdAt: new Date()
      };

      Object.assign(mockMotivationData, {
        motivationMessages: [achievementMessage]
      });

      render(<MotivationPanel />);
      
      expect(screen.getAllByText('3日連続達成！')).toHaveLength(2); // タイトルと追加情報で2つ
      expect(screen.getByText('素晴らしい！3日連続で投稿を続けています。')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('月末サマリーメッセージが正しく表示される', () => {
      const summaryMessage: MotivationMessage = {
        id: 'summary-1',
        type: 'reminder',
        title: '2024年1月のサマリー',
        message: '1月は10日間で15件の投稿がありました。素晴らしい記録です！',
        isVisible: true,
        createdAt: new Date()
      };

      Object.assign(mockMotivationData, {
        motivationMessages: [summaryMessage]
      });

      render(<MotivationPanel />);
      
      expect(screen.getByText('2024年1月のサマリー')).toBeInTheDocument();
      expect(screen.getByText('1月は10日間で15件の投稿がありました。素晴らしい記録です！')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
    });
  });

  describe('メッセージの操作', () => {
    it('閉じるボタンをクリックするとメッセージが削除される', () => {
      const testMessage: MotivationMessage = {
        id: 'test-message-1',
        type: 'encouragement',
        title: 'テストメッセージ',
        message: 'テスト内容',
        isVisible: true,
        createdAt: new Date()
      };

      Object.assign(mockMotivationData, {
        motivationMessages: [testMessage]
      });

      render(<MotivationPanel />);
      
      const closeButton = screen.getByLabelText('メッセージを閉じる');
      fireEvent.click(closeButton);
      
      expect(mockDismissMessage).toHaveBeenCalledWith('test-message-1');
    });

    it('非表示のメッセージは表示されない', () => {
      const visibleMessage: MotivationMessage = {
        id: 'visible-message',
        type: 'encouragement',
        title: '表示されるメッセージ',
        message: '表示される内容',
        isVisible: true,
        createdAt: new Date()
      };

      const hiddenMessage: MotivationMessage = {
        id: 'hidden-message',
        type: 'encouragement',
        title: '非表示のメッセージ',
        message: '非表示の内容',
        isVisible: false,
        createdAt: new Date()
      };

      Object.assign(mockMotivationData, {
        motivationMessages: [visibleMessage, hiddenMessage]
      });

      render(<MotivationPanel />);
      
      expect(screen.getByText('表示されるメッセージ')).toBeInTheDocument();
      expect(screen.queryByText('非表示のメッセージ')).not.toBeInTheDocument();
    });
  });

  describe('期限表示', () => {
    it('期限があるメッセージには期限が表示される', () => {
      const messageWithExpiry: MotivationMessage = {
        id: 'expiry-message',
        type: 'encouragement',
        title: '期限付きメッセージ',
        message: 'テスト内容',
        isVisible: true,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        expiresAt: new Date('2024-01-16T10:00:00Z')
      };

      Object.assign(mockMotivationData, {
        motivationMessages: [messageWithExpiry]
      });

      render(<MotivationPanel />);
      
      expect(screen.getAllByText((content, element) => {
        return element?.textContent === '期限: 2024年1月16日 19:00';
      })).toHaveLength(2); // 親要素と子要素で2つ表示される
    });

    it('期限がないメッセージには期限が表示されない', () => {
      const messageWithoutExpiry: MotivationMessage = {
        id: 'no-expiry-message',
        type: 'encouragement',
        title: '期限なしメッセージ',
        message: 'テスト内容',
        isVisible: true,
        createdAt: new Date()
      };

      Object.assign(mockMotivationData, {
        motivationMessages: [messageWithoutExpiry]
      });

      render(<MotivationPanel />);
      
      expect(screen.queryByText('期限:')).not.toBeInTheDocument();
    });
  });

  describe('スタイリング', () => {
    it('促進メッセージには黄色のスタイルが適用される', () => {
      const encouragementMessage: MotivationMessage = {
        id: 'encouragement-style',
        type: 'encouragement',
        title: 'スタイルテスト',
        message: 'テスト',
        isVisible: true,
        createdAt: new Date()
      };

      Object.assign(mockMotivationData, {
        motivationMessages: [encouragementMessage]
      });

      render(<MotivationPanel />);
      
      const messageElement = screen.getByRole('alert');
      expect(messageElement).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
    });

    it('達成通知には緑色のスタイルが適用される', () => {
      const achievementMessage: MotivationMessage = {
        id: 'achievement-style',
        type: 'achievement',
        title: 'スタイルテスト',
        message: 'テスト',
        isVisible: true,
        createdAt: new Date()
      };

      Object.assign(mockMotivationData, {
        motivationMessages: [achievementMessage]
      });

      render(<MotivationPanel />);
      
      const messageElement = screen.getByRole('alert');
      expect(messageElement).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
    });

    it('リマインダーには青色のスタイルが適用される', () => {
      const reminderMessage: MotivationMessage = {
        id: 'reminder-style',
        type: 'reminder',
        title: 'スタイルテスト',
        message: 'テスト',
        isVisible: true,
        createdAt: new Date()
      };

      Object.assign(mockMotivationData, {
        motivationMessages: [reminderMessage]
      });

      render(<MotivationPanel />);
      
      const messageElement = screen.getByRole('alert');
      expect(messageElement).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
    });
  });

  describe('アクセシビリティ', () => {
    it('メッセージにはrole="alert"が設定される', () => {
      const testMessage: MotivationMessage = {
        id: 'accessibility-test',
        type: 'encouragement',
        title: 'アクセシビリティテスト',
        message: 'テスト',
        isVisible: true,
        createdAt: new Date()
      };

      Object.assign(mockMotivationData, {
        motivationMessages: [testMessage]
      });

      render(<MotivationPanel />);
      
      const messageElement = screen.getByRole('alert');
      expect(messageElement).toHaveAttribute('aria-live', 'polite');
    });

    it('閉じるボタンにはaria-labelが設定される', () => {
      const testMessage: MotivationMessage = {
        id: 'button-test',
        type: 'encouragement',
        title: 'ボタンテスト',
        message: 'テスト',
        isVisible: true,
        createdAt: new Date()
      };

      Object.assign(mockMotivationData, {
        motivationMessages: [testMessage]
      });

      render(<MotivationPanel />);
      
      const closeButton = screen.getByLabelText('メッセージを閉じる');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('複数メッセージの表示', () => {
    it('複数のメッセージが同時に表示される', () => {
      const messages: MotivationMessage[] = [
        {
          id: 'message-1',
          type: 'encouragement',
          title: 'メッセージ1',
          message: '内容1',
          isVisible: true,
          createdAt: new Date()
        },
        {
          id: 'message-2',
          type: 'achievement',
          title: 'メッセージ2',
          message: '内容2',
          isVisible: true,
          createdAt: new Date()
        }
      ];

      Object.assign(mockMotivationData, {
        motivationMessages: messages
      });

      render(<MotivationPanel />);
      
      expect(screen.getByText('メッセージ1')).toBeInTheDocument();
      expect(screen.getByText('メッセージ2')).toBeInTheDocument();
      expect(screen.getAllByRole('alert')).toHaveLength(2);
    });
  });
});