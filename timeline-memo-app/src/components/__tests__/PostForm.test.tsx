import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PostForm } from '../PostForm';
import { AppProvider } from '../../context/AppContext';
import type { Post } from '../../types';

// react-markdownのモック
jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

// usePosts フックのモック
const mockCreatePost = jest.fn();
const mockUpdatePost = jest.fn();
const mockUsePosts = {
  createPost: mockCreatePost,
  updatePost: mockUpdatePost,
  isLoading: false,
  posts: [],
  selectedPostId: null,
  error: null,
  loadPosts: jest.fn(),
  deletePost: jest.fn(),
  selectPost: jest.fn(),
  clearError: jest.fn(),
  getPost: jest.fn(),
  getPostsByDateRange: jest.fn()
};

// テスト用のモック投稿データ
const mockEditingPost: Post = {
  id: 'test-post-1',
  content: 'これは編集対象の投稿内容です。',
  createdAt: new Date('2024-01-15T10:30:00Z'),
  updatedAt: new Date('2024-01-15T10:30:00Z')
};

jest.mock('../../hooks/usePosts', () => ({
  usePosts: () => mockUsePosts
}));

// テスト用のラッパーコンポーネント
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppProvider>{children}</AppProvider>
);

describe('PostForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('正常にレンダリングされる', () => {
    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    expect(screen.getByText('新規投稿')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ここにメモや感情を記録してください/)).toBeInTheDocument();
    expect(screen.getByText('投稿する')).toBeInTheDocument();
  });

  it('テキストエリアに入力できる', () => {
    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    fireEvent.change(textarea, { target: { value: 'テストコンテンツ' } });

    expect(textarea).toHaveValue('テストコンテンツ');
  });

  it('文字数が表示される', () => {
    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    fireEvent.change(textarea, { target: { value: 'テスト' } });

    expect(screen.getByText('3 文字')).toBeInTheDocument();
  });

  it('プレビューモードに切り替えできる', () => {
    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    fireEvent.change(textarea, { target: { value: '**太字テスト**' } });

    const previewButton = screen.getByText('プレビュー');
    fireEvent.click(previewButton);

    expect(screen.getByText('編集')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/ここにメモや感情を記録してください/)).not.toBeInTheDocument();
  });

  it('Markdownがプレビューで正しくレンダリングされる', () => {
    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    fireEvent.change(textarea, { target: { value: '**太字テスト**' } });

    const previewButton = screen.getByText('プレビュー');
    fireEvent.click(previewButton);

    const markdownContent = screen.getByTestId('markdown-content');
    expect(markdownContent).toHaveTextContent('**太字テスト**');
  });

  it('空のコンテンツでは投稿ボタンが無効になる', () => {
    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: '投稿する' });
    expect(submitButton).toBeDisabled();
  });

  it('コンテンツがある場合は投稿ボタンが有効になる', () => {
    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    fireEvent.change(textarea, { target: { value: 'テストコンテンツ' } });

    const submitButton = screen.getByRole('button', { name: '投稿する' });
    expect(submitButton).not.toBeDisabled();
  });

  it('フォーム送信時にcreatePostが呼ばれる', async () => {
    mockCreatePost.mockResolvedValue({
      id: 'test-id',
      content: 'テストコンテンツ',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    fireEvent.change(textarea, { target: { value: 'テストコンテンツ' } });

    const submitButton = screen.getByRole('button', { name: '投稿する' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith('テストコンテンツ');
    });
  });

  it('投稿成功後にフォームがリセットされる', async () => {
    mockCreatePost.mockResolvedValue({
      id: 'test-id',
      content: 'テストコンテンツ',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    fireEvent.change(textarea, { target: { value: 'テストコンテンツ' } });

    const submitButton = screen.getByRole('button', { name: '投稿する' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(textarea).toHaveValue('');
    });
  });

  it('リセットボタンでフォームがクリアされる', () => {
    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    fireEvent.change(textarea, { target: { value: 'テストコンテンツ' } });

    const resetButton = screen.getByText('リセット');
    fireEvent.click(resetButton);

    expect(textarea).toHaveValue('');
  });

  it('空のコンテンツでリセットボタンが無効になる', () => {
    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const resetButton = screen.getByText('リセット');
    expect(resetButton).toBeDisabled();
  });

  it('バリデーションエラーが表示される', async () => {
    // createPostでエラーを発生させる
    mockCreatePost.mockRejectedValue(new Error('投稿の作成に失敗しました'));

    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    fireEvent.change(textarea, { target: { value: 'テストコンテンツ' } });

    const submitButton = screen.getByRole('button', { name: '投稿する' });
    fireEvent.click(submitButton);

    // createPostが呼ばれることを確認
    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith('テストコンテンツ');
    });
  });

  it('onSubmitSuccessコールバックが呼ばれる', async () => {
    const mockOnSubmitSuccess = jest.fn();
    mockCreatePost.mockResolvedValue({
      id: 'test-id',
      content: 'テストコンテンツ',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    render(
      <TestWrapper>
        <PostForm onSubmitSuccess={mockOnSubmitSuccess} />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    fireEvent.change(textarea, { target: { value: 'テストコンテンツ' } });

    const submitButton = screen.getByRole('button', { name: '投稿する' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmitSuccess).toHaveBeenCalled();
    });
  });

  it('ローディング中は操作が無効になる', () => {
    mockUsePosts.isLoading = true;

    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    const previewButton = screen.getByRole('button', { name: 'プレビュー' });
    const resetButton = screen.getByRole('button', { name: 'リセット' });
    const submitButton = screen.getByRole('button', { name: '投稿する' });

    expect(textarea).toBeDisabled();
    expect(previewButton).toBeDisabled();
    expect(resetButton).toBeDisabled();
    expect(submitButton).toBeDisabled();

    // テスト後にリセット
    mockUsePosts.isLoading = false;
  });

  it('プレビューモードで空のコンテンツメッセージが表示される', () => {
    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const previewButton = screen.getByRole('button', { name: 'プレビュー' });
    fireEvent.click(previewButton);

    expect(screen.getByText('プレビューするコンテンツがありません')).toBeInTheDocument();
  });

  it('Markdownヘルプが表示される', () => {
    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    expect(screen.getByText('Markdown記法のヒント:')).toBeInTheDocument();
    expect(screen.getByText('**太字**')).toBeInTheDocument();
    expect(screen.getByText('*斜体*')).toBeInTheDocument();
  });

  it('空白のみのコンテンツでは投稿ボタンが無効になる', () => {
    render(
      <TestWrapper>
        <PostForm />
      </TestWrapper>
    );

    const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
    fireEvent.change(textarea, { target: { value: '   ' } }); // 空白のみ

    const submitButton = screen.getByRole('button', { name: '投稿する' });
    expect(submitButton).toBeDisabled();
  });

  describe('編集モード', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('編集モードで正しくレンダリングされる', () => {
      render(
        <TestWrapper>
          <PostForm editingPost={mockEditingPost} />
        </TestWrapper>
      );

      expect(screen.getByText('投稿を編集')).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockEditingPost.content)).toBeInTheDocument();
      expect(screen.getByText('更新する')).toBeInTheDocument();
      expect(screen.getAllByText('キャンセル')).toHaveLength(1);
    });

    it('編集モードでは既存の投稿内容が表示される', () => {
      render(
        <TestWrapper>
          <PostForm editingPost={mockEditingPost} />
        </TestWrapper>
      );

      const textarea = screen.getByDisplayValue(mockEditingPost.content);
      expect(textarea).toHaveValue(mockEditingPost.content);
    });

    it('編集モードではリセットボタンが表示されない', () => {
      render(
        <TestWrapper>
          <PostForm editingPost={mockEditingPost} />
        </TestWrapper>
      );

      expect(screen.queryByText('リセット')).not.toBeInTheDocument();
    });

    it('編集モードでフォーム送信時にupdatePostが呼ばれる', async () => {
      const updatedContent = '更新された投稿内容です。';
      mockUpdatePost.mockResolvedValue({
        ...mockEditingPost,
        content: updatedContent,
        updatedAt: new Date()
      });

      render(
        <TestWrapper>
          <PostForm editingPost={mockEditingPost} />
        </TestWrapper>
      );

      const textarea = screen.getByDisplayValue(mockEditingPost.content);
      fireEvent.change(textarea, { target: { value: updatedContent } });

      const submitButton = screen.getByRole('button', { name: '更新する' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdatePost).toHaveBeenCalledWith(mockEditingPost.id, updatedContent);
      });
    });

    it('キャンセルボタンクリックでonCancelが呼ばれる', () => {
      const mockOnCancel = jest.fn();

      render(
        <TestWrapper>
          <PostForm editingPost={mockEditingPost} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: 'キャンセル' });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('編集成功後にonSubmitSuccessが呼ばれる', async () => {
      const mockOnSubmitSuccess = jest.fn();
      mockUpdatePost.mockResolvedValue({
        ...mockEditingPost,
        content: '更新された内容',
        updatedAt: new Date()
      });

      render(
        <TestWrapper>
          <PostForm 
            editingPost={mockEditingPost} 
            onSubmitSuccess={mockOnSubmitSuccess} 
          />
        </TestWrapper>
      );

      const textarea = screen.getByDisplayValue(mockEditingPost.content);
      fireEvent.change(textarea, { target: { value: '更新された内容' } });

      const submitButton = screen.getByRole('button', { name: '更新する' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmitSuccess).toHaveBeenCalled();
      });
    });

    it('編集モードでプレビューが正しく動作する', () => {
      render(
        <TestWrapper>
          <PostForm editingPost={mockEditingPost} />
        </TestWrapper>
      );

      const previewButton = screen.getByText('プレビュー');
      fireEvent.click(previewButton);

      expect(screen.getByText('編集')).toBeInTheDocument();
      const markdownContent = screen.getByTestId('markdown-content');
      expect(markdownContent).toHaveTextContent(mockEditingPost.content);
    });

    it('編集対象の投稿が変更された時にフォームが初期化される', () => {
      const { rerender } = render(
        <TestWrapper>
          <PostForm editingPost={mockEditingPost} />
        </TestWrapper>
      );

      // 内容を変更
      const textarea = screen.getByDisplayValue(mockEditingPost.content);
      fireEvent.change(textarea, { target: { value: '変更された内容' } });
      expect(textarea).toHaveValue('変更された内容');

      // 別の投稿に変更
      const anotherPost: Post = {
        ...mockEditingPost,
        id: 'another-post',
        content: '別の投稿内容'
      };

      rerender(
        <TestWrapper>
          <PostForm editingPost={anotherPost} />
        </TestWrapper>
      );

      // フォームが新しい投稿の内容で初期化される
      expect(screen.getByDisplayValue(anotherPost.content)).toBeInTheDocument();
    });

    it('編集モードから新規作成モードに切り替わった時にフォームがリセットされる', () => {
      const { rerender } = render(
        <TestWrapper>
          <PostForm editingPost={mockEditingPost} />
        </TestWrapper>
      );

      // 編集モードで内容を確認
      expect(screen.getByDisplayValue(mockEditingPost.content)).toBeInTheDocument();
      expect(screen.getByText('投稿を編集')).toBeInTheDocument();

      // 新規作成モードに切り替え
      rerender(
        <TestWrapper>
          <PostForm />
        </TestWrapper>
      );

      // フォームがリセットされ、新規作成モードになる
      expect(screen.getByText('新規投稿')).toBeInTheDocument();
      const textarea = screen.getByPlaceholderText(/ここにメモや感情を記録してください/);
      expect(textarea).toHaveValue('');
    });
  });
});