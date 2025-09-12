# テスト強化機能 設計書

## 概要

GitHubに定期的にPushする運用を実現するため、既存のVitestベースのテスト環境を拡張し、包括的なテスト体制を構築する。特に表示確認テストと機能テストを強化し、GitHub Actionsとの連携を改善する。

## アーキテクチャ

### テスト構成の全体像

```
timeline-memo-app/
├── src/
│   ├── __tests__/           # 統合テスト
│   ├── components/__tests__/ # コンポーネントテスト
│   ├── hooks/__tests__/     # フックテスト
│   ├── services/__tests__/  # サービステスト
│   ├── utils/__tests__/     # ユーティリティテスト
│   └── test/
│       ├── setup.ts         # テストセットアップ
│       ├── helpers/         # テストヘルパー関数
│       ├── fixtures/        # テストデータ
│       └── utils/           # テスト用ユーティリティ
├── tests/
│   ├── e2e/                # E2Eテスト（新規追加）
│   ├── visual/             # 表示確認テスト（新規追加）
│   └── integration/        # 統合テスト（新規追加）
└── coverage/               # カバレッジレポート
```

### テスト戦略

1. **ユニットテスト**: 個別の関数・コンポーネントの動作確認
2. **統合テスト**: 複数コンポーネント間の連携確認
3. **表示確認テスト**: DOM要素の存在と表示状態の確認
4. **機能テスト**: ユーザーシナリオベースの動作確認

## コンポーネントと実装詳細

### 1. テストヘルパー関数の実装

#### 1.1 表示確認ヘルパー

```typescript
// src/test/helpers/renderHelpers.ts
export const renderWithProviders = (component: ReactElement) => {
  // AppContextとテストデータでラップしたレンダリング
}

export const waitForElementToBeVisible = async (element: HTMLElement) => {
  // 要素が実際に表示されるまで待機
}

export const assertElementExists = (container: HTMLElement, selector: string) => {
  // 要素の存在を確認し、詳細なエラーメッセージを提供
}
```

#### 1.2 データ生成ヘルパー

```typescript
// src/test/fixtures/testData.ts
export const createMockPost = (overrides?: Partial<Post>) => Post
export const createMockDiaryEntry = (overrides?: Partial<DiaryEntry>) => DiaryEntry
export const createMockCalendarData = (date: Date) => CalendarData
```

### 2. 表示確認テストの実装

#### 2.1 コンポーネント表示テスト

各コンポーネントに対して以下のテストを実装：

- **存在確認**: 必要な要素がDOMに存在する
- **表示状態確認**: 要素が実際に表示されている（visibility, display）
- **空状態確認**: データが空の場合の適切な表示
- **エラー状態確認**: エラー時の適切な表示
- **ローディング状態確認**: ローディング中の適切な表示

#### 2.2 表示テストの実装例

```typescript
// tests/visual/ComponentVisibility.test.tsx
describe('コンポーネント表示確認', () => {
  test('PostListが投稿データを正しく表示する', async () => {
    const mockPosts = [createMockPost(), createMockPost()]
    render(<PostList posts={mockPosts} />)
    
    // 投稿リストが表示されることを確認
    expect(screen.getByTestId('post-list')).toBeVisible()
    
    // 各投稿が表示されることを確認
    mockPosts.forEach(post => {
      expect(screen.getByText(post.content)).toBeVisible()
    })
  })
  
  test('PostListが空状態を正しく表示する', () => {
    render(<PostList posts={[]} />)
    
    // 空状態メッセージが表示されることを確認
    expect(screen.getByText('投稿がありません')).toBeVisible()
    expect(screen.queryByTestId('post-list')).not.toBeInTheDocument()
  })
})
```

### 3. 機能テストの実装

#### 3.1 ユーザーシナリオテスト

```typescript
// tests/integration/UserScenarios.test.tsx
describe('ユーザーシナリオテスト', () => {
  test('日記投稿の完全なフロー', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    // 投稿フォームに入力
    await user.type(screen.getByLabelText('投稿内容'), 'テスト投稿')
    await user.click(screen.getByRole('button', { name: '投稿' }))
    
    // 投稿が表示されることを確認
    expect(await screen.findByText('テスト投稿')).toBeVisible()
    
    // 投稿の編集
    await user.click(screen.getByRole('button', { name: '編集' }))
    await user.clear(screen.getByDisplayValue('テスト投稿'))
    await user.type(screen.getByLabelText('投稿内容'), '編集済み投稿')
    await user.click(screen.getByRole('button', { name: '保存' }))
    
    // 編集結果が表示されることを確認
    expect(await screen.findByText('編集済み投稿')).toBeVisible()
  })
})
```

### 4. GitHub Actions統合

#### 4.1 テストワークフローの拡張

```yaml
# .github/workflows/test.yml（新規作成）
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: timeline-memo-app/package-lock.json
    
    - name: Install dependencies
      run: |
        cd timeline-memo-app
        npm ci
    
    - name: Run linting
      run: |
        cd timeline-memo-app
        npm run lint
    
    - name: Run tests with coverage
      run: |
        cd timeline-memo-app
        npm run test:coverage
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./timeline-memo-app/coverage/lcov.info
    
    - name: Comment PR with test results
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          // テスト結果をPRにコメント
```

#### 4.2 デプロイワークフローの更新

既存の`deploy.yml`にテスト実行を追加：

```yaml
- name: Run tests
  run: |
    cd timeline-memo-app
    npm run test:run
```

### 5. テスト設定の拡張

#### 5.1 Vitest設定の更新

```typescript
// vite.config.ts のtest設定を拡張
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html', 'lcov'],
    exclude: [
      'node_modules/',
      'src/test/',
      '**/*.d.ts',
      '**/*.config.*',
    ],
    thresholds: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  },
  testTimeout: 10000,
  hookTimeout: 10000,
}
```

#### 5.2 テストセットアップの拡張

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// 各テスト後のクリーンアップ
afterEach(() => {
  cleanup()
})

// LocalStorageのモック
beforeEach(() => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  vi.stubGlobal('localStorage', localStorageMock)
})

// console.errorの抑制（テスト中の不要なログを防ぐ）
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
```

## データモデル

### テストデータ構造

```typescript
// src/test/fixtures/types.ts
export interface TestScenario {
  name: string
  description: string
  setup: () => Promise<void>
  teardown: () => Promise<void>
  data: any
}

export interface VisibilityTestCase {
  component: string
  scenario: string
  expectedElements: string[]
  hiddenElements?: string[]
}
```

## エラーハンドリング

### テストエラーの詳細化

```typescript
// src/test/utils/testErrorUtils.ts
export const createDetailedError = (
  testName: string,
  expected: string,
  actual: string,
  context?: any
) => {
  return new Error(`
テスト失敗: ${testName}
期待値: ${expected}
実際の値: ${actual}
コンテキスト: ${JSON.stringify(context, null, 2)}
  `)
}
```

### テスト失敗時の診断情報

- DOM構造のスナップショット
- コンポーネントの状態
- エラーの詳細なスタックトレース
- 再現手順の自動生成

## テスト戦略

### 1. 段階的実装

1. **フェーズ1**: 表示確認テストの基盤構築
2. **フェーズ2**: 既存コンポーネントの表示テスト追加
3. **フェーズ3**: 機能テストの実装
4. **フェーズ4**: GitHub Actions統合
5. **フェーズ5**: カバレッジ向上とレポート改善

### 2. 優先順位

1. **高優先度**: 主要機能（投稿、表示、編集）
2. **中優先度**: UI状態管理（ローディング、エラー）
3. **低優先度**: 補助機能（統計、モチベーション）

### 3. 品質指標

- **テストカバレッジ**: 80%以上
- **テスト実行時間**: 30秒以内
- **テスト成功率**: 99%以上
- **CI/CD実行時間**: 5分以内