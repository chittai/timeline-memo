/**
 * IndexedDBServiceのデモ用ファイル
 * ブラウザのコンソールで実行して動作確認ができます
 */

import { IndexedDBService } from './IndexedDBService';

export async function demoIndexedDBService() {
  console.log('=== IndexedDBService デモ開始 ===');
  
  const service = new IndexedDBService();
  
  try {
    // 1. 投稿作成
    console.log('1. 投稿を作成中...');
    const post1 = await service.createPost('これは最初のテスト投稿です。\n\n**Markdown**も使えます！');
    console.log('作成された投稿:', post1);
    
    // 少し待つ
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const post2 = await service.createPost('2番目の投稿です。\n\n- リスト項目1\n- リスト項目2');
    console.log('作成された投稿:', post2);
    
    // 2. 全投稿取得
    console.log('\n2. 全投稿を取得中...');
    const allPosts = await service.getAllPosts();
    console.log(`取得された投稿数: ${allPosts.length}`);
    allPosts.forEach((post, index) => {
      console.log(`投稿 ${index + 1}:`, {
        id: post.id,
        content: post.content.substring(0, 50) + '...',
        createdAt: post.createdAt
      });
    });
    
    // 3. 特定の投稿取得
    console.log('\n3. 特定の投稿を取得中...');
    const retrievedPost = await service.getPost(post1.id);
    console.log('取得された投稿:', retrievedPost);
    
    // 4. 投稿更新
    console.log('\n4. 投稿を更新中...');
    const updatedPost = await service.updatePost(post1.id, '更新されたコンテンツです！\n\n`コードブロック`も使えます。');
    console.log('更新された投稿:', updatedPost);
    
    // 5. 日付範囲での取得
    console.log('\n5. 日付範囲で投稿を取得中...');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const postsInRange = await service.getPostsByDateRange(oneHourAgo, oneHourLater);
    console.log(`日付範囲内の投稿数: ${postsInRange.length}`);
    
    // 6. 統計情報取得
    console.log('\n6. 統計情報を取得中...');
    const stats = await service.getStats();
    console.log('統計情報:', stats);
    
    // 7. 投稿削除
    console.log('\n7. 投稿を削除中...');
    await service.deletePost(post2.id);
    console.log(`投稿 ${post2.id} を削除しました`);
    
    // 削除確認
    const deletedPost = await service.getPost(post2.id);
    console.log('削除確認 (nullが期待される):', deletedPost);
    
    // 最終的な投稿数確認
    const finalPosts = await service.getAllPosts();
    console.log(`\n最終的な投稿数: ${finalPosts.length}`);
    
    console.log('\n=== IndexedDBService デモ完了 ===');
    
    // クリーンアップ
    await service.deletePost(post1.id);
    console.log('デモ用投稿をクリーンアップしました');
    
  } catch (error) {
    console.error('デモ実行中にエラーが発生しました:', error);
  } finally {
    await service.close();
    console.log('データベース接続を閉じました');
  }
}

// ブラウザ環境でのみ実行可能
if (typeof window !== 'undefined') {
  // グローバルに関数を公開
  (window as any).demoIndexedDBService = demoIndexedDBService;
  console.log('ブラウザコンソールで demoIndexedDBService() を実行してデモを開始できます');
} else {
  console.log('このデモはブラウザ環境でのみ実行できます');
}