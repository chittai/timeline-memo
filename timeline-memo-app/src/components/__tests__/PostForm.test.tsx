import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { PostForm } from '../PostForm';
import { 
  renderWithProviders, 
  waitForElementToBeVisible, 
  assertElementExists,
  findByTextAndAssertVisible,
  assertFormElementState
} from '../../test/helpers/renderHelpers';

describe('PostForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('表示確認テスト', () => {
    it('フォーム要素が正しく表示されることを確認する', async () => {
      const { container } = render(<PostForm onSubmit={mockOnSubmit} />);
      
      // フォームコンテナが表示されていることを確認
      const formContainer = assertElementExists(container, '.bg-white.rounded-lg');
      await waitForElementToBeVisible(formContainer);
      
      // タイトルが表示されていることを確認
      const title = await findByTextAndAssertVisible('✍️ 新しい投稿');
      expect(title).toBeInTheDocument();
      
      // テキストエリアが表示されていることを確認
      const textarea = screen.getByLabelText('内容');
      await waitForElementToBeVisible(textarea);
      assertFormElementState(textarea, {
        isVisible: true,
        isDisabled: false,
        hasPlaceholder: '今日はどんな一日でしたか？'
      });
      
      // 投稿ボタンが表示されていることを確認
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await waitForElementToBeVisible(submitButton);
      expect(submitButton).toBeDisabled(); // 初期状態では無効
      
      // 文字数カウンターが表示されていることを確認
      const charCount = await findByTextAndAssertVisible('0 文字');
      expect(charCount).toBeInTheDocument();
      
      // ショートカットヒントが表示されていることを確認
      const shortcutHint = await findByTextAndAssertVisible('Ctrl+Enter で投稿');
      expect(shortcutHint).toBeInTheDocument();
    });

    it('編集モードで正しい表示になることを確認する', async () => {
      const initialContent = 'テスト投稿内容';
      const { container } = render(
        <PostForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
          initialContent={initialContent}
          isEditing={true}
        />
      );
      
      // 編集モードのタイトルが表示されていることを確認
      const title = await findByTextAndAssertVisible('📝 投稿を編集');
      expect(title).toBeInTheDocument();
      
      // 初期値が設定されたテキストエリアが表示されていることを確認
      const textarea = screen.getByLabelText('内容');
      await waitForElementToBeVisible(textarea);
      assertFormElementState(textarea, {
        isVisible: true,
        isDisabled: false,
        hasValue: initialContent
      });
      
      // 更新ボタンが表示されていることを確認
      const updateButton = screen.getByRole('button', { name: '更新' });
      await waitForElementToBeVisible(updateButton);
      expect(updateButton).toBeEnabled(); // 初期値があるので有効
      
      // キャンセルボタンが表示されていることを確認
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await waitForElementToBeVisible(cancelButton);
      expect(cancelButton).toBeEnabled();
      
      // 文字数カウンターが正しく表示されていることを確認
      const charCount = await findByTextAndAssertVisible(`${initialContent.length} 文字`);
      expect(charCount).toBeInTheDocument();
    });

    it('送信中の状態が正しく表示されることを確認する', async () => {
      const user = userEvent.setup();
      
      // 非同期のonSubmitをモック
      const mockAsyncSubmit = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      render(<PostForm onSubmit={mockAsyncSubmit} />);
      
      // テキストを入力
      const textarea = screen.getByLabelText('内容');
      await user.type(textarea, 'テスト投稿');
      
      // 投稿ボタンをクリック
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      // 送信中の表示を確認
      const submittingButton = await findByTextAndAssertVisible('投稿中...');
      expect(submittingButton).toBeInTheDocument();
      
      // ローディングスピナーが表示されていることを確認
      const spinner = screen.getByRole('button').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      await waitForElementToBeVisible(spinner as HTMLElement);
      
      // テキストエリアが無効化されていることを確認
      assertFormElementState(textarea, {
        isDisabled: true
      });
      
      // 送信完了まで待機
      await waitFor(() => {
        expect(mockAsyncSubmit).toHaveBeenCalled();
      });
    });

    it('バリデーションエラー状態が正しく表示されることを確認する', async () => {
      const user = userEvent.setup();
      render(<PostForm onSubmit={mockOnSubmit} />);
      
      // 空の状態で投稿ボタンの状態を確認
      const submitButton = screen.getByRole('button', { name: '投稿' });
      expect(submitButton).toBeDisabled();
      await waitForElementToBeVisible(submitButton);
      
      // 空白のみ入力した場合
      const textarea = screen.getByLabelText('内容');
      await user.type(textarea, '   ');
      
      // まだ無効状態であることを確認
      expect(submitButton).toBeDisabled();
      
      // 有効な内容を入力
      await user.clear(textarea);
      await user.type(textarea, 'テスト投稿');
      
      // ボタンが有効になることを確認
      expect(submitButton).toBeEnabled();
    });

    it('キャンセルボタンの表示制御が正しく動作することを確認する', async () => {
      // キャンセルボタンなしの場合
      const { rerender } = render(<PostForm onSubmit={mockOnSubmit} />);
      
      expect(screen.queryByRole('button', { name: 'キャンセル' })).not.toBeInTheDocument();
      
      // キャンセルボタンありの場合
      rerender(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await waitForElementToBeVisible(cancelButton);
      expect(cancelButton).toBeEnabled();
    });

    it('文字数カウンターが動的に更新されることを確認する', async () => {
      const user = userEvent.setup();
      render(<PostForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByLabelText('内容');
      
      // 初期状態
      expect(screen.getByText(/0\s*文字/)).toBeInTheDocument();
      
      // 文字を入力
      await user.type(textarea, 'テスト');
      await waitFor(() => {
        expect(screen.getByText(/3\s*文字/)).toBeInTheDocument();
      });
      
      // さらに文字を追加
      await user.type(textarea, '投稿');
      await waitFor(() => {
        expect(screen.getByText(/5\s*文字/)).toBeInTheDocument();
      });
      
      // 文字を削除
      await user.clear(textarea);
      await waitFor(() => {
        expect(screen.getByText(/0\s*文字/)).toBeInTheDocument();
      });
    });

    it('フォームのレイアウトが正しく表示されることを確認する', async () => {
      const { container } = render(
        <PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );
      
      // フォーム要素が存在することを確認
      const form = assertElementExists(container, 'form');
      await waitForElementToBeVisible(form);
      
      // ラベルが正しく関連付けられていることを確認
      const label = assertElementExists(container, 'label[for="content"]');
      await waitForElementToBeVisible(label);
      expect(label).toHaveTextContent('内容');
      
      // テキストエリアがラベルと関連付けられていることを確認
      const textarea = screen.getByLabelText('内容');
      expect(textarea).toHaveAttribute('id', 'content');
      
      // ボタンコンテナが正しく配置されていることを確認
      const buttonContainer = assertElementExists(container, '.flex.justify-end.space-x-3');
      await waitForElementToBeVisible(buttonContainer);
      
      // ボタンが正しい順序で配置されていることを確認
      const buttons = buttonContainer.querySelectorAll('button');
      expect(buttons).toHaveLength(2); // キャンセル + 投稿
      expect(buttons[0]).toHaveTextContent('キャンセル');
      expect(buttons[1]).toHaveTextContent('投稿');
    });
  });

  describe('機能テスト', () => {
    it('投稿内容を入力して送信できる', async () => {
      const user = userEvent.setup();
      render(<PostForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      const submitButton = screen.getByRole('button', { name: '投稿' });
      
      await user.type(textarea, 'テスト投稿');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('テスト投稿');
      });
    });

    it('Ctrl+Enterで投稿できる', async () => {
      const user = userEvent.setup();
      render(<PostForm onSubmit={mockOnSubmit} />);
      
      const textarea = screen.getByPlaceholderText('今日はどんな一日でしたか？');
      
      await user.type(textarea, 'キーボードショートカットテスト');
      await user.keyboard('{Control>}{Enter}{/Control}');
      
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith('キーボードショートカットテスト');
      });
    });

    it('空の内容では投稿できない', async () => {
      const user = userEvent.setup();
      render(<PostForm onSubmit={mockOnSubmit} />);
      
      const submitButton = screen.getByRole('button', { name: '投稿' });
      await user.click(submitButton);
      
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('キャンセルボタンが機能する', async () => {
      const user = userEvent.setup();
      render(<PostForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      
      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      await user.click(cancelButton);
      
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});