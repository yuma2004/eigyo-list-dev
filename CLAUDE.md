# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

営業リスト作成ツール - ASPおよび広告代理店への営業活動を効率化するWebアプリケーション。Webスクレイピングによる企業情報の自動収集、営業ステータス管理、CSV/Excelエクスポート機能を提供する完全なフルスタックアプリケーション。

## システム構成

### 技術スタック
- **バックエンド**: Python 3.11 + FastAPI + SQLAlchemy + PostgreSQL
- **フロントエンド**: React 18 + TypeScript + Vite + Ant Design 
- **テスト**: pytest (Backend) + Vitest + Playwright (Frontend)
- **開発**: Poetry (Backend) + npm (Frontend) + GitHub Actions CI/CD

### アプリケーション構成
```
営業リスト作成ツール
├── バックエンド API (FastAPI)
│   ├── 企業管理API (/api/companies)
│   ├── スクレイピングAPI (/api/scraping) 
│   ├── 営業管理API (/api/sales)
│   └── エクスポートAPI (/api/export)
├── フロントエンド (React SPA)
│   ├── 企業管理ページ
│   ├── データ収集ページ
│   ├── 営業管理ダッシュボード
│   └── エクスポートページ
└── データベース (PostgreSQL)
    ├── companiesテーブル
    └── sales_statusesテーブル
```

### 主要ワークフロー
1. **データ収集**: Webスクレイピングで企業情報を自動収集
2. **企業管理**: 収集データの確認・編集・CRUD操作
3. **営業管理**: ステータス更新・進捗追跡・ダッシュボード分析
4. **エクスポート**: CSV/Excel形式での一括出力

## 開発コマンド

### 環境構築
```bash
# Backend (Poetry使用)
cd backend
poetry install              # 依存関係インストール
poetry shell                # 仮想環境アクティベート

# Frontend (npm使用)
cd frontend  
npm install                  # 依存関係インストール
```

### アプリケーション実行
```bash
# Backend サーバー起動 (http://localhost:8000)
cd backend
poetry run uvicorn app.main:app --reload

# Frontend 開発サーバー起動 (http://localhost:3000)
cd frontend
npm run dev

# 本番ビルド
npm run build
npm run preview
```

### テスト実行
```bash
# 全テスト自動実行
./run_tests.sh

# Backend テスト個別実行
cd backend
poetry run pytest                           # 全テスト
poetry run pytest tests/test_integration_*.py -v    # 統合テスト
poetry run pytest --cov=app --cov-report=html       # カバレッジ付き
poetry run pytest tests/test_api_endpoints.py::TestCompaniesAPI::test_create_company -v -s  # 単一テスト

# Frontend テスト個別実行  
cd frontend
npm run test                    # 全テスト
npm run test:coverage          # カバレッジ付き
npm run test CompaniesList.test.tsx  # 単一ファイル
npm run test:e2e               # E2Eテスト (Playwright)

# コード品質チェック
cd backend && poetry run black app tests && poetry run isort app tests && poetry run flake8 app tests
cd frontend && npm run lint && npm run typecheck
```

## アーキテクチャ詳細

### Backend API エンドポイント (FastAPI)
```
/api/companies          # 企業CRUD操作
├── GET    /            # 企業一覧取得 (ページネーション・フィルタ対応)
├── POST   /            # 新規企業登録
├── GET    /{id}        # 企業詳細取得
├── PUT    /{id}        # 企業情報更新
└── DELETE /{id}        # 企業削除

/api/scraping           # データ収集機能
├── GET    /status      # スクレイピング状況取得
├── POST   /start       # スクレイピング開始
├── POST   /stop        # スクレイピング停止
├── GET    /history     # 実行履歴取得
└── GET    /config      # 設定取得・更新

/api/sales              # 営業管理機能  
├── GET    /dashboard   # ダッシュボード統計
├── GET    /statuses    # 営業ステータス一覧
├── POST   /companies/{id}/status      # ステータス作成
├── PUT    /companies/{id}/status      # ステータス更新
├── GET    /follow-ups  # フォローアップ予定
└── GET    /analytics   # 成約率分析

/api/export            # データエクスポート
├── GET    /stats      # エクスポート統計
├── POST   /csv        # CSV形式ダウンロード
├── POST   /excel      # Excel形式ダウンロード
└── GET    /template   # インポート用テンプレート
```

### Frontend コンポーネント構成 (React)
```
src/
├── pages/                    # メインページコンポーネント
│   ├── CompaniesList.tsx     # 企業一覧・CRUD操作
│   ├── CompanyDetail.tsx     # 企業詳細・編集
│   ├── ScrapingPage.tsx      # データ収集設定・実行
│   ├── SalesManagement.tsx   # 営業ダッシュボード・ステータス管理
│   └── ExportPage.tsx        # エクスポート・統計
├── hooks/                    # React Query カスタムフック
│   ├── useCompanies.ts       # 企業データ取得・操作
│   ├── useScraping.ts        # スクレイピング操作
│   └── useSales.ts           # 営業管理操作
├── services/                 # API通信レイヤー
│   ├── companiesService.ts   # 企業API
│   ├── scrapingService.ts    # スクレイピングAPI
│   ├── salesService.ts       # 営業API
│   └── exportService.ts      # エクスポートAPI
└── types/api.ts              # TypeScript型定義
```

### データベーススキーマ (PostgreSQL)
```sql
-- 企業情報テーブル
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR NOT NULL,
    url VARCHAR UNIQUE NOT NULL,
    address TEXT,
    tel VARCHAR,
    fax VARCHAR,
    representative VARCHAR,
    business_content TEXT,
    established_date DATE,
    capital VARCHAR,
    contact_url VARCHAR,
    prefecture VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 営業ステータステーブル  
CREATE TABLE sales_statuses (
    company_id INTEGER PRIMARY KEY REFERENCES companies(id),
    status VARCHAR(20) NOT NULL DEFAULT '未着手',
    contact_person VARCHAR,
    last_contact_date DATE,
    next_action TEXT,
    memo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## TDD開発フェーズ完了状況

**✅ Phase 1-7: 全フェーズ完了済み (100%)**

1. **Phase 1**: プロジェクト設計・要件定義
2. **Phase 2**: データベース設計・モデル定義  
3. **Phase 3**: コアロジック実装 (Red-Green-Refactor)
4. **Phase 4**: FastAPI バックエンド実装
5. **Phase 5**: React フロントエンド基盤
6. **Phase 6**: UI実装 (全ページ完成)
7. **Phase 7**: 統合テスト実装

### テストカバレッジ目標達成
- **Backend**: 80%以上 (pytest)
- **Frontend**: 80%以上 (Vitest)  
- **統合テスト**: 主要ワークフロー100%
- **E2Eテスト**: クリティカルパス100%

## 主要機能とビジネスロジック

### スクレイピングエンジン
- **並行処理**: 複数サイト同時スクレイピング
- **レート制限**: 1-3秒間隔でのリクエスト制御
- **エラーハンドリング**: 自動リトライ・タイムアウト処理
- **データ正規化**: 企業名・住所の統一フォーマット

### 営業管理システム
- **ステータス管理**: 未着手→アプローチ中→商談中→成約のフロー
- **ダッシュボード**: リアルタイム統計・成約率分析
- **フォローアップ**: 次回アクション・スケジュール管理

### データ整合性・セキュリティ
- **重複防止**: URL・企業名での重複チェック
- **入力検証**: Pydantic バリデーション
- **SQLインジェクション対策**: SQLAlchemy ORM使用
- **CORS設定**: フロントエンドとの安全な通信