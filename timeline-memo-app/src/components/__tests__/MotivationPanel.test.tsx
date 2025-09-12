import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MotivationPanel } from '../MotivationPanel';
import { MotivationMessage } from '../../types';
import { 
  renderWithProviders, 
  waitForElementToBeVisible, 
  assertElementExists,
  findByTextAndAssertVisible,
  assertElementNotExists
} from '../../test/helpers/renderHelpers';
import { 
  createMockMotivationMessage 
} from '../../test/fixtures/testData';

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

  describe('表示確認テスト', () => {
    it('モチベーションメッセージが正しく表示されることを確認する', async () => {
      const testMessage = createMockMotivationMessage({
        id: 'test-message-1',
        type: 'encouragement',
        title: '投稿をお待ちしています',
        message: '今日の出来事を記録してみませんか？',
        isVisible: true
      });

      Object.assign(mockMotivationData, {
        motivationMessages: [testMessage],
        daysSinceLastPost: 2,
        streakInfo: { current: 5, longest: 10 }
      });

      const { container } = render(<MotivationPanel />);

      // メインコンテナが表示されていることを確認
      const mainContainer = assertElementExists(container, '.space-y-3');
      await waitForElementToBeVisible(mainContainer);

      // 継続状況の概要が表示されていることを確認
      const summarySection = assertElementExists(container, '.bg-white.rounded-lg.border');
      await waitForElementToBeVisible(summarySection);

      // メッセージタイトルが表示されていることを確認
      const messageTitle = await findByTextAndAssertVisible('投稿をお待ちしています');
      expect(messageTitle).toBeInTheDocument();

      // メッセージ内容が表示されていることを確認
      const messageContent = await findByTextAndAssertVisible('今日の出来事を記録してみませんか？');
      expect(messageContent).toBeInTheDocument();

      // メッセージアイコンが表示されていることを確認
      const messageIcon = await findByTextAndAssertVisible('💭');
      expect(messageIcon).toBeInTheDocument();
    });

    it('統計データが正しく表示されることを確認する', async () => {
      const testMessage = createMockMotivationMessage({
        isVisible: true
      });

      Object.assign(mockMotivationData, {
        motivationMessages: [testMessage],
        daysSinceLastPost: 3,
        streakInfo: { current: 7, longest: 15 }
      });

      const { container } = render(<MotivationPanel />);

      // 最後の投稿からの日数が表示されていることを確認
      const lastPostText = await findByTextAndAssertVisible('最後の投稿から:');
      expect(lastPostText).toBeInTheDocument();
      
      const lastPostDays = await findByTextAndAssertVisible('3日');
      expect(lastPostDays).toBeInTheDocument();

      // 現在の連続記録が表示されていることを確認
      const currentStreakText = await findByTextAndAssertVisible('現在の連続記録:');
      expect(currentStreakText).toBeInTheDocument();
      
      const currentStreakDays = await findByTextAndAssertVisible('7日');
      expect(currentStreakDays).toBeInTheDocument();

      // 最長記録が表示されていることを確認
      const longestStreakText = await findByTextAndAssertVisible('最長記録:');
      expect(longestStreakText).toBeInTheDocument();
      
      const longestStreakDays = await findByTextAndAssertVisible('15日');
      expect(longestStreakDays).toBeInTheDocument();
    });

    it('メッセージタイプ別のスタイルが正しく表示されることを確認する', async () => {
      const encouragementMessage = createMockMotivationMessage({
        id: 'encouragement-msg',
        type: 'encouragement',
        title: '促進メッセージ',
        isVisible: true
      });

      Object.assign(mockMotivationData, {
        motivationMessages: [encouragementMessage]
      });

      const { container } = render(<MotivationPanel />);

      // 促進メッセージのスタイルが適用されていることを確認
      const messageElement = await screen.findByRole('alert');
      await waitForElementToBeVisible(messageElement);
      
      expect(messageElement).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
    });

    it('達成メッセージのスタイルが正しく表示されることを確認する', async () => {
      const achievementMessage = createMockMotivationMessage({
        id: 'achievement-msg',
        type: 'achievement',
        title: '達成メッセージ',
        isVisible: true
      });

      Object.assign(mockMotivationData, {
        motivationMessages: [achievementMessage]
      });

      const { container } = render(<MotivationPanel />);

      // 達成メッセージのスタイルが適用されていることを確認
      const messageElement = await screen.findByRole('alert');
      await waitForElementToBeVisible(messageElement);
      
      expect(messageElement).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
    });

    it('リマインダーメッセージのスタイルが正しく表示されることを確認する', async () => {
      const reminderMessage = createMockMotivationMessage({
        id: 'reminder-msg',
        type: 'reminder',
        title: 'リマインダーメッセージ',
        isVisible: true
      });

      Object.assign(mockMotivationData, {
        motivationMessages: [reminderMessage]
      });

      const { container } = render(<MotivationPanel />);

      // リマインダーメッセージのスタイルが適用されていることを確認
      const messageElement = await screen.findByRole('alert');
      await waitForElementToBeVisible(messageElement);
      
      expect(messageElement).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
    });

    it('閉じるボタンが正しく表示されることを確認する', async () => {
      const testMessage = createMockMotivationMessage({
        isVisible: true
      });

      Object.assign(mockMotivationData, {
        motivationMessages: [testMessage]
      });

      const { container } = render(<MotivationPanel />);

      // 閉じるボタンが表示されていることを確認
      const closeButton = await screen.findByLabelText('メッセージを閉じる');
      await waitForElementToBeVisible(closeButton);
      
      expect(closeButton).toBeInTheDocument();

      // SVGアイコンが表示されていることを確認
      const svgIcon = closeButton.querySelector('svg');
      expect(svgIcon).toBeInTheDocument();
      await waitForElementToBeVisible(svgIcon as HTMLElement);
    });

    it('追加情報が正しく表示されることを確認する', async () => {
      const messageWithDetails = createMockMotivationMessage({
        id: 'detailed-msg',
        type: 'encouragement',
        title: '詳細付きメッセージ',
        message: 'メッセージ内容',
        daysSinceLastPost: 5,
        streakCount: 10,
        isVisible: true
      });

      Object.assign(mockMotivationData, {
        motivationMessages: [messageWithDetails]
      });

      const { container } = render(<MotivationPanel />);

      // 投稿なし日数の追加情報が表示されていることを確認
      const daysSinceText = await findByTextAndAssertVisible('5日間投稿がありません');
      expect(daysSinceText).toBeInTheDocument();

      // 連続記録の追加情報が表示されていることを確認
      const streakText = await findByTextAndAssertVisible('10日連続達成！');
      expect(streakText).toBeInTheDocument();
    });

    it('期限付きメッセージで期限が正しく表示されることを確認する', async () => {
      const expiryDate = new Date('2024-12-31T23:59:59Z');
      const messageWithExpiry = createMockMotivationMessage({
        id: 'expiry-msg',
        title: '期限付きメッセージ',
        isVisible: true,
        expiresAt: expiryDate
      });

      Object.assign(mockMotivationData, {
        motivationMessages: [messageWithExpiry]
      });

      const { container } = render(<MotivationPanel />);

      // 期限表示が表示されていることを確認
      await waitFor(() => {
        expect(screen.getByText(/期限:/)).toBeInTheDocument();
      });

      // 期限の境界線が表示されていることを確認
      const expirySection = assertElementExists(container, '.border-t.border-current.border-opacity-20');
      await waitForElementToBeVisible(expirySection);
    });

    it('複数メッセージが正しく表示されることを確認する', async () => {
      const messages = [
        createMockMotivationMessage({
          id: 'msg-1',
          type: 'encouragement',
          title: 'メッセージ1',
          isVisible: true
        }),
        createMockMotivationMessage({
          id: 'msg-2',
          type: 'achievement',
          title: 'メッセージ2',
          isVisible: true
        }),
        createMockMotivationMessage({
          id: 'msg-3',
          type: 'reminder',
          title: 'メッセージ3',
          isVisible: true
        })
      ];

      Object.assign(mockMotivationData, {
        motivationMessages: messages
      });

      const { container } = render(<MotivationPanel />);

      // 全てのメッセージが表示されていることを確認
      const message1 = await findByTextAndAssertVisible('メッセージ1');
      const message2 = await findByTextAndAssertVisible('メッセージ2');
      const message3 = await findByTextAndAssertVisible('メッセージ3');

      expect(message1).toBeInTheDocument();
      expect(message2).toBeInTheDocument();
      expect(message3).toBeInTheDocument();

      // 3つのアラート要素が存在することを確認
      const alertElements = screen.getAllByRole('alert');
      expect(alertElements).toHaveLength(3);

      // 各アラート要素が表示されていることを確認
      for (const alert of alertElements) {
        await waitForElementToBeVisible(alert);
      }
    });

    it('非表示メッセージが表示されないことを確認する', async () => {
      const visibleMessage = createMockMotivationMessage({
        id: 'visible-msg',
        title: '表示メッセージ',
        isVisible: true
      });

      const hiddenMessage = createMockMotivationMessage({
        id: 'hidden-msg',
        title: '非表示メッセージ',
        isVisible: false
      });

      Object.assign(mockMotivationData, {
        motivationMessages: [visibleMessage, hiddenMessage]
      });

      const { container } = render(<MotivationPanel />);

      // 表示メッセージが表示されていることを確認
      const visibleText = await findByTextAndAssertVisible('表示メッセージ');
      expect(visibleText).toBeInTheDocument();

      // 非表示メッセージが表示されていないことを確認
      expect(screen.queryByText('非表示メッセージ')).not.toBeInTheDocument();

      // アラート要素が1つだけ存在することを確認
      const alertElements = screen.getAllByRole('alert');
      expect(alertElements).toHaveLength(1);
    });

    it('メッセージがない場合は何も表示されないことを確認する', () => {
      Object.assign(mockMotivationData, {
        motivationMessages: []
      });

      const { container } = render(<MotivationPanel />);

      // コンテナが空であることを確認
      expect(container.firstChild).toBeNull();
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