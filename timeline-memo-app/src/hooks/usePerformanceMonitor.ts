import { useEffect, useRef, useCallback } from 'react';

/**
 * パフォーマンス監視用のカスタムフック
 * レンダリング時間やメモリ使用量を監視
 */

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

// パフォーマンスメトリクスの保存
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS = 100; // 最大保存数

/**
 * コンポーネントのレンダリング時間を測定
 */
export function useRenderTime(componentName: string) {
  const startTimeRef = useRef<number>(0);
  
  // レンダリング開始時刻を記録
  startTimeRef.current = performance.now();
  
  useEffect(() => {
    // レンダリング完了時刻を記録
    const endTime = performance.now();
    const renderTime = endTime - startTimeRef.current;
    
    // メトリクスを保存
    const metric: PerformanceMetrics = {
      renderTime,
      componentName,
      timestamp: Date.now()
    };
    
    performanceMetrics.push(metric);
    
    // 配列サイズを制限
    if (performanceMetrics.length > MAX_METRICS) {
      performanceMetrics.shift();
    }
    
    // 開発環境でのみログ出力
    if (process.env.NODE_ENV === 'development' && renderTime > 16) {
      console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  });
}

/**
 * メモリ使用量を監視
 */
export function useMemoryMonitor() {
  const checkMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }, []);
  
  useEffect(() => {
    // 定期的にメモリ使用量をチェック
    const interval = setInterval(() => {
      const memoryInfo = checkMemory();
      if (memoryInfo && memoryInfo.usagePercentage > 80) {
        console.warn('🚨 High memory usage detected:', memoryInfo);
      }
    }, 30000); // 30秒ごと
    
    return () => clearInterval(interval);
  }, [checkMemory]);
  
  return checkMemory;
}

/**
 * FPS（フレームレート）を監視
 */
export function useFPSMonitor() {
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsRef = useRef(60);
  
  useEffect(() => {
    let animationId: number;
    
    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (currentTime - lastTimeRef.current));
        fpsRef.current = fps;
        
        // 低FPSの警告
        if (fps < 30) {
          console.warn(`🐌 Low FPS detected: ${fps} fps`);
        }
        
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);
  
  return () => fpsRef.current;
}

/**
 * パフォーマンスメトリクスを取得
 */
export function getPerformanceMetrics(): PerformanceMetrics[] {
  return [...performanceMetrics];
}

/**
 * パフォーマンスメトリクスをクリア
 */
export function clearPerformanceMetrics(): void {
  performanceMetrics.length = 0;
}

/**
 * パフォーマンス統計を取得
 */
export function getPerformanceStats() {
  if (performanceMetrics.length === 0) {
    return null;
  }
  
  const renderTimes = performanceMetrics.map(m => m.renderTime);
  const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
  const maxRenderTime = Math.max(...renderTimes);
  const minRenderTime = Math.min(...renderTimes);
  
  // コンポーネント別の統計
  const componentStats = performanceMetrics.reduce((acc, metric) => {
    if (!acc[metric.componentName]) {
      acc[metric.componentName] = {
        count: 0,
        totalTime: 0,
        maxTime: 0,
        minTime: Infinity
      };
    }
    
    const stats = acc[metric.componentName];
    stats.count++;
    stats.totalTime += metric.renderTime;
    stats.maxTime = Math.max(stats.maxTime, metric.renderTime);
    stats.minTime = Math.min(stats.minTime, metric.renderTime);
    
    return acc;
  }, {} as Record<string, { count: number; totalTime: number; maxTime: number; minTime: number }>);
  
  // 平均時間を計算
  Object.keys(componentStats).forEach(componentName => {
    const stats = componentStats[componentName];
    (stats as any).avgTime = stats.totalTime / stats.count;
  });
  
  return {
    overall: {
      totalMeasurements: performanceMetrics.length,
      avgRenderTime: Number(avgRenderTime.toFixed(2)),
      maxRenderTime: Number(maxRenderTime.toFixed(2)),
      minRenderTime: Number(minRenderTime.toFixed(2))
    },
    byComponent: componentStats
  };
}

/**
 * パフォーマンス監視の総合フック
 */
export function usePerformanceMonitor(componentName: string) {
  useRenderTime(componentName);
  const getMemoryInfo = useMemoryMonitor();
  const getFPS = useFPSMonitor();
  
  return {
    getMemoryInfo,
    getFPS,
    getStats: getPerformanceStats,
    clearStats: clearPerformanceMetrics
  };
}