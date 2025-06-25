# 営業リスト作成ツール - テスト仕様書

## 📋 概要

本プロジェクトはTDD（Test-Driven Development）手法に従って開発されており、包括的なテスト戦略を採用しています。

## 🎯 TDD実装フェーズ

### Phase 1-6: 完了済み ✅
- Phase 1: プロジェクト設計・要件定義
- Phase 2: データベース設計・モデル定義
- Phase 3: コアロジック実装（Red-Green-Refactor）
- Phase 4: FastAPI バックエンド実装
- Phase 5: React フロントエンド基盤
- Phase 6: UI実装（全ページ完成）

### Phase 7: 統合テスト実装 🚀
**現在のフェーズ - TDD手法で包括的な統合テストを実装**

## 🧪 テスト構成

### 1. ユニットテスト
- **場所**: `backend/tests/test_*.py`, `frontend/src/**/*.test.tsx`
- **対象**: 個別関数・コンポーネントの単体テスト
- **ツール**: pytest (Backend), Vitest (Frontend)

### 2. 統合テスト
- **場所**: `backend/tests/test_integration_*.py`, `frontend/src/__tests__/integration/`
- **対象**: モジュール間連携、API統合、ユーザーワークフロー
- **ツール**: pytest + httpx (Backend), React Testing Library (Frontend)

### 3. エンドツーエンドテスト
- **場所**: `frontend/src/__tests__/e2e/`
- **対象**: ブラウザベースの実際のユーザー操作
- **ツール**: Playwright

### 4. パフォーマンステスト
- **場所**: `backend/tests/test_performance_*.py`
- **対象**: スクレイピング性能、大量データ処理、並行処理
- **ツール**: pytest + psutil

## 🚀 テスト実行方法

### クイックスタート
```bash
# 全テスト実行
./run_tests.sh

# 個別実行
./run_tests.sh backend    # バックエンドのみ
./run_tests.sh frontend   # フロントエンドのみ
./run_tests.sh e2e        # E2Eテストのみ
```

### 詳細コマンド

#### バックエンドテスト
```bash
cd backend

# ユニットテスト
poetry run pytest tests/test_*.py -v --cov=app

# 統合テスト
poetry run pytest tests/test_integration_*.py -v

# パフォーマンステスト
poetry run pytest tests/test_performance_*.py -v

# 特定テストクラス
poetry run pytest tests/test_integration_api.py::TestCompaniesIntegration -v

# カバレッジレポート生成
poetry run pytest --cov=app --cov-report=html
```

#### フロントエンドテスト
```bash
cd frontend

# 全テスト実行
npm run test

# カバレッジ付き実行
npm run test:coverage

# 統合テスト
npm run test:integration

# 監視モード
npm run test:watch

# 特定ファイル
npm run test CompaniesList.test.tsx
```

#### E2Eテスト
```bash
cd frontend

# ブラウザインストール
npx playwright install

# E2Eテスト実行
npm run test:e2e

# ヘッドフルモード（ブラウザ表示）
npx playwright test --headed

# 特定ブラウザのみ
npx playwright test --project=chromium

# デバッグモード
npx playwright test --debug
```

## 📊 テストカバレッジ目標

- **Backend**: 80%以上
- **Frontend**: 80%以上
- **統合テスト**: 主要ワークフロー100%カバー
- **E2Eテスト**: クリティカルパス100%カバー

## 🔍 テストレポート

テスト実行後、以下の場所にレポートが生成されます：

```
reports/
├── backend-coverage/          # バックエンドカバレッジ
│   └── index.html
├── frontend-coverage/         # フロントエンドカバレッジ
│   └── index.html
├── playwright-report/         # E2Eテストレポート
│   └── index.html
└── e2e-results/              # E2Eテスト詳細結果
```

## 🧪 テストシナリオ詳細

### 統合テストシナリオ

#### 1. 完全な営業活動ワークフロー
```
データ収集 → 企業管理 → 営業管理 → エクスポート
```
- スクレイピング設定・実行
- 企業データ確認・編集
- 営業ステータス更新（未着手→アプローチ中→商談中→成約）
- CSV/Excelエクスポート

#### 2. 企業CRUD操作ワークフロー
- 企業新規登録
- 一覧表示・検索・フィルタリング
- 詳細表示・編集
- 削除機能

#### 3. エラーハンドリングシナリオ
- ネットワークエラー
- APIエラー（400, 401, 404, 500など）
- バリデーションエラー
- 同時操作・競合状態

### パフォーマンステストシナリオ

#### 1. スクレイピング性能
- 並行処理性能
- 大量データ処理（1000件）
- メモリリーク検出
- レート制限対応

#### 2. データベース性能
- 大量データ挿入
- 複雑クエリ性能
- ページネーション性能

#### 3. フロントエンド性能
- 大量データ表示
- 仮想スクロール
- リアルタイム更新

## 🐛 テストデバッグ

### Backend
```bash
# デバッグモード
poetry run pytest tests/test_integration_api.py -v -s --pdb

# ログ出力
poetry run pytest tests/ -v --log-cli-level=DEBUG

# 特定テストのみ
poetry run pytest tests/test_integration_api.py::TestCompaniesIntegration::test_complete_company_crud_workflow -v -s
```

### Frontend
```bash
# デバッグモード
npm run test -- --reporter=verbose

# 特定テスト
npm run test -- UserWorkflows.test.tsx

# UIモード
npm run test:ui
```

### E2E
```bash
# デバッグモード
npx playwright test --debug

# ステップ実行
npx playwright test --headed --slowMo=1000

# スクリーンショット・動画
npx playwright test --screenshot=only-on-failure --video=retain-on-failure
```

## 🔧 CI/CD統合

GitHub Actionsワークフローが設定済み（`.github/workflows/ci.yml`）：

### 自動実行トリガー
- Push to master/develop
- Pull Request
- 夜間実行（毎日午前2時UTC）

### 実行内容
1. Backend Tests（pytest）
2. Frontend Tests（vitest）
3. E2E Tests（playwright）
4. Security Scan（Trivy）
5. Code Quality（SonarQube）
6. Deploy（master branch only）

## 📋 テスト環境

### 必要な環境
- Python 3.11+
- Node.js 18+
- Poetry 1.7+
- PostgreSQL 15（本番・ステージング）
- SQLite（テスト）

### 環境変数
```bash
# テスト実行時
export TESTING=true
export DATABASE_URL="sqlite:///./test.db"
export VITE_API_BASE_URL="http://localhost:8000"
```

## 🚨 テスト失敗時の対応

### 1. Backend テスト失敗
```bash
# 詳細ログ確認
poetry run pytest tests/ -v --tb=long

# データベースリセット
rm -f test.db
poetry run pytest tests/ --create-db

# 依存関係更新
poetry update
```

### 2. Frontend テスト失敗
```bash
# キャッシュクリア
npm run test -- --clearCache

# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install

# モック確認
npm run test -- --verbose
```

### 3. E2E テスト失敗
```bash
# ブラウザ再インストール
npx playwright install --force

# ヘッドフルモードで確認
npx playwright test --headed

# スクリーンショット確認
open test-results/
```

## 📈 継続的改善

### テスト品質向上のために
1. **カバレッジ監視**: 80%以上を維持
2. **テスト速度**: 全テスト5分以内
3. **フレーキーテスト**: 定期的な検出・修正
4. **テストデータ**: 本番に近いリアルなデータ使用

### 今後の拡張予定
- Visual Regression Testing
- API Contract Testing
- Load Testing
- Accessibility Testing

## 💡 Tips

### 効率的なテスト実行
```bash
# 変更されたファイルのみ
git diff --name-only | grep -E '\.(py|tsx?)$' | xargs pytest/npm test

# 並列実行
poetry run pytest -n auto
npm run test -- --parallel

# キーワードフィルタ
poetry run pytest -k "test_company"
npm run test -- --grep="company"
```

### テストデータ管理
- フィクスチャの活用
- ファクトリーパターン
- データベースマイグレーション
- モックサービス

---

**🎉 Phase 7 統合テスト実装完了！**

TDD手法に従って包括的な統合テストスイートが実装されました。これにより、営業リスト作成ツールの品質と信頼性が大幅に向上しています。