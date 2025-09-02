import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('デフォルトサイズでスピナーが表示される', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toHaveClass('w-6', 'h-6');
  });

  it('小さいサイズでスピナーが表示される', () => {
    render(<LoadingSpinner size="sm" />);
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  it('大きいサイズでスピナーが表示される', () => {
    render(<LoadingSpinner size="lg" />);
    
    const spinner = screen.getByRole('img', { hidden: true });
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  it('メッセージが表示される', () => {
    render(<LoadingSpinner message="読み込み中..." />);
    
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('メッセージがない場合は表示されない', () => {
    render(<LoadingSpinner />);
    
    expect(screen.queryByText(/読み込み/)).not.toBeInTheDocument();
  });

  it('プログレスバーが表示される', () => {
    render(<LoadingSpinner progress={50} />);
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('プログレス値が表示される', () => {
    render(<LoadingSpinner progress={75} />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('プログレス値が0未満の場合は0%になる', () => {
    render(<LoadingSpinner progress={-10} />);
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle({ width: '0%' });
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('プログレス値が100を超える場合は100%になる', () => {
    render(<LoadingSpinner progress={150} />);
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle({ width: '100%' });
    expect(screen.getByText('150%')).toBeInTheDocument(); // 表示は元の値
  });

  it('プログレスが指定されていない場合はプログレスバーが表示されない', () => {
    render(<LoadingSpinner />);
    
    expect(screen.queryByRole('progressbar', { hidden: true })).not.toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('メッセージとプログレスが同時に表示される', () => {
    render(<LoadingSpinner message="処理中..." progress={30} />);
    
    expect(screen.getByText('処理中...')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveStyle({ width: '30%' });
  });

  it('スピナーがアニメーションクラスを持つ', () => {
    render(<LoadingSpinner />);
    
    const spinnerContainer = screen.getByRole('img', { hidden: true }).parentElement;
    expect(spinnerContainer).toHaveClass('animate-spin');
  });

  it('プログレスバーがトランジションクラスを持つ', () => {
    render(<LoadingSpinner progress={40} />);
    
    const progressBar = screen.getByRole('progressbar', { hidden: true });
    expect(progressBar).toHaveClass('transition-all', 'duration-300');
  });
});