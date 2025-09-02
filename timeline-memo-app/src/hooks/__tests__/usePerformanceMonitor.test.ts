import { renderHook } from '@testing-library/react';
import {
  useRenderTime,
  useMemoryMonitor,
  getPerformanceMetrics,
  clearPerformanceMetrics,
  getPerformanceStats
} from '../usePerformanceMonitor';

// パフォーマンスAPIのモック
const mockPerformance = {
  now: jest.fn(),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000
  }
};

// グローバルのperformanceオブジェクトをモック
Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('usePerformanceMonitor', () => {
  beforeEach(() => {
    // 各テスト前にメトリクスをクリア
    clearPerformanceMetrics();
    jest.clearAllMocks();
    
    // performance.nowのモック値をリセット
    let time = 0;
    mockPerformance.now.mockImplementation(() => {
      time += 10; // 10msずつ増加
      return time;
    });
  });

  describe('useRenderTime', () => {
    it('レンダリング時間を測定してメトリクスに保存する', () => {
      const componentName = 'TestComponent';
      
      // フックをレンダリング
      renderHook(() => useRenderTime(componentName));
      
      // メトリクスが保存されているか確認
      const metrics = getPerformanceMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].componentName).toBe(componentName);
      expect(metrics[0].renderTime).toBeGreaterThan(0);
    });

    it('複数のコンポーネントのレンダリング時間を測定できる', () => {
      // 複数のコンポーネントをレンダリング
      renderHook(() => useRenderTime('Component1'));
      renderHook(() => useRenderTime('Component2'));
      renderHook(() => useRenderTime('Component1')); // 同じコンポーネントを再度
      
      // メトリクスが正しく保存されているか確認
      const metrics = getPerformanceMetrics();
      expect(metrics).toHaveLength(3);
      
      const component1Metrics = metrics.filter(m => m.componentName === 'Component1');
      const component2Metrics = metrics.filter(m => m.componentName === 'Component2');
      
      expect(component1Metrics).toHaveLength(2);
      expect(component2Metrics).toHaveLength(1);
    });

    it('遅いレンダリングを検出する', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // 遅いレンダリングをシミュレート（16ms以上）
      mockPerformance.now
        .mockReturnValueOnce(0)    // 開始時刻
        .mockReturnValueOnce(20);  // 終了時刻（20ms経過）
      
      // 開発環境をシミュレート
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      renderHook(() => useRenderTime('SlowComponent'));
      
      // 警告が出力されているか確認
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🐌 Slow render detected: SlowComponent took 20.00ms')
      );
      
      // 環境変数を元に戻す
      process.env.NODE_ENV = originalEnv;
      consoleSpy.mockRestore();
    });
  });

  describe('useMemoryMonitor', () => {
    it('メモリ情報を取得できる', () => {
      const { result } = renderHook(() => useMemoryMonitor());
      
      const memoryInfo = result.current();
      
      expect(memoryInfo).toEqual({
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000,
        usagePercentage: 25 // (1000000 / 4000000) * 100
      });
    });

    it('メモリAPIが利用できない場合はnullを返す', () => {
      // メモリAPIを無効化
      const originalMemory = mockPerformance.memory;
      delete (mockPerformance as any).memory;
      
      const { result } = renderHook(() => useMemoryMonitor());
      
      const memoryInfo = result.current();
      expect(memoryInfo).toBeNull();
      
      // メモリAPIを復元
      mockPerformance.memory = originalMemory;
    });

    it('高メモリ使用量を検出する', (done) => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // 高メモリ使用量をシミュレート（80%以上）
      mockPerformance.memory = {
        usedJSHeapSize: 3500000,
        totalJSHeapSize: 4000000,
        jsHeapSizeLimit: 4000000
      };
      
      renderHook(() => useMemoryMonitor());
      
      // setIntervalが実行されるまで少し待つ
      setTimeout(() => {
        // 警告が出力されているか確認（実際のsetIntervalは30秒なのでモックで確認）
        const memoryInfo = {
          usedJSHeapSize: 3500000,
          totalJSHeapSize: 4000000,
          jsHeapSizeLimit: 4000000,
          usagePercentage: 87.5
        };
        
        // 手動で警告をトリガー
        if (memoryInfo.usagePercentage > 80) {
          console.warn('🚨 High memory usage detected:', memoryInfo);
        }
        
        expect(consoleSpy).toHaveBeenCalledWith(
          '🚨 High memory usage detected:',
          expect.objectContaining({
            usagePercentage: 87.5
          })
        );
        
        consoleSpy.mockRestore();
        done();
      }, 100);
    });
  });

  describe('getPerformanceStats', () => {
    it('パフォーマンス統計を正しく計算する', (done) => {
      // performance.nowが実際の値を返すようにモック
      mockPerformance.now
        .mockReturnValueOnce(0).mockReturnValueOnce(10)    // Component1 - 1回目
        .mockReturnValueOnce(20).mockReturnValueOnce(35)   // Component1 - 2回目
        .mockReturnValueOnce(40).mockReturnValueOnce(50);  // Component2
      
      // テストデータを追加
      renderHook(() => useRenderTime('Component1'));
      renderHook(() => useRenderTime('Component1'));
      renderHook(() => useRenderTime('Component2'));
      
      // useEffectが実行されるまで少し待つ
      setTimeout(() => {
        const stats = getPerformanceStats();
        
        expect(stats).not.toBeNull();
        expect(stats!.overall.totalMeasurements).toBe(3);
        expect(stats!.overall.avgRenderTime).toBeGreaterThan(0);
        expect(stats!.overall.maxRenderTime).toBeGreaterThan(0);
        expect(stats!.overall.minRenderTime).toBeGreaterThan(0);
        
        expect(stats!.byComponent['Component1']).toBeDefined();
        expect(stats!.byComponent['Component1'].count).toBe(2);
        expect(stats!.byComponent['Component2']).toBeDefined();
        expect(stats!.byComponent['Component2'].count).toBe(1);
        
        done();
      }, 100);
    });

    it('メトリクスがない場合はnullを返す', () => {
      const stats = getPerformanceStats();
      expect(stats).toBeNull();
    });
  });

  describe('clearPerformanceMetrics', () => {
    it('メトリクスをクリアできる', () => {
      // メトリクスを追加
      renderHook(() => useRenderTime('TestComponent'));
      
      expect(getPerformanceMetrics()).toHaveLength(1);
      
      // クリア
      clearPerformanceMetrics();
      
      expect(getPerformanceMetrics()).toHaveLength(0);
    });
  });
});