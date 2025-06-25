#!/bin/bash

# 営業リスト作成ツール - 統合テスト実行スクリプト
# TDD Phase 7: 統合テスト実行と結果確認

set -e

echo "🚀 営業リスト作成ツール - 統合テスト実行開始"
echo "=================================================="

# カラーコード定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 環境チェック
check_environment() {
    log_info "環境チェック中..."
    
    # Node.js チェック
    if ! command -v node &> /dev/null; then
        log_error "Node.js がインストールされていません"
        exit 1
    fi
    
    # Python チェック
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 がインストールされていません"
        exit 1
    fi
    
    # Poetry チェック
    if ! command -v poetry &> /dev/null; then
        log_error "Poetry がインストールされていません"
        exit 1
    fi
    
    log_success "環境チェック完了"
}

# 依存関係インストール
install_dependencies() {
    log_info "依存関係インストール中..."
    
    # Backend dependencies
    log_info "バックエンド依存関係インストール..."
    cd backend
    poetry install
    cd ..
    
    # Frontend dependencies
    log_info "フロントエンド依存関係インストール..."
    cd frontend
    npm ci
    cd ..
    
    log_success "依存関係インストール完了"
}

# Backend テスト実行
run_backend_tests() {
    log_info "バックエンドテスト実行中..."
    cd backend
    
    # 環境変数設定
    export TESTING=true
    export DATABASE_URL="sqlite:///./test.db"
    
    # Linting
    log_info "コード品質チェック実行..."
    poetry run black --check app tests || {
        log_warning "Black フォーマットチェックで問題が見つかりました"
        poetry run black app tests
        log_info "フォーマット修正完了"
    }
    
    poetry run isort --check-only app tests || {
        log_warning "isort チェックで問題が見つかりました"
        poetry run isort app tests
        log_info "インポート順序修正完了"
    }
    
    # ユニットテスト
    log_info "ユニットテスト実行..."
    poetry run pytest tests/test_*.py -v --cov=app --cov-report=term-missing --cov-report=html --cov-report=xml
    
    # 統合テスト
    log_info "統合テスト実行..."
    poetry run pytest tests/test_integration_*.py -v --maxfail=5
    
    # パフォーマンステスト
    log_info "パフォーマンステスト実行..."
    poetry run pytest tests/test_performance_*.py -v --tb=short
    
    cd ..
    log_success "バックエンドテスト完了"
}

# Frontend テスト実行
run_frontend_tests() {
    log_info "フロントエンドテスト実行中..."
    cd frontend
    
    # Linting
    log_info "TypeScript型チェック実行..."
    npm run typecheck
    
    log_info "ESLint実行..."
    npm run lint
    
    # ユニットテスト・統合テスト
    log_info "ユニット・統合テスト実行..."
    npm run test:coverage
    
    # ビルドテスト
    log_info "ビルドテスト実行..."
    npm run build
    
    cd ..
    log_success "フロントエンドテスト完了"
}

# E2E テスト実行
run_e2e_tests() {
    log_info "E2Eテスト実行中..."
    
    # バックエンドサーバー起動
    log_info "バックエンドサーバー起動..."
    cd backend
    export TESTING=true
    export DATABASE_URL="sqlite:///./test_e2e.db"
    poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    cd ..
    
    # フロントエンドサーバー起動
    log_info "フロントエンドサーバー起動..."
    cd frontend
    npm run build
    npm run preview -- --port 3000 --host &
    FRONTEND_PID=$!
    cd ..
    
    # サーバー起動待機
    log_info "サーバー起動待機中..."
    sleep 10
    
    # ヘルスチェック
    for i in {1..30}; do
        if curl -f http://localhost:8000/health &>/dev/null && curl -f http://localhost:3000 &>/dev/null; then
            log_success "サーバー起動確認完了"
            break
        fi
        if [ $i -eq 30 ]; then
            log_error "サーバー起動に失敗しました"
            cleanup_servers
            exit 1
        fi
        sleep 2
    done
    
    # Playwright ブラウザインストール
    cd frontend
    npx playwright install --with-deps
    
    # E2Eテスト実行
    log_info "Playwright E2Eテスト実行..."
    npm run test:e2e
    
    cd ..
    
    # サーバー停止
    cleanup_servers
    
    log_success "E2Eテスト完了"
}

# サーバークリーンアップ
cleanup_servers() {
    log_info "サーバー停止中..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    sleep 2
}

# テストレポート生成
generate_reports() {
    log_info "テストレポート生成中..."
    
    # レポートディレクトリ作成
    mkdir -p reports
    
    # Backend カバレッジレポート
    if [ -f "backend/htmlcov/index.html" ]; then
        cp -r backend/htmlcov reports/backend-coverage
        log_info "バックエンドカバレッジレポート: reports/backend-coverage/index.html"
    fi
    
    # Frontend カバレッジレポート
    if [ -f "frontend/coverage/index.html" ]; then
        cp -r frontend/coverage reports/frontend-coverage
        log_info "フロントエンドカバレッジレポート: reports/frontend-coverage/index.html"
    fi
    
    # E2E テストレポート
    if [ -d "frontend/test-results" ]; then
        cp -r frontend/test-results reports/e2e-results
        log_info "E2Eテスト結果: reports/e2e-results/"
    fi
    
    # Playwright レポート
    if [ -d "frontend/playwright-report" ]; then
        cp -r frontend/playwright-report reports/playwright-report
        log_info "Playwrightレポート: reports/playwright-report/index.html"
    fi
    
    log_success "テストレポート生成完了"
}

# 統計情報表示
show_statistics() {
    log_info "テスト統計情報"
    echo "================================"
    
    # Backend テスト結果
    if [ -f "backend/coverage.xml" ]; then
        BACKEND_COVERAGE=$(grep -o 'line-rate="[^"]*"' backend/coverage.xml | head -1 | grep -o '[0-9.]*')
        if [ ! -z "$BACKEND_COVERAGE" ]; then
            BACKEND_PERCENTAGE=$(echo "scale=1; $BACKEND_COVERAGE * 100" | bc)
            echo "📊 Backend Coverage: ${BACKEND_PERCENTAGE}%"
        fi
    fi
    
    # Frontend テスト結果
    if [ -f "frontend/coverage/coverage-summary.json" ]; then
        FRONTEND_COVERAGE=$(grep -o '"lines":{"total":[0-9]*,"covered":[0-9]*' frontend/coverage/coverage-summary.json | awk -F'[:,]' '{print ($4/$2)*100}')
        if [ ! -z "$FRONTEND_COVERAGE" ]; then
            echo "📊 Frontend Coverage: ${FRONTEND_COVERAGE}%"
        fi
    fi
    
    # ファイル数カウント
    BACKEND_TEST_FILES=$(find backend/tests -name "*.py" | wc -l)
    FRONTEND_TEST_FILES=$(find frontend/src -name "*.test.*" -o -name "*.spec.*" | wc -l)
    
    echo "📁 Backend Test Files: $BACKEND_TEST_FILES"
    echo "📁 Frontend Test Files: $FRONTEND_TEST_FILES"
    echo "================================"
}

# メイン実行関数
main() {
    # トラップ設定（Ctrl+C対応）
    trap cleanup_servers EXIT INT TERM
    
    case "${1:-all}" in
        "env")
            check_environment
            ;;
        "deps")
            install_dependencies
            ;;
        "backend")
            check_environment
            run_backend_tests
            ;;
        "frontend")
            check_environment
            run_frontend_tests
            ;;
        "e2e")
            check_environment
            run_e2e_tests
            ;;
        "reports")
            generate_reports
            ;;
        "stats")
            show_statistics
            ;;
        "all"|"")
            check_environment
            install_dependencies
            run_backend_tests
            run_frontend_tests
            run_e2e_tests
            generate_reports
            show_statistics
            ;;
        *)
            echo "使用方法: $0 [env|deps|backend|frontend|e2e|reports|stats|all]"
            echo ""
            echo "オプション:"
            echo "  env      - 環境チェックのみ"
            echo "  deps     - 依存関係インストールのみ"
            echo "  backend  - バックエンドテストのみ"
            echo "  frontend - フロントエンドテストのみ"
            echo "  e2e      - E2Eテストのみ"
            echo "  reports  - レポート生成のみ"
            echo "  stats    - 統計情報表示のみ"
            echo "  all      - 全テスト実行（デフォルト）"
            exit 1
            ;;
    esac
    
    log_success "🎉 テスト実行完了！"
    echo ""
    echo "📊 詳細なレポートは reports/ ディレクトリを確認してください"
    echo "🔍 カバレッジレポート:"
    echo "   - Backend: reports/backend-coverage/index.html"
    echo "   - Frontend: reports/frontend-coverage/index.html"
    echo "🎭 E2Eテスト結果: reports/playwright-report/index.html"
}

# スクリプト実行
main "$@"