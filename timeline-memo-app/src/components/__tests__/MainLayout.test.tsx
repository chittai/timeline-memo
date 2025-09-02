import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MainLayout from '../MainLayout';
import { AppProvider } from '../../context/AppContext';

/**
 * MainLayoutコンポーネントのテスト
 * 要件4.1, 6.1, 6.2, 6.3の実装確認
 */
describe('MainLayout', () => {
  test('ヘッダーが表示される', () => {
    render(
      <AppProvider>
        <MainLayout>
          <div>テストコンテンツ</div>
        </MainLayout>
      </AppProvider>
    );
    
    // ヘッダーのタイトルが表示されることを確認
    expect(screen.getByText('Timeline Memo')).toBeInTheDocument();
    expect(screen.getByText('気軽にメモや感情を記録できるタイムラインアプリ')).toBeInTheDocument();
  });

  test('デスクトップレイアウトで左右分割パネルが表示される', () => {
    render(
      <AppProvider>
        <MainLayout>
          <div>テストコンテンツ</div>
        </MainLayout>
      </AppProvider>
    );
    
    // タイムラインパネルとリストパネルのタイトルが表示されることを確認
    expect(screen.getAllByText('タイムライン')).toHaveLength(2); // デスクトップとモバイル両方
    expect(screen.getAllByText('投稿リスト')).toHaveLength(2); // デスクトップとモバイル両方
  });

  test('プレースホルダーテキストが表示される', () => {
    render(
      <AppProvider>
        <MainLayout>
          <div>テストコンテンツ</div>
        </MainLayout>
      </AppProvider>
    );
    
    // プレースホルダーテキストが表示されることを確認
    expect(screen.getAllByText('時間軸パネル（実装予定）')).toHaveLength(2);
    expect(screen.getAllByText('投稿リストパネル（実装予定）')).toHaveLength(2);
  });

  test('子コンポーネントが正しくレンダリングされる', () => {
    render(
      <AppProvider>
        <MainLayout>
          <div data-testid="child-component">テストコンテンツ</div>
        </MainLayout>
      </AppProvider>
    );
    
    // 子コンポーネントが表示されることを確認
    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    expect(screen.getByText('テストコンテンツ')).toBeInTheDocument();
  });

  test('レスポンシブクラスが適用されている', () => {
    const { container } = render(
      <AppProvider>
        <MainLayout>
          <div>テストコンテンツ</div>
        </MainLayout>
      </AppProvider>
    );
    
    // デスクトップレイアウトのクラスが存在することを確認
    const desktopLayout = container.querySelector('.hidden.md\\:flex');
    expect(desktopLayout).toBeInTheDocument();
    
    // モバイルレイアウトのクラスが存在することを確認
    const mobileLayout = container.querySelector('.md\\:hidden');
    expect(mobileLayout).toBeInTheDocument();
  });
});