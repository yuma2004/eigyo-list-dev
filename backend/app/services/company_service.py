"""
企業情報サービス層
"""
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger

from app.models.company import Company, SalesStatus
from app.services.google_sheets import GoogleSheetsService
from app.services.scraping_engine import ScrapingEngine


class CompanyService:
    """企業情報を管理するサービスクラス"""
    
    def __init__(self, sheets_service: GoogleSheetsService, scraping_engine: ScrapingEngine):
        """
        初期化
        
        Args:
            sheets_service: Google Sheetsサービス
            scraping_engine: スクレイピングエンジン
        """
        self.sheets_service = sheets_service
        self.scraping_engine = scraping_engine
    
    def collect_companies_by_keyword(self, keyword: str) -> List[Dict[str, Any]]:
        """
        キーワードで企業情報を収集する
        
        Args:
            keyword: 検索キーワード
            
        Returns:
            収集した企業情報のリスト
        """
        try:
            # キーワードで検索
            search_results = asyncio.run(self.scraping_engine.search_companies(keyword))
            
            if not search_results:
                logger.warning(f"検索結果が見つかりませんでした: {keyword}")
                return []
            
            # URLリストを抽出
            urls = [result.get("url") for result in search_results if result.get("url")]
            
            # 並列でスクレイピング
            company_data = asyncio.run(self.scraping_engine.scrape_multiple(urls))
            
            # エラーでない結果のみ返す
            valid_companies = [
                company for company in company_data 
                if not company.get("error")
            ]
            
            logger.info(f"キーワード '{keyword}' で {len(valid_companies)} 件の企業情報を収集しました")
            return valid_companies
            
        except Exception as e:
            logger.error(f"企業情報収集エラー: {e}")
            return []
    
    def save_companies(self, companies: List[Dict[str, Any]]) -> int:
        """
        企業情報を保存する（重複チェック付き）
        
        Args:
            companies: 企業情報のリスト
            
        Returns:
            保存した件数
        """
        saved_count = 0
        
        for company_data in companies:
            try:
                # URLで重複チェック
                url = company_data.get("url")
                if url and self.sheets_service.check_duplicate_by_url(url):
                    logger.info(f"重複: {company_data.get('company_name', 'Unknown')} - {url}")
                    continue
                
                # Companyモデルでバリデーション
                company = Company(**company_data)
                
                # 住所を分解
                if company.address:
                    parsed_address = company.parse_address()
                    company_data.update(parsed_address)
                
                # タイムスタンプを追加
                company_data["created_at"] = datetime.now().isoformat()
                company_data["updated_at"] = datetime.now().isoformat()
                
                # 保存
                if self.sheets_service.add_company(company_data):
                    saved_count += 1
                    logger.info(f"保存成功: {company.company_name}")
                    
            except Exception as e:
                logger.error(f"企業情報保存エラー: {e}")
                continue
        
        logger.info(f"{saved_count} 件の企業情報を保存しました")
        return saved_count
    
    def bulk_update_status(self, status_updates: List[Dict[str, Any]]) -> List[bool]:
        """
        営業ステータスを一括更新する
        
        Args:
            status_updates: ステータス更新情報のリスト
            
        Returns:
            更新結果のリスト
        """
        results = []
        
        for update in status_updates:
            try:
                # SalesStatusモデルでバリデーション
                status = SalesStatus(
                    company_id=update["company_id"],
                    status=update["status"],
                    memo=update.get("memo"),
                    contact_person=update.get("contact_person"),
                    updated_at=datetime.now()
                )
                
                # 更新
                result = self.sheets_service.update_sales_status(
                    status.company_id,
                    status.model_dump(exclude_none=True)
                )
                results.append(result)
                
                if result:
                    logger.info(f"ステータス更新成功: 企業ID {status.company_id}")
                    
            except Exception as e:
                logger.error(f"ステータス更新エラー: {e}")
                results.append(False)
        
        return results
    
    def record_collection_log(self, log_data: Dict[str, Any]) -> bool:
        """
        収集ログを記録する
        
        Args:
            log_data: ログ情報
            
        Returns:
            成功時True
        """
        try:
            # ログデータを整形
            log_entry = {
                "execution_date": datetime.now().isoformat(),
                "keyword": log_data.get("keyword", ""),
                "target_sites": log_data.get("target_sites", ""),
                "collected_count": log_data.get("collected_count", 0),
                "success_count": log_data.get("success_count", 0),
                "error_count": log_data.get("error_count", 0),
                "status": log_data.get("status", "完了"),
                "error_details": log_data.get("error_details", "")
            }
            
            # CollectionLogsシートに追加
            return self.sheets_service.add_collection_log(log_entry)
            
        except Exception as e:
            logger.error(f"ログ記録エラー: {e}")
            return False 