"""
営業ステータス管理 API
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime

from app.models.company import SalesStatus
from app.models.responses import (
    SalesStatusResponse,
    SalesStatusUpdateRequest,
    SalesStatusUpdateResponse,
    SalesDashboardResponse,
    BaseResponse
)
from app.services.google_sheets import GoogleSheetsService

router = APIRouter()

# サービス初期化
google_sheets_service = GoogleSheetsService()


@router.get("/{company_id}", response_model=SalesStatusResponse)
async def get_sales_status(company_id: int) -> SalesStatusResponse:
    """
    営業ステータス取得
    
    Args:
        company_id: 企業ID
        
    Returns:
        営業ステータス情報
    """
    try:
        status = await google_sheets_service.get_sales_status(company_id)
        
        if not status:
            raise HTTPException(
                status_code=404,
                detail="Sales status not found"
            )
            
        return SalesStatusResponse(
            status=status,
            message="Sales status retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{company_id}", response_model=SalesStatusUpdateResponse)
async def update_sales_status(
    company_id: int,
    status_data: SalesStatusUpdateRequest
) -> SalesStatusUpdateResponse:
    """
    営業ステータス更新
    
    Args:
        company_id: 企業ID
        status_data: 更新するステータス情報
        
    Returns:
        更新結果
    """
    try:
        # SalesStatus オブジェクト作成
        sales_status = SalesStatus(
            company_id=company_id,
            status=status_data.status,
            memo=status_data.memo,
            contact_person=status_data.contact_person,
            next_action=status_data.next_action,
            updated_at=datetime.now()
        )
        
        # ステータス更新
        success = await google_sheets_service.update_sales_status(sales_status)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Company not found"
            )
            
        return SalesStatusUpdateResponse(
            message="Sales status updated successfully"
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[SalesStatusResponse])
async def get_sales_statuses(
    status: Optional[str] = Query(None, description="ステータスフィルター"),
    contact_person: Optional[str] = Query(None, description="担当者フィルター"),
    limit: int = Query(100, ge=1, le=1000, description="取得件数"),
    offset: int = Query(0, ge=0, description="オフセット")
) -> List[SalesStatusResponse]:
    """
    営業ステータス一覧取得
    
    Args:
        status: ステータスフィルター
        contact_person: 担当者フィルター
        limit: 取得件数
        offset: オフセット
        
    Returns:
        営業ステータス一覧
    """
    try:
        filters = {}
        if status:
            filters["status"] = status
        if contact_person:
            filters["contact_person"] = contact_person
            
        statuses = await google_sheets_service.get_sales_statuses(
            filters=filters,
            limit=limit,
            offset=offset
        )
        
        return [
            SalesStatusResponse(
                status=status_item,
                message="Sales status retrieved successfully"
            )
            for status_item in statuses
        ]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard", response_model=SalesDashboardResponse)
async def get_sales_dashboard() -> SalesDashboardResponse:
    """
    営業ダッシュボード取得
    
    Returns:
        ダッシュボード情報
    """
    try:
        # ステータス別集計取得
        summary = await google_sheets_service.get_sales_summary()
        
        # 総企業数
        total_companies = sum(summary.values())
        
        # 最近の更新履歴
        recent_updates = await google_sheets_service.get_recent_sales_updates(limit=10)
        
        # 成約率計算
        conversion_rate = 0.0
        if total_companies > 0:
            converted = summary.get("成約", 0)
            approached = sum([
                summary.get("アプローチ中", 0),
                summary.get("商談中", 0),
                summary.get("成約", 0),
                summary.get("見送り", 0)
            ])
            if approached > 0:
                conversion_rate = (converted / approached) * 100
        
        return SalesDashboardResponse(
            summary=summary,
            total_companies=total_companies,
            recent_updates=recent_updates,
            conversion_rate=round(conversion_rate, 2),
            message="Dashboard data retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{company_id}/follow-up", response_model=BaseResponse)
async def schedule_follow_up(
    company_id: int,
    follow_up_data: Dict[str, Any]
) -> BaseResponse:
    """
    フォローアップ予定設定
    
    Args:
        company_id: 企業ID
        follow_up_data: フォローアップ情報
        
    Returns:
        設定結果
    """
    try:
        # 現在のステータス取得
        current_status = await google_sheets_service.get_sales_status(company_id)
        
        if not current_status:
            raise HTTPException(
                status_code=404,
                detail="Company not found"
            )
        
        # フォローアップ情報更新
        current_status.next_action = follow_up_data.get("next_action")
        current_status.updated_at = datetime.now()
        
        # ステータス更新
        success = await google_sheets_service.update_sales_status(current_status)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to schedule follow-up"
            )
            
        return BaseResponse(
            message="Follow-up scheduled successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/follow-ups/upcoming")
async def get_upcoming_follow_ups(
    days: int = Query(7, ge=1, le=30, description="今後何日分")
):
    """
    今後のフォローアップ予定取得
    
    Args:
        days: 取得する日数
        
    Returns:
        フォローアップ予定一覧
    """
    try:
        follow_ups = await google_sheets_service.get_upcoming_follow_ups(days)
        
        return {
            "success": True,
            "follow_ups": follow_ups,
            "count": len(follow_ups),
            "message": "Upcoming follow-ups retrieved successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/conversion")
async def get_conversion_analytics(
    period: str = Query("monthly", regex="^(weekly|monthly|yearly)$")
):
    """
    成約率分析取得
    
    Args:
        period: 分析期間
        
    Returns:
        成約率分析データ
    """
    try:
        analytics = await google_sheets_service.get_conversion_analytics(period)
        
        return {
            "success": True,
            "analytics": analytics,
            "period": period,
            "message": "Conversion analytics retrieved successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))