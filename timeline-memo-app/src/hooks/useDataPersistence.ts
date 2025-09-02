import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { IndexedDBService } from '../services/IndexedDBService';
import { performDataIntegrityCheck, checkDatabaseHealth, checkStorageQuota } from '../utils/dataIntegrityUtils';

// データ永続化とオフライン対応のカスタムフック
export function useDataPersistence() {
  const { state, dispatch } = useAppContext();
  const dataService = new IndexedDBService();

  /**
   * アプリ起動時のデータ復元
   */
  const loadInitialData = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: true, operation: 'データを読み込んでいます...' } });
      dispatch({ type: 'SET_ERROR', payload: null });

      // IndexedDBサービスの初期化
      await dataService.init();

      // 保存されている投稿データを取得
      const rawPosts = await dataService.getAllPosts();
      
      // データ整合性チェックを実行
      const integrityResult = performDataIntegrityCheck(rawPosts);
      
      if (!integrityResult.isValid) {
        console.warn('[データ復元] データ整合性の問題が検出され、修正されました:', integrityResult.issues);
      }
      
      dispatch({ type: 'LOAD_POSTS', payload: integrityResult.validPosts });
      
      // ストレージ使用量をチェック
      const storageInfo = await checkStorageQuota();
      if (storageInfo.isNearLimit) {
        console.warn('[データ復元] ストレージ使用量が上限に近づいています');
      }
      
      console.log(`[データ復元] ${integrityResult.validPosts.length}件の投稿を復元しました`);
    } catch (error) {
      console.error('[データ復元エラー]', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'データの復元中にエラーが発生しました。ページを再読み込みしてください。' 
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
    }
  }, [dispatch]);

  /**
   * データ整合性の確認
   */
  const verifyDataIntegrity = useCallback(async () => {
    try {
      // データベースの統計情報を取得
      const stats = await dataService.getStats();
      console.log('[データ整合性確認]', stats);

      // データベースの健全性チェック
      const healthCheck = checkDatabaseHealth(stats);
      if (!healthCheck.isHealthy) {
        console.warn('[データベース健全性] 問題が検出されました:', healthCheck.warnings);
      }

      // 現在のstate内の投稿数とデータベース内の投稿数を比較
      if (state.posts.length !== stats.totalPosts) {
        console.warn('[データ整合性警告] state内の投稿数とDB内の投稿数が一致しません', {
          stateCount: state.posts.length,
          dbCount: stats.totalPosts
        });
        
        // データを再読み込みして整合性を保つ
        await loadInitialData();
        return true;
      }

      // 現在のstate内のデータ整合性もチェック
      const stateIntegrityResult = performDataIntegrityCheck(state.posts);
      if (!stateIntegrityResult.isValid) {
        console.warn('[State整合性] 問題が検出されました:', stateIntegrityResult.issues);
        dispatch({ type: 'LOAD_POSTS', payload: stateIntegrityResult.validPosts });
      }

      return true;
    } catch (error) {
      console.error('[データ整合性確認エラー]', error);
      return false;
    }
  }, [state.posts, loadInitialData, dispatch]);

  /**
   * エラー時のデータ復旧
   */
  const recoverFromError = useCallback(async () => {
    try {
      console.log('[データ復旧] エラーからの復旧を開始します');
      
      // データベース接続の状態を確認
      const status = dataService.getStatus();
      console.log('[データ復旧] データベース状態:', status);

      if (!status.isInitialized || !status.isConnected) {
        // データベースを再初期化
        await dataService.init();
      }

      // データを再読み込み
      await loadInitialData();
      
      console.log('[データ復旧] 復旧が完了しました');
      return true;
    } catch (error) {
      console.error('[データ復旧エラー]', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'データの復旧に失敗しました。ブラウザのキャッシュをクリアして再度お試しください。' 
      });
      return false;
    }
  }, [loadInitialData, dispatch]);

  /**
   * オフライン状態の検出と対応
   */
  const handleOfflineStatus = useCallback(() => {
    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        console.log('[オフライン対応] オンライン状態に復帰しました');
        // オンライン復帰時にデータ整合性を確認
        verifyDataIntegrity();
      } else {
        console.log('[オフライン対応] オフライン状態になりました');
        // オフライン状態でも継続して動作することをユーザーに通知
        // （実際の通知はUIコンポーネントで実装）
      }
    };

    // オンライン/オフライン状態の変化を監視
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // 初期状態をログ出力
    console.log('[オフライン対応] 初期接続状態:', navigator.onLine ? 'オンライン' : 'オフライン');

    // クリーンアップ関数を返す
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, [verifyDataIntegrity]);

  /**
   * ページの可視性変化時の処理（ブラウザタブの切り替えなど）
   */
  const handleVisibilityChange = useCallback(() => {
    const handleVisibilityChangeEvent = () => {
      if (!document.hidden) {
        // ページが再び表示された時にデータ整合性を確認
        console.log('[可視性変化] ページが表示されました - データ整合性を確認します');
        verifyDataIntegrity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChangeEvent);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChangeEvent);
    };
  }, [verifyDataIntegrity]);

  /**
   * ブラウザの beforeunload イベント処理
   */
  const handleBeforeUnload = useCallback(() => {
    const handleBeforeUnloadEvent = () => {
      // ブラウザ終了前にデータベース接続を適切に閉じる
      dataService.close();
    };

    window.addEventListener('beforeunload', handleBeforeUnloadEvent);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnloadEvent);
    };
  }, []);

  return {
    loadInitialData,
    verifyDataIntegrity,
    recoverFromError,
    handleOfflineStatus,
    handleVisibilityChange,
    handleBeforeUnload
  };
}