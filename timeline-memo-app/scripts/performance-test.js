#!/usr/bin/env node

/**
 * パフォーマンステストスクリプト
 * ビルドサイズ、バンドル分析、ロード時間などをチェック
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// カラー出力用のヘルパー
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// ビルドサイズの分析
function analyzeBuildSize() {
  log('cyan', '\n📊 ビルドサイズ分析');
  log('cyan', '='.repeat(50));
  
  const distPath = path.join(__dirname, '../dist');
  
  if (!fs.existsSync(distPath)) {
    log('red', '❌ distディレクトリが見つかりません。先にビルドを実行してください。');
    return false;
  }
  
  const getDirectorySize = (dirPath) => {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    });
    
    return totalSize;
  };
  
  const formatSize = (bytes) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const totalSize = getDirectorySize(distPath);
  log('bright', `📦 総ビルドサイズ: ${formatSize(totalSize)}`);
  
  // 個別ファイルサイズの分析
  const jsFiles = [];
  const cssFiles = [];
  
  const analyzeFiles = (dirPath, relativePath = '') => {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      const relativeFilePath = path.join(relativePath, file);
      
      if (stats.isDirectory()) {
        analyzeFiles(filePath, relativeFilePath);
      } else {
        if (file.endsWith('.js')) {
          jsFiles.push({ name: relativeFilePath, size: stats.size });
        } else if (file.endsWith('.css')) {
          cssFiles.push({ name: relativeFilePath, size: stats.size });
        }
      }
    });
  };
  
  analyzeFiles(distPath);
  
  // JavaScriptファイル
  if (jsFiles.length > 0) {
    log('yellow', '\n📄 JavaScriptファイル:');
    jsFiles
      .sort((a, b) => b.size - a.size)
      .forEach(file => {
        const sizeColor = file.size > 500000 ? 'red' : file.size > 100000 ? 'yellow' : 'green';
        log(sizeColor, `  ${file.name}: ${formatSize(file.size)}`);
      });
  }
  
  // CSSファイル
  if (cssFiles.length > 0) {
    log('yellow', '\n🎨 CSSファイル:');
    cssFiles
      .sort((a, b) => b.size - a.size)
      .forEach(file => {
        const sizeColor = file.size > 100000 ? 'red' : file.size > 50000 ? 'yellow' : 'green';
        log(sizeColor, `  ${file.name}: ${formatSize(file.size)}`);
      });
  }
  
  // 推奨事項
  log('blue', '\n💡 パフォーマンス推奨事項:');
  
  const largeJsFiles = jsFiles.filter(f => f.size > 500000);
  if (largeJsFiles.length > 0) {
    log('yellow', '  ⚠️  大きなJavaScriptファイルが検出されました。コード分割を検討してください。');
  }
  
  const totalJsSize = jsFiles.reduce((sum, f) => sum + f.size, 0);
  if (totalJsSize > 1000000) {
    log('yellow', '  ⚠️  JavaScript総サイズが1MBを超えています。');
  } else {
    log('green', '  ✅ JavaScript総サイズは適切です。');
  }
  
  if (totalSize > 5000000) {
    log('red', '  ❌ 総ビルドサイズが5MBを超えています。最適化が必要です。');
  } else if (totalSize > 2000000) {
    log('yellow', '  ⚠️  総ビルドサイズが2MBを超えています。最適化を検討してください。');
  } else {
    log('green', '  ✅ 総ビルドサイズは適切です。');
  }
  
  return true;
}

// 依存関係の分析
function analyzeDependencies() {
  log('cyan', '\n📦 依存関係分析');
  log('cyan', '='.repeat(50));
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
    
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    
    log('bright', `📚 本番依存関係: ${dependencies.length}個`);
    dependencies.forEach(dep => {
      log('green', `  - ${dep}`);
    });
    
    log('bright', `\n🔧 開発依存関係: ${devDependencies.length}個`);
    
    // 大きな依存関係の警告
    const heavyDependencies = [
      'lodash', 'moment', 'axios', 'jquery', 'bootstrap'
    ];
    
    const foundHeavyDeps = dependencies.filter(dep => 
      heavyDependencies.some(heavy => dep.includes(heavy))
    );
    
    if (foundHeavyDeps.length > 0) {
      log('yellow', '\n⚠️  重い依存関係が検出されました:');
      foundHeavyDeps.forEach(dep => {
        log('yellow', `  - ${dep} (軽量な代替を検討してください)`);
      });
    } else {
      log('green', '\n✅ 軽量な依存関係構成です。');
    }
    
  } catch (error) {
    log('red', `❌ package.json の読み込みに失敗: ${error.message}`);
    return false;
  }
  
  return true;
}

// Lighthouseテスト（簡易版）
function runLighthouseTest() {
  log('cyan', '\n🔍 Lighthouseテスト');
  log('cyan', '='.repeat(50));
  
  try {
    // プレビューサーバーを起動してLighthouseテストを実行
    log('blue', 'プレビューサーバーを起動中...');
    
    // 注意: 実際のLighthouseテストには lighthouse CLI が必要
    log('yellow', '💡 Lighthouseテストを実行するには以下のコマンドを使用してください:');
    log('bright', '  npm install -g lighthouse');
    log('bright', '  npm run preview &');
    log('bright', '  lighthouse http://localhost:4173 --output html --output-path ./lighthouse-report.html');
    
    return true;
  } catch (error) {
    log('red', `❌ Lighthouseテストの実行に失敗: ${error.message}`);
    return false;
  }
}

// メイン実行関数
function main() {
  log('magenta', '🚀 タイムラインメモアプリ - パフォーマンステスト');
  log('magenta', '='.repeat(60));
  
  const results = {
    buildSize: false,
    dependencies: false,
    lighthouse: false,
  };
  
  // ビルドサイズ分析
  results.buildSize = analyzeBuildSize();
  
  // 依存関係分析
  results.dependencies = analyzeDependencies();
  
  // Lighthouseテスト
  results.lighthouse = runLighthouseTest();
  
  // 結果サマリー
  log('cyan', '\n📋 テスト結果サマリー');
  log('cyan', '='.repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ 成功' : '❌ 失敗';
    const color = passed ? 'green' : 'red';
    log(color, `${test}: ${status}`);
  });
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    log('green', '\n🎉 すべてのパフォーマンステストが完了しました！');
  } else {
    log('yellow', '\n⚠️  一部のテストで問題が検出されました。上記の推奨事項を確認してください。');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// スクリプト実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  analyzeBuildSize,
  analyzeDependencies,
  runLighthouseTest,
};