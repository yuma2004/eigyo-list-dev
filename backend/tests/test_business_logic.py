"""
ビジネスロジック層のテスト
TDD (t-wada式) - Red -> Green -> Refactor
"""
import pytest
from unittest.mock import Mock, patch
from datetime import datetime

# まだ実装していないモジュールをインポート（RED phase）
from app.services.company_service import CompanyService
from app.models.company import Company, SalesStatus


class TestCompanyModel:
    """企業モデルのテストクラス"""
    
    def test_企業モデルを正しく初期化できる(self):
        """企業モデルの初期化テスト"""
        # Arrange & Act
        company = Company(
            id=1,
            company_name="テスト株式会社",
            url="https://example.com",
            address="東京都千代田区1-1-1",
            tel="03-1234-5678"
        )
        
        # Assert
        assert company.id == 1
        assert company.company_name == "テスト株式会社"
        assert company.url == "https://example.com"
    
    def test_企業モデルのバリデーションが機能する(self):
        """バリデーション機能のテスト"""
        # Arrange & Act & Assert
        with pytest.raises(ValueError) as exc_info:
            Company(
                id=1,
                company_name="",  # 空の会社名
                url="invalid-url"  # 無効なURL
            )
        
        assert "company_name" in str(exc_info.value)
    
    def test_住所を構成要素に分解できる(self):
        """住所パース機能のテスト"""
        # Arrange
        company = Company(
            id=1,
            company_name="テスト",
            url="https://example.com",
            address="〒100-0001 東京都千代田区千代田1-1"
        )
        
        # Act
        parsed = company.parse_address()
        
        # Assert
        assert parsed["postal_code"] == "100-0001"
        assert parsed["prefecture"] == "東京都"
        assert parsed["city"] == "千代田区"
        assert parsed["address_detail"] == "千代田1-1"


class TestSalesStatusModel:
    """営業ステータスモデルのテストクラス"""
    
    def test_ステータスの有効な値を検証できる(self):
        """ステータス値のバリデーションテスト"""
        # Arrange & Act
        valid_statuses = ["未着手", "アプローチ中", "商談中", "成約", "見送り"]
        
        for status in valid_statuses:
            sales_status = SalesStatus(
                company_id=1,
                status=status,
                updated_at=datetime.now()
            )
            assert sales_status.status == status
        
        # Assert - 無効なステータス
        with pytest.raises(ValueError):
            SalesStatus(company_id=1, status="無効なステータス")


class TestCompanyService:
    """企業サービス層のテストクラス"""
    
    @pytest.fixture
    def company_service(self):
        """テスト用のCompanyServiceインスタンス"""
        mock_sheets_service = Mock()
        mock_scraping_engine = Mock()
        return CompanyService(mock_sheets_service, mock_scraping_engine)
    
    def test_キーワード検索で企業情報を収集できる(self, company_service):
        """キーワード検索機能のテスト"""
        # Arrange
        keyword = "IT企業 東京"
        mock_search_results = [
            {"url": "https://company1.com"},
            {"url": "https://company2.com"}
        ]
        mock_company_data = [
            {"company_name": "IT企業A", "url": "https://company1.com"},
            {"company_name": "IT企業B", "url": "https://company2.com"}
        ]
        
        # Act
        # asyncioのrun関数もモックする必要がある
        with patch('asyncio.run') as mock_run:
            # 最初の呼び出し（search_companies）は検索結果を返す
            # 2番目の呼び出し（scrape_multiple）は企業データを返す
            mock_run.side_effect = [mock_search_results, mock_company_data]
            results = company_service.collect_companies_by_keyword(keyword)
        
        # Assert
        assert len(results) == 2
        assert results[0]["company_name"] == "IT企業A"
    
    def test_重複する企業を除外して保存できる(self, company_service):
        """重複排除機能のテスト"""
        # Arrange
        companies = [
            {"company_name": "既存企業", "url": "https://existing.com"},
            {"company_name": "新規企業", "url": "https://new.com"}
        ]
        
        # Act
        with patch.object(company_service.sheets_service, 'check_duplicate_by_url') as mock_check:
            mock_check.side_effect = [True, False]  # 1社目は重複、2社目は新規
            with patch.object(company_service.sheets_service, 'add_company') as mock_add:
                saved_count = company_service.save_companies(companies)
        
        # Assert
        assert saved_count == 1  # 新規の1社のみ保存
        mock_add.assert_called_once()
    
    def test_営業ステータスを一括更新できる(self, company_service):
        """ステータス一括更新機能のテスト"""
        # Arrange
        status_updates = [
            {"company_id": 1, "status": "アプローチ中"},
            {"company_id": 2, "status": "商談中"},
            {"company_id": 3, "status": "成約"}
        ]
        
        # Act
        with patch.object(company_service.sheets_service, 'update_sales_status', return_value=True):
            results = company_service.bulk_update_status(status_updates)
        
        # Assert
        assert all(results)
        assert len(results) == 3
    
    def test_収集ログを記録できる(self, company_service):
        """ログ記録機能のテスト"""
        # Arrange
        log_data = {
            "keyword": "テスト検索",
            "collected_count": 10,
            "success_count": 8,
            "error_count": 2
        }
        
        # Act
        with patch.object(company_service.sheets_service, 'add_collection_log', return_value=True):
            result = company_service.record_collection_log(log_data)
        
        # Assert
        assert result is True 