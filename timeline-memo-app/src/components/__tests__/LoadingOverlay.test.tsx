import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoadingOverlay } from '../LoadingOverlay';
import type { LoadingState } from '../../types';

// LoadingSpinnerをモック
jest.mock('../LoadingSpinner', () => ({
  LoadingSpinner: ({ size, message, progress }: any) => (
    <div data-testid="loading-spinner">
      <div data-testid="spinner-size">{size}</div>
      <div data-testid="spinner-message">{message}</div>
      {progress !== undefined && <div data-testid="spinner-progress">{progress}</div>}
    </div>
  )
}));

describe('LoadingOverlay', () => {
  it('ローディング中でない場合は何も表示されない', () => {
    const loading: LoadingState = {
      isLoading: false
    };

    const { container } = render(<LoadingOverlay loading={loading} />);
    expect(container.firstChild).toBeNull();
  });

  it('ローディング中の場合はオーバーレイが表示される', () => {
    const loading: LoadingState = {
      isLoading: true
    };

    render(<LoadingOverlay loading={loading} />);
    
    const overlay = screen.getByRole('generic');
    expect(overlay).toHaveClass(
      'absolute',
      'inset-0',
      'bg-white',
      'bg-opacity-75',
      'flex',
      'items-center',
      'justify-center',
      'z-40'
    );
  });

  it('デフォルトメッセージでLoadingSpinnerが表示される', () => {
    const loading: LoadingState = {
      isLoading: true
    };

    render(<LoadingOverlay loading={loading} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('spinner-size')).toHaveTextContent('lg');
    expect(screen.getByTestId('spinner-message')).toHaveTextContent('読み込み中...');
  });

  it('カスタム操作メッセージが表示される', () => {
    const loading: LoadingState = {
      isLoading: true,
      operation: '投稿を保存しています...'
    };

    render(<LoadingOverlay loading={loading} />);
    
    expect(screen.getByTestId('spinner-message')).toHaveTextContent('投稿を保存しています...');
  });

  it('プログレス情報が渡される', () => {
    const loading: LoadingState = {
      isLoading: true,
      operation: 'アップロード中...',
      progress: 75
    };

    render(<LoadingOverlay loading={loading} />);
    
    expect(screen.getByTestId('spinner-progress')).toHaveTextContent('75');
  });

  it('カスタムクラス名が適用される', () => {
    const loading: LoadingState = {
      isLoading: true
    };

    render(<LoadingOverlay loading={loading} className="custom-class" />);
    
    const overlay = screen.getByRole('generic');
    expect(overlay).toHaveClass('custom-class');
  });

  it('オーバーレイの構造が正しい', () => {
    const loading: LoadingState = {
      isLoading: true,
      operation: 'テスト処理中...'
    };

    render(<LoadingOverlay loading={loading} />);
    
    // オーバーレイの背景
    const overlay = screen.getByRole('generic');
    expect(overlay).toHaveClass('absolute', 'inset-0', 'bg-white', 'bg-opacity-75');
    
    // 内部のコンテナ
    const container = overlay.querySelector('.bg-white.rounded-lg.shadow-lg.p-6');
    expect(container).toBeInTheDocument();
    
    // LoadingSpinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('複数の状態変更で正しく動作する', () => {
    const { rerender } = render(
      <LoadingOverlay loading={{ isLoading: false }} />
    );

    // 最初は表示されない
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();

    // ローディング開始
    rerender(
      <LoadingOverlay loading={{ isLoading: true, operation: '処理中...' }} />
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('spinner-message')).toHaveTextContent('処理中...');

    // ローディング終了
    rerender(
      <LoadingOverlay loading={{ isLoading: false }} />
    );

    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });

  it('空文字列の操作メッセージでデフォルトメッセージが表示される', () => {
    const loading: LoadingState = {
      isLoading: true,
      operation: ''
    };

    render(<LoadingOverlay loading={loading} />);
    
    expect(screen.getByTestId('spinner-message')).toHaveTextContent('読み込み中...');
  });

  it('undefinedの操作メッセージでデフォルトメッセージが表示される', () => {
    const loading: LoadingState = {
      isLoading: true,
      operation: undefined
    };

    render(<LoadingOverlay loading={loading} />);
    
    expect(screen.getByTestId('spinner-message')).toHaveTextContent('読み込み中...');
  });
});