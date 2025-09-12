import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { 
  renderWithProviders, 
  waitForElementToBeVisible, 
  assertElementExists,
  findByTextAndAssertVisible,
  assertLoadingState,
  assertErrorState,
  assertEmptyState
} from '../renderHelpers';

// テスト用のシンプルなコンポーネント
const TestComponent = ({ showLoading = false, showError = false, showEmpty = false }: {
  showLoading?: boolean;
  showError?: boolean;
  showEmpty?: boolean;
}) => (
  <div>
    <h1>テストコンポーネント</h1>
    {showLoading && <div data-testid="loading">読み込み中...</div>}
    {showError && <div data-testid="error">エラーが発生しました</div>}
    {showEmpty && <div data-testid="empty-state">データがありません</div>}
    <button>クリック</button>
  </div>
);

describe('renderHelpers', () => {
  describe('renderWithProviders', () => {
    it('AppProviderでラップしてコンポーネントをレンダリングできる', () => {
      renderWithProviders(<TestComponent />);
      
      expect(screen.getByText('テストコンポーネント')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'クリック' })).toBeInTheDocument();
    });
  });

  describe('waitForElementToBeVisible', () => {
    it('要素が表示されるまで待機する', async () => {
      render(<TestComponent />);
      
      const element = screen.getByText('テストコンポーネント');
      await waitForElementToBeVisible(element);
      
      expect(element).toBeVisible();
    });
  });

  describe('assertElementExists', () => {
    it('要素が存在することを確認する', () => {
      const { container } = render(<TestComponent />);
      
      const element = assertElementExists(container, 'h1');
      expect(element).toBeInTheDocument();
      expect(element.textContent).toBe('テストコンポーネント');
    });

    it('要素が存在しない場合はエラーを投げる', () => {
      const { container } = render(<TestComponent />);
      
      expect(() => {
        assertElementExists(container, '.non-existent');
      }).toThrow('要素が見つかりません');
    });
  });

  describe('findByTextAndAssertVisible', () => {
    it('テキストで要素を検索し表示状態を確認する', async () => {
      render(<TestComponent />);
      
      const element = await findByTextAndAssertVisible('テストコンポーネント');
      expect(element).toBeVisible();
    });
  });

  describe('assertLoadingState', () => {
    it('ローディング状態を確認する', async () => {
      render(<TestComponent showLoading={true} />);
      
      await assertLoadingState(true);
      expect(screen.getByTestId('loading')).toBeVisible();
    });

    it('ローディングが終了した状態を確認する', async () => {
      render(<TestComponent showLoading={false} />);
      
      await assertLoadingState(false);
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  describe('assertErrorState', () => {
    it('エラー状態を確認する', async () => {
      render(<TestComponent showError={true} />);
      
      await assertErrorState('エラーが発生しました');
      expect(screen.getByTestId('error')).toBeVisible();
    });
  });

  describe('assertEmptyState', () => {
    it('空状態を確認する', async () => {
      render(<TestComponent showEmpty={true} />);
      
      await assertEmptyState('データがありません');
      expect(screen.getByTestId('empty-state')).toBeVisible();
    });
  });
});