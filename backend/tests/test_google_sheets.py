"""
Google Spreadsheet連携機能のテスト
TDD (t-wada式) - Red -> Green -> Refactor
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

# まだ実装していないモジュールをインポート（RED phase）
from app.services.google_sheets import GoogleSheetsService


class TestGoogleSheetsService:
    """Google Spreadsheet連携サービスのテストクラス"""
    
    @pytest.fixture
    def mock_gspread_client(self):
        """モックのgspreadクライアント"""
        mock_client = Mock()
        mock_spreadsheet = Mock()
        mock_client.open_by_key.return_value = mock_spreadsheet
        return mock_client
    
    @pytest.fixture
    def sheets_service(self, mock_gspread_client):
        """テスト用のGoogleSheetsServiceインスタンス"""
        with patch('app.services.google_sheets.build_credentials', return_value=None):
            with patch('gspread.authorize', return_value=mock_gspread_client):
                service = GoogleSheetsService(spreadsheet_id="test_spreadsheet_id")
                # テスト用にclientを設定
                service.client = mock_gspread_client
                service.spreadsheet = mock_gspread_client.open_by_key.return_value
                return service
    
    def test_初期化時に認証情報を正しく設定できる(self, sheets_service):
        """GoogleSheetsServiceの初期化テスト"""
        assert sheets_service.spreadsheet_id == "test_spreadsheet_id"
        assert sheets_service.client is not None
    
    def test_企業情報を新規追加できる(self, sheets_service):
        """企業情報の追加機能テスト"""
        # Arrange
        company_data = {
            "company_name": "テスト株式会社",
            "url": "https://example.com",
            "address": "東京都千代田区1-1-1",
            "tel": "03-1234-5678",
            "representative": "山田太郎",
            "business_content": "ソフトウェア開発",
            "created_at": datetime.now().isoformat()
        }
        
        mock_worksheet = Mock()
        sheets_service.spreadsheet.worksheet.return_value = mock_worksheet
        
        # Act
        with patch.object(sheets_service, 'append_row', return_value={'updates': {'updatedRows': 1}}):
            result = sheets_service.add_company(company_data)
        
        # Assert
        assert result is True
    
    def test_URLで重複チェックができる(self, sheets_service):
        """重複チェック機能のテスト"""
        # Arrange
        test_url = "https://example.com"
        
        # Act
        with patch.object(sheets_service, 'find_by_url', return_value={"id": 1, "url": test_url}):
            result = sheets_service.check_duplicate_by_url(test_url)
        
        # Assert
        assert result is True
    
    def test_企業リストを取得できる(self, sheets_service):
        """企業リスト取得機能のテスト"""
        # Arrange
        mock_data = [
            ["id", "company_name", "url", "address"],  # ヘッダー行
            ["1", "テスト株式会社", "https://example1.com", "東京都"],
            ["2", "サンプル株式会社", "https://example2.com", "大阪府"]
        ]
        
        mock_worksheet = Mock()
        sheets_service.spreadsheet.worksheet.return_value = mock_worksheet
        
        # Act
        with patch.object(sheets_service, 'get_all_values', return_value=mock_data):
            companies = sheets_service.get_companies()
        
        # Assert
        assert len(companies) == 2
        assert companies[0]["company_name"] == "テスト株式会社"
        assert companies[1]["company_name"] == "サンプル株式会社"
    
    def test_ステータスを更新できる(self, sheets_service):
        """営業ステータス更新機能のテスト"""
        # Arrange
        company_id = 1
        status_data = {
            "status": "アプローチ中",
            "memo": "初回メール送信済み",
            "contact_person": "営業部 田中様",
            "updated_at": datetime.now().isoformat()
        }
        
        mock_worksheet = Mock()
        mock_worksheet.find.side_effect = Exception("Cell not found")  # 新規追加のケース
        sheets_service.spreadsheet.worksheet.return_value = mock_worksheet
        
        # Act
        with patch.object(sheets_service, 'update_status', return_value=True):
            result = sheets_service.update_sales_status(company_id, status_data)
        
        # Assert
        assert result is True
    
    def test_エラー時に適切に例外を処理できる(self, sheets_service):
        """エラーハンドリングのテスト"""
        # Arrange
        mock_worksheet = Mock()
        sheets_service.spreadsheet.worksheet.return_value = mock_worksheet
        
        # Act & Assert
        with patch.object(sheets_service, 'append_row', side_effect=Exception("API Error")):
            with pytest.raises(Exception) as exc_info:
                sheets_service.add_company({"company_name": "エラーテスト"})
            
            assert "API Error" in str(exc_info.value) 