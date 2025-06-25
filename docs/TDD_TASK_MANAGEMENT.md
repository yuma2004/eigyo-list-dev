# TDD（t-wada式）タスク管理

## 開発方針

1. **Red**: テストを先に書く（失敗する）
2. **Green**: テストを通す最小限の実装
3. **Refactor**: コードを整理・改善

## タスクリスト

### 🟢 Phase 1: Google Spreadsheet連携 (完了)
- [x] GoogleSheetsServiceのテスト作成
- [x] 初期化・認証機能の実装
- [x] 企業情報の追加機能
- [x] 重複チェック機能
- [x] 企業リスト取得機能
- [x] ステータス更新機能
- [x] エラーハンドリング

### 🟢 Phase 2: スクレイピングエンジン (完了)
- [x] ScrapingEngineのテスト作成
- [x] RateLimiterの実装
- [x] 企業情報抽出機能
- [x] 並列処理機能
- [x] タイムアウト処理
- [x] User-Agentローテーション
- [x] 設定ファイル読み込み

### 🟢 Phase 3: ビジネスロジック層 (完了)
- [x] Companyモデルのテスト作成
- [x] SalesStatusモデルのテスト作成
- [x] CompanyServiceのテスト作成
- [x] 各モデル・サービスの実装

### 🟢 Phase 4: FastAPI バックエンド (完了)
- [x] APIエンドポイントのテスト作成
- [x] 企業情報CRUD API
- [x] スクレイピング実行API
- [x] ステータス管理API
- [x] エクスポートAPI

### 🟢 Phase 5: フロントエンド基盤 (完了)
- [x] React/Vue.jsプロジェクト設定
- [x] 基本レイアウト
- [x] ルーティング設定
- [x] API連携の基盤

### ⚪ Phase 6: UI実装
- [ ] リスト一覧画面
- [ ] 収集設定画面
- [ ] ステータス管理画面
- [ ] エクスポート機能

### ⚪ Phase 7: 統合テスト
- [ ] E2Eテスト
- [ ] パフォーマンステスト
- [ ] ユーザビリティテスト

## 進捗状況

- **完了タスク**: 27/40 (68%)
- **現在のフェーズ**: Phase 5 完了
- **次のアクション**: Phase 6 - UI実装
- **コードカバレッジ**: 74%

## 実装済み機能

### ✅ Google Spreadsheet連携
- 企業情報の追加・取得・更新
- 営業ステータス管理
- 収集ログ記録
- 重複チェック機能

### ✅ スクレイピングエンジン
- レート制限機能
- 並列処理対応
- タイムアウト処理
- User-Agentローテーション
- エラーハンドリング

### ✅ ビジネスロジック層
- Companyモデル（バリデーション、住所パース機能付き）
- SalesStatusモデル（ステータス管理）
- CompanyService（収集・保存・更新の統合処理）

### ✅ FastAPI バックエンド
- 企業情報CRUD API（作成・取得・更新・削除・重複チェック）
- スクレイピング実行API（開始・停止・状況監視・履歴管理）
- 営業ステータス管理API（更新・ダッシュボード・分析機能）
- エクスポートAPI（CSV・Excel出力・テンプレート提供）
- レスポンスモデル・エラーハンドリング

### ✅ フロントエンド基盤
- React + TypeScript + Vite 構成
- Ant Design UIコンポーネント
- React Router による画面遷移
- React Query による状態管理・APIキャッシュ
- Axios APIクライアント（認証・エラーハンドリング）
- カスタムフック（企業・スクレイピング・営業管理）

## テスト実行コマンド

### バックエンド
```bash
# 全テスト実行
python -m pytest

# 特定のテストファイル実行
python -m pytest tests/test_google_sheets.py -v

# カバレッジレポート付き実行
python -m pytest --cov=app --cov-report=html
```

### フロントエンド
```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm run test

# ビルド
npm run build

# lint実行
npm run lint
```

## 設計原則

1. **YAGNI (You Ain't Gonna Need It)**: 必要になるまで実装しない
2. **DRY (Don't Repeat Yourself)**: 重複を避ける
3. **SOLID原則**: 単一責任、オープン・クローズドなど
4. **テストファースト**: 常にテストから始める 