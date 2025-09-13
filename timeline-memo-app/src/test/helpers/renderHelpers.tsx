import React, { type ReactElement } from 'react';
import { render, type RenderOptions, screen, waitFor } from '@testing-library/react';
import { expect } from 'vitest';
import { AppProvider } from '../../context/AppContext';

/**
 * AppContextでラップしたカスタムレンダー関数
 * テスト用のプロバイダーでコンポーネントをラップしてレンダリングする
 */
export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};

/**
 * 要素が実際に表示されるまで待機する関数
 * visibility: visible かつ display: block/inline などの表示状態を確認
 */
export const waitForElementToBeVisible = async (
  element: HTMLElement,
  timeout = 5000
): Promise<void> => {
  await waitFor(
    () => {
      const styles = window.getComputedStyle(element);
      const isVisible = 
        styles.visibility !== 'hidden' &&
        styles.display !== 'none' &&
        styles.opacity !== '0';
      
      if (!isVisible) {
        throw new Error(
          `要素が表示されていません。現在のスタイル: visibility=${styles.visibility}, display=${styles.display}, opacity=${styles.opacity}`
        );
      }
    },
    { timeout }
  );
};

/**
 * 要素の存在を確認し、詳細なエラーメッセージを提供する関数
 */
export const assertElementExists = (
  container: HTMLElement,
  selector: string,
  errorMessage?: string
): HTMLElement => {
  const element = container.querySelector(selector);
  
  if (!element) {
    const availableElements = Array.from(container.querySelectorAll('*'))
      .map(el => el.tagName.toLowerCase() + (el.className ? `.${el.className.split(' ').join('.')}` : ''))
      .slice(0, 10); // 最初の10個の要素のみ表示
    
    throw new Error(
      errorMessage || 
      `要素が見つかりません: ${selector}\n` +
      `利用可能な要素（最初の10個）: ${availableElements.join(', ')}\n` +
      `DOM構造: ${container.innerHTML.slice(0, 500)}...`
    );
  }
  
  return element as HTMLElement;
};

/**
 * テキストコンテンツで要素を検索し、表示状態も確認する関数
 */
export const findByTextAndAssertVisible = async (
  text: string | RegExp,
  options?: { timeout?: number; exact?: boolean }
): Promise<HTMLElement> => {
  const element = await screen.findByText(text, {
    exact: options?.exact
  });
  
  await waitForElementToBeVisible(element, options?.timeout);
  return element;
};

/**
 * 複数の要素が表示されていることを確認する関数
 */
export const assertMultipleElementsVisible = async (
  selectors: string[],
  container?: HTMLElement
): Promise<HTMLElement[]> => {
  const elements: HTMLElement[] = [];
  const targetContainer = container || document.body;
  
  for (const selector of selectors) {
    const element = assertElementExists(targetContainer, selector);
    await waitForElementToBeVisible(element);
    elements.push(element);
  }
  
  return elements;
};

/**
 * 要素が存在しないことを確認する関数
 */
export const assertElementNotExists = (
  container: HTMLElement,
  selector: string,
  errorMessage?: string
): void => {
  const element = container.querySelector(selector);
  
  if (element) {
    throw new Error(
      errorMessage || 
      `要素が存在すべきではありませんが見つかりました: ${selector}`
    );
  }
};

/**
 * ローディング状態の表示を確認する関数
 */
export const assertLoadingState = async (
  isLoading: boolean
): Promise<void> => {
  if (isLoading) {
    const loadingElement = await screen.findByTestId('loading');
    await waitForElementToBeVisible(loadingElement);
  } else {
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  }
};

/**
 * エラー状態の表示を確認する関数
 */
export const assertErrorState = async (
  errorMessage?: string
): Promise<void> => {
  const errorElement = await screen.findByTestId('error');
  await waitForElementToBeVisible(errorElement);
  
  if (errorMessage) {
    expect(errorElement).toHaveTextContent(errorMessage);
  }
};

/**
 * 空状態の表示を確認する関数
 */
export const assertEmptyState = async (
  emptyMessage?: string
): Promise<void> => {
  const emptyElement = await screen.findByTestId('empty-state');
  await waitForElementToBeVisible(emptyElement);
  
  if (emptyMessage) {
    expect(emptyElement).toHaveTextContent(emptyMessage);
  }
};

/**
 * フォーム要素の表示と状態を確認する関数
 */
export const assertFormElementState = (
  element: HTMLElement,
  expectedState: {
    isVisible?: boolean;
    isDisabled?: boolean;
    hasValue?: string;
    hasPlaceholder?: string;
  }
): void => {
  if (expectedState.isVisible !== undefined) {
    if (expectedState.isVisible) {
      expect(element).toBeVisible();
    } else {
      expect(element).not.toBeVisible();
    }
  }
  
  if (expectedState.isDisabled !== undefined) {
    if (expectedState.isDisabled) {
      expect(element).toBeDisabled();
    } else {
      expect(element).toBeEnabled();
    }
  }
  
  if (expectedState.hasValue !== undefined) {
    expect(element).toHaveValue(expectedState.hasValue);
  }
  
  if (expectedState.hasPlaceholder !== undefined) {
    expect(element).toHaveAttribute('placeholder', expectedState.hasPlaceholder);
  }
};