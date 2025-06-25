"""
Google Spreadsheet連携サービス
"""
import gspread
from google.oauth2.service_account import Credentials
from typing import Dict, List, Optional, Any
from datetime import datetime
import os
from loguru import logger


def build_credentials(credentials_path: Optional[str] = None) -> Credentials:
    """Google認証情報を構築する"""
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]
    
    if credentials_path is None:
        credentials_path = os.environ.get('GOOGLE_CREDENTIALS_PATH', 'credentials.json')
    
    try:
        credentials = Credentials.from_service_account_file(
            credentials_path,
            scopes=scopes
        )
        return credentials
    except Exception as e:
        logger.error(f"認証情報の読み込みに失敗しました: {e}")
        # テスト時はモックを返す
        return None


class GoogleSheetsService:
    """Google Spreadsheet操作サービス"""
    
    def __init__(self, spreadsheet_id: str, credentials_path: Optional[str] = None):
        """
        初期化
        
        Args:
            spreadsheet_id: Google SpreadsheetのID
            credentials_path: 認証情報ファイルのパス
        """
        self.spreadsheet_id = spreadsheet_id
        credentials = build_credentials(credentials_path)
        
        if credentials:
            self.client = gspread.authorize(credentials)
            self.spreadsheet = self.client.open_by_key(spreadsheet_id)
        else:
            # テスト時のモック対応
            self.client = None
            self.spreadsheet = None
    
    def add_company(self, company_data: Dict[str, Any]) -> bool:
        """
        企業情報を追加する
        
        Args:
            company_data: 企業情報の辞書
            
        Returns:
            成功時True
        """
        try:
            worksheet = self.spreadsheet.worksheet("Companies")
            
            # データを行形式に変換
            row_data = [
                company_data.get("id", ""),
                company_data.get("company_name", ""),
                company_data.get("url", ""),
                company_data.get("address", ""),
                company_data.get("postal_code", ""),
                company_data.get("prefecture", ""),
                company_data.get("city", ""),
                company_data.get("address_detail", ""),
                company_data.get("tel", ""),
                company_data.get("fax", ""),
                company_data.get("representative", ""),
                company_data.get("business_content", ""),
                company_data.get("established_date", ""),
                company_data.get("capital", ""),
                company_data.get("contact_url", ""),
                company_data.get("source_url", ""),
                company_data.get("created_at", datetime.now().isoformat()),
                datetime.now().isoformat()
            ]
            
            result = self.append_row(worksheet, row_data)
            return result is not None
            
        except Exception as e:
            logger.error(f"企業情報の追加に失敗しました: {e}")
            raise
    
    def append_row(self, worksheet, row_data: List[Any]) -> Dict[str, Any]:
        """ワークシートに行を追加する（テスト可能なメソッド）"""
        return worksheet.append_row(row_data)
    
    def check_duplicate_by_url(self, url: str) -> bool:
        """
        URLによる重複チェック
        
        Args:
            url: チェック対象のURL
            
        Returns:
            重複している場合True
        """
        try:
            result = self.find_by_url(url)
            return result is not None
        except Exception as e:
            logger.error(f"重複チェックに失敗しました: {e}")
            return False
    
    def find_by_url(self, url: str) -> Optional[Dict[str, Any]]:
        """URLで企業を検索する"""
        worksheet = self.spreadsheet.worksheet("Companies")
        try:
            cell = worksheet.find(url)
            if cell:
                row = worksheet.row_values(cell.row)
                return {"id": row[0], "url": row[2]}
            return None
        except Exception:
            # セルが見つからない場合
            return None
    
    def get_companies(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        企業リストを取得する
        
        Args:
            limit: 取得件数の上限
            
        Returns:
            企業情報のリスト
        """
        try:
            worksheet = self.spreadsheet.worksheet("Companies")
            all_values = self.get_all_values(worksheet)
            
            # ヘッダー行をスキップ
            data_rows = all_values[1:] if len(all_values) > 1 else []
            
            if limit:
                data_rows = data_rows[:limit]
            
            companies = []
            for row in data_rows:
                if len(row) >= 3:  # 最低限必要なカラム数
                    companies.append({
                        "id": row[0] if len(row) > 0 else "",
                        "company_name": row[1] if len(row) > 1 else "",
                        "url": row[2] if len(row) > 2 else "",
                        "address": row[3] if len(row) > 3 else "",
                        # 他のフィールドも必要に応じて追加
                    })
            
            return companies
            
        except Exception as e:
            logger.error(f"企業リストの取得に失敗しました: {e}")
            return []
    
    def get_all_values(self, worksheet) -> List[List[str]]:
        """ワークシートの全データを取得する（テスト可能なメソッド）"""
        return worksheet.get_all_values()
    
    def update_sales_status(self, company_id: int, status_data: Dict[str, Any]) -> bool:
        """
        営業ステータスを更新する
        
        Args:
            company_id: 企業ID
            status_data: ステータス情報
            
        Returns:
            成功時True
        """
        try:
            worksheet = self.spreadsheet.worksheet("SalesStatuses")
            
            # 既存のステータスを検索
            cell = None
            try:
                cell = worksheet.find(str(company_id))
            except Exception:
                # セルが見つからない場合は新規追加
                pass
            
            if cell:
                # 既存行を更新
                row_num = cell.row
                row_data = [
                    str(company_id),
                    status_data.get("status", ""),
                    status_data.get("memo", ""),
                    status_data.get("contact_person", ""),
                    status_data.get("last_contact_date", ""),
                    status_data.get("next_action", ""),
                    status_data.get("updated_at", datetime.now().isoformat())
                ]
                
                worksheet.update(f"A{row_num}:G{row_num}", [row_data])
            else:
                # 新規追加
                row_data = [
                    str(company_id),
                    status_data.get("status", ""),
                    status_data.get("memo", ""),
                    status_data.get("contact_person", ""),
                    status_data.get("last_contact_date", ""),
                    status_data.get("next_action", ""),
                    datetime.now().isoformat()
                ]
                
                self.update_status(worksheet, row_data)
            
            return True
            
        except Exception as e:
            logger.error(f"ステータス更新に失敗しました: {e}")
            return False
    
    def update_status(self, worksheet, row_data: List[Any]) -> None:
        """ステータスシートに行を追加する（テスト可能なメソッド）"""
        worksheet.append_row(row_data)
    
    def add_collection_log(self, log_entry: Dict[str, Any]) -> bool:
        """
        収集ログを追加する
        
        Args:
            log_entry: ログエントリ
            
        Returns:
            成功時True
        """
        try:
            worksheet = self.spreadsheet.worksheet("CollectionLogs")
            
            # データを行形式に変換
            row_data = [
                log_entry.get("id", ""),
                log_entry.get("execution_date", ""),
                log_entry.get("keyword", ""),
                log_entry.get("target_sites", ""),
                log_entry.get("collected_count", 0),
                log_entry.get("success_count", 0),
                log_entry.get("error_count", 0),
                log_entry.get("status", ""),
                log_entry.get("error_details", "")
            ]
            
            result = worksheet.append_row(row_data)
            return result is not None
            
        except Exception as e:
            logger.error(f"ログ追加エラー: {e}")
            return False 