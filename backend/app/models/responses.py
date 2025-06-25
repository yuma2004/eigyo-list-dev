"""
API レスポンス用モデル
"""
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field

from app.models.company import Company, SalesStatus


class BaseResponse(BaseModel):
    """基本レスポンスモデル"""
    success: bool = True
    message: str = ""
    timestamp: datetime = Field(default_factory=datetime.now)


class ErrorResponse(BaseResponse):
    """エラーレスポンスモデル"""
    success: bool = False
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class CompanyResponse(BaseResponse):
    """企業詳細レスポンス"""
    company: Company


class CompaniesListResponse(BaseResponse):
    """企業リストレスポンス"""
    companies: List[Company]
    total: int = 0
    page: int = 1
    page_size: int = 100
    has_next: bool = False


class CompanyCreateResponse(BaseResponse):
    """企業作成レスポンス"""
    company_id: int
    message: str = "Company created successfully"


class CompanyUpdateResponse(BaseResponse):
    """企業更新レスポンス"""
    message: str = "Company updated successfully"


class CompanyDeleteResponse(BaseResponse):
    """企業削除レスポンス"""
    message: str = "Company deleted successfully"


class ScrapingConfigRequest(BaseModel):
    """スクレイピング設定リクエスト"""
    keywords: List[str] = Field(..., min_items=1, description="検索キーワード")
    target_sites: List[str] = Field(default=["job_sites"], description="対象サイト")
    max_pages: int = Field(default=10, ge=1, le=100, description="最大ページ数")
    prefecture: Optional[str] = Field(None, description="対象都道府県")
    industry: Optional[str] = Field(None, description="対象業界")


class ScrapingResult(BaseModel):
    """スクレイピング結果"""
    collected: int = 0
    errors: int = 0
    skipped: int = 0
    execution_time: Optional[float] = None
    details: Optional[Dict[str, Any]] = None


class ScrapingResponse(BaseResponse):
    """スクレイピング実行レスポンス"""
    result: ScrapingResult
    message: str = "Scraping completed successfully"


class ScrapingStatusResponse(BaseResponse):
    """スクレイピング状況レスポンス"""
    status: str  # "idle", "running", "completed", "error"
    progress: int = 0  # 0-100
    collected: int = 0
    total: Optional[int] = None
    current_url: Optional[str] = None
    estimated_remaining: Optional[int] = None


class SalesStatusResponse(BaseResponse):
    """営業ステータスレスポンス"""
    status: SalesStatus


class SalesStatusUpdateRequest(BaseModel):
    """営業ステータス更新リクエスト"""
    status: str = Field(..., description="営業ステータス")
    memo: Optional[str] = Field(None, description="メモ")
    contact_person: Optional[str] = Field(None, description="担当者名")
    next_action: Optional[str] = Field(None, description="次回アクション予定")


class SalesStatusUpdateResponse(BaseResponse):
    """営業ステータス更新レスポンス"""
    message: str = "Sales status updated successfully"


class SalesDashboardResponse(BaseResponse):
    """営業ダッシュボードレスポンス"""
    summary: Dict[str, int]  # ステータス別集計
    total_companies: int
    recent_updates: List[Dict[str, Any]]
    conversion_rate: float = 0.0


class ExportRequest(BaseModel):
    """エクスポートリクエスト"""
    format: str = Field("csv", regex="^(csv|excel)$", description="出力形式")
    status: Optional[str] = Field(None, description="ステータスフィルター")
    prefecture: Optional[str] = Field(None, description="都道府県フィルター")
    industry: Optional[str] = Field(None, description="業界フィルター")
    date_from: Optional[datetime] = Field(None, description="作成日開始")
    date_to: Optional[datetime] = Field(None, description="作成日終了")
    include_sales_status: bool = Field(True, description="営業ステータス含める")


class HealthCheckResponse(BaseModel):
    """ヘルスチェックレスポンス"""
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = "1.0.0"
    uptime: Optional[float] = None


class APIInfoResponse(BaseModel):
    """API情報レスポンス"""
    title: str
    version: str
    description: str
    endpoints: Dict[str, str]