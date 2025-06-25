"""
FastAPI エンドポイントのテスト
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from datetime import datetime

from app.main import app
from app.models.company import Company, SalesStatus


@pytest.fixture
def client():
    """テスト用クライアント"""
    return TestClient(app)


@pytest.fixture
def sample_company():
    """テスト用企業データ"""
    return Company(
        id=1,
        company_name="テスト株式会社",
        url="https://test.com",
        address="東京都渋谷区1-1-1",
        tel="03-1234-5678",
        representative="山田太郎",
        business_content="IT事業",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )


@pytest.fixture
def sample_sales_status():
    """テスト用営業ステータス"""
    return SalesStatus(
        company_id=1,
        status="未着手",
        memo="初回アプローチ予定",
        contact_person="田中",
        updated_at=datetime.now()
    )


class TestCompaniesAPI:
    """企業情報CRUD APIのテスト"""
    
    def test_get_companies_success(self, client):
        """企業一覧取得 - 成功"""
        with patch('app.api.companies.company_service') as mock_service:
            mock_service.get_companies.return_value = []
            
            response = client.get("/api/companies")
            
            assert response.status_code == 200
            assert response.json() == {"companies": []}
    
    def test_get_companies_with_filters(self, client):
        """企業一覧取得 - フィルター付き"""
        with patch('app.api.companies.company_service') as mock_service:
            mock_service.get_companies.return_value = []
            
            response = client.get("/api/companies?status=未着手&prefecture=東京都")
            
            assert response.status_code == 200
            mock_service.get_companies.assert_called_once()
    
    def test_get_company_by_id_success(self, client, sample_company):
        """企業詳細取得 - 成功"""
        with patch('app.api.companies.company_service') as mock_service:
            mock_service.get_company_by_id.return_value = sample_company
            
            response = client.get("/api/companies/1")
            
            assert response.status_code == 200
            assert response.json()["company"]["company_name"] == "テスト株式会社"
    
    def test_get_company_by_id_not_found(self, client):
        """企業詳細取得 - 見つからない"""
        with patch('app.api.companies.company_service') as mock_service:
            mock_service.get_company_by_id.return_value = None
            
            response = client.get("/api/companies/999")
            
            assert response.status_code == 404
            assert response.json()["detail"] == "Company not found"
    
    def test_create_company_success(self, client):
        """企業作成 - 成功"""
        company_data = {
            "company_name": "新規企業",
            "url": "https://new-company.com",
            "address": "大阪府大阪市1-1-1"
        }
        
        with patch('app.api.companies.company_service') as mock_service:
            mock_service.add_company.return_value = 1
            
            response = client.post("/api/companies", json=company_data)
            
            assert response.status_code == 201
            assert response.json()["message"] == "Company created successfully"
            assert response.json()["company_id"] == 1
    
    def test_create_company_validation_error(self, client):
        """企業作成 - バリデーションエラー"""
        invalid_data = {
            "company_name": "",  # 空文字
            "url": "invalid-url"  # 無効なURL
        }
        
        response = client.post("/api/companies", json=invalid_data)
        
        assert response.status_code == 422
    
    def test_update_company_success(self, client):
        """企業更新 - 成功"""
        update_data = {
            "company_name": "更新された企業名",
            "tel": "06-1234-5678"
        }
        
        with patch('app.api.companies.company_service') as mock_service:
            mock_service.update_company.return_value = True
            
            response = client.put("/api/companies/1", json=update_data)
            
            assert response.status_code == 200
            assert response.json()["message"] == "Company updated successfully"
    
    def test_update_company_not_found(self, client):
        """企業更新 - 見つからない"""
        update_data = {"company_name": "更新企業"}
        
        with patch('app.api.companies.company_service') as mock_service:
            mock_service.update_company.return_value = False
            
            response = client.put("/api/companies/999", json=update_data)
            
            assert response.status_code == 404
    
    def test_delete_company_success(self, client):
        """企業削除 - 成功"""
        with patch('app.api.companies.company_service') as mock_service:
            mock_service.delete_company.return_value = True
            
            response = client.delete("/api/companies/1")
            
            assert response.status_code == 200
            assert response.json()["message"] == "Company deleted successfully"
    
    def test_delete_company_not_found(self, client):
        """企業削除 - 見つからない"""
        with patch('app.api.companies.company_service') as mock_service:
            mock_service.delete_company.return_value = False
            
            response = client.delete("/api/companies/999")
            
            assert response.status_code == 404


class TestScrapingAPI:
    """スクレイピング実行APIのテスト"""
    
    def test_start_scraping_success(self, client):
        """スクレイピング開始 - 成功"""
        scraping_config = {
            "keywords": ["IT企業", "広告代理店"],
            "target_sites": ["job_sites"],
            "max_pages": 10
        }
        
        with patch('app.api.scraping.company_service') as mock_service:
            mock_service.collect_companies.return_value = {"collected": 5, "errors": 0}
            
            response = client.post("/api/scraping/start", json=scraping_config)
            
            assert response.status_code == 200
            assert response.json()["message"] == "Scraping completed successfully"
            assert response.json()["result"]["collected"] == 5
    
    def test_start_scraping_validation_error(self, client):
        """スクレイピング開始 - バリデーションエラー"""
        invalid_config = {
            "keywords": [],  # 空のキーワード
            "max_pages": -1  # 無効な値
        }
        
        response = client.post("/api/scraping/start", json=invalid_config)
        
        assert response.status_code == 422
    
    def test_get_scraping_status(self, client):
        """スクレイピング状況取得"""
        with patch('app.api.scraping.scraping_service') as mock_service:
            mock_service.get_status.return_value = {
                "status": "running",
                "progress": 50,
                "collected": 25,
                "total": 50
            }
            
            response = client.get("/api/scraping/status")
            
            assert response.status_code == 200
            assert response.json()["status"] == "running"
            assert response.json()["progress"] == 50
    
    def test_stop_scraping(self, client):
        """スクレイピング停止"""
        with patch('app.api.scraping.scraping_service') as mock_service:
            mock_service.stop.return_value = True
            
            response = client.post("/api/scraping/stop")
            
            assert response.status_code == 200
            assert response.json()["message"] == "Scraping stopped successfully"


class TestSalesStatusAPI:
    """営業ステータス管理APIのテスト"""
    
    def test_get_sales_status_success(self, client, sample_sales_status):
        """営業ステータス取得 - 成功"""
        with patch('app.api.sales.google_sheets_service') as mock_service:
            mock_service.get_sales_status.return_value = sample_sales_status
            
            response = client.get("/api/sales/1")
            
            assert response.status_code == 200
            assert response.json()["status"]["status"] == "未着手"
    
    def test_get_sales_status_not_found(self, client):
        """営業ステータス取得 - 見つからない"""
        with patch('app.api.sales.google_sheets_service') as mock_service:
            mock_service.get_sales_status.return_value = None
            
            response = client.get("/api/sales/999")
            
            assert response.status_code == 404
    
    def test_update_sales_status_success(self, client):
        """営業ステータス更新 - 成功"""
        status_data = {
            "status": "アプローチ中",
            "memo": "初回メール送信済み",
            "contact_person": "佐藤"
        }
        
        with patch('app.api.sales.google_sheets_service') as mock_service:
            mock_service.update_sales_status.return_value = True
            
            response = client.put("/api/sales/1", json=status_data)
            
            assert response.status_code == 200
            assert response.json()["message"] == "Sales status updated successfully"
    
    def test_update_sales_status_invalid_status(self, client):
        """営業ステータス更新 - 無効なステータス"""
        invalid_data = {
            "status": "無効なステータス"
        }
        
        response = client.put("/api/sales/1", json=invalid_data)
        
        assert response.status_code == 422
    
    def test_get_sales_dashboard(self, client):
        """営業ダッシュボード取得"""
        with patch('app.api.sales.google_sheets_service') as mock_service:
            mock_service.get_sales_summary.return_value = {
                "未着手": 10,
                "アプローチ中": 5,
                "商談中": 3,
                "成約": 2,
                "見送り": 1
            }
            
            response = client.get("/api/sales/dashboard")
            
            assert response.status_code == 200
            assert response.json()["summary"]["未着手"] == 10
            assert response.json()["summary"]["成約"] == 2


class TestExportAPI:
    """エクスポートAPIのテスト"""
    
    def test_export_csv_success(self, client):
        """CSV エクスポート - 成功"""
        with patch('app.api.export.company_service') as mock_service:
            mock_service.get_companies.return_value = []
            
            response = client.get("/api/export/csv")
            
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/csv; charset=utf-8"
            assert "attachment" in response.headers["content-disposition"]
    
    def test_export_csv_with_filters(self, client):
        """CSV エクスポート - フィルター付き"""
        with patch('app.api.export.company_service') as mock_service:
            mock_service.get_companies.return_value = []
            
            response = client.get("/api/export/csv?status=成約&prefecture=東京都")
            
            assert response.status_code == 200
            mock_service.get_companies.assert_called_once()
    
    def test_export_excel_success(self, client):
        """Excel エクスポート - 成功"""
        with patch('app.api.export.company_service') as mock_service:
            mock_service.get_companies.return_value = []
            
            response = client.get("/api/export/excel")
            
            assert response.status_code == 200
            assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers["content-type"]
            assert "attachment" in response.headers["content-disposition"]
    
    def test_export_template_success(self, client):
        """テンプレート エクスポート - 成功"""
        response = client.get("/api/export/template")
        
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers["content-type"]
        assert "template" in response.headers["content-disposition"].lower()


class TestHealthCheck:
    """ヘルスチェックAPIのテスト"""
    
    def test_health_check(self, client):
        """ヘルスチェック"""
        response = client.get("/health")
        
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        assert "timestamp" in response.json()
    
    def test_api_info(self, client):
        """API 情報取得"""
        response = client.get("/api/info")
        
        assert response.status_code == 200
        assert "version" in response.json()
        assert "title" in response.json()