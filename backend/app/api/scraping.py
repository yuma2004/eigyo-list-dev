"""
スクレイピング実行 API
"""
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from datetime import datetime
import asyncio

from app.models.responses import (
    ScrapingConfigRequest,
    ScrapingResponse,
    ScrapingStatusResponse,
    BaseResponse
)
from app.services.company_service import CompanyService
from app.services.google_sheets import GoogleSheetsService
from app.services.scraping_engine import ScrapingEngine

router = APIRouter()

# グローバル状態管理（実際の実装では Redis などを使用）
scraping_status = {
    "status": "idle",  # idle, running, completed, error
    "progress": 0,
    "collected": 0,
    "total": None,
    "current_url": None,
    "start_time": None,
    "end_time": None,
    "error_message": None
}

# サービス初期化
google_sheets_service = GoogleSheetsService()
company_service = CompanyService(google_sheets_service)
scraping_engine = ScrapingEngine()


async def run_scraping_task(config: ScrapingConfigRequest):
    """
    バックグラウンドでスクレイピングを実行
    
    Args:
        config: スクレイピング設定
    """
    global scraping_status
    
    try:
        # ステータス初期化
        scraping_status.update({
            "status": "running",
            "progress": 0,
            "collected": 0,
            "total": None,
            "current_url": None,
            "start_time": datetime.now(),
            "end_time": None,
            "error_message": None
        })
        
        # スクレイピング実行
        result = await company_service.collect_companies(
            keywords=config.keywords,
            target_sites=config.target_sites,
            max_pages=config.max_pages,
            filters={
                "prefecture": config.prefecture,
                "industry": config.industry
            },
            progress_callback=update_progress
        )
        
        # 完了ステータス更新
        scraping_status.update({
            "status": "completed",
            "progress": 100,
            "collected": result.get("collected", 0),
            "end_time": datetime.now()
        })
        
    except Exception as e:
        # エラーステータス更新
        scraping_status.update({
            "status": "error",
            "error_message": str(e),
            "end_time": datetime.now()
        })


def update_progress(current: int, total: int, current_url: str = None):
    """
    進捗更新コールバック
    
    Args:
        current: 現在の処理数
        total: 総処理数
        current_url: 現在処理中のURL
    """
    global scraping_status
    
    progress = int((current / total) * 100) if total > 0 else 0
    
    scraping_status.update({
        "progress": progress,
        "collected": current,
        "total": total,
        "current_url": current_url
    })


@router.post("/start", response_model=ScrapingResponse)
async def start_scraping(
    config: ScrapingConfigRequest,
    background_tasks: BackgroundTasks
) -> ScrapingResponse:
    """
    スクレイピング開始
    
    Args:
        config: スクレイピング設定
        background_tasks: バックグラウンドタスク
        
    Returns:
        実行結果
    """
    global scraping_status
    
    # 実行中チェック
    if scraping_status["status"] == "running":
        raise HTTPException(
            status_code=409,
            detail="Scraping is already running"
        )
    
    try:
        # バックグラウンドタスクとして実行
        background_tasks.add_task(run_scraping_task, config)
        
        return ScrapingResponse(
            result={
                "collected": 0,
                "errors": 0,
                "skipped": 0,
                "execution_time": None,
                "details": {"status": "started"}
            },
            message="Scraping started successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status", response_model=ScrapingStatusResponse)
async def get_scraping_status() -> ScrapingStatusResponse:
    """
    スクレイピング状況取得
    
    Returns:
        現在の実行状況
    """
    global scraping_status
    
    # 実行時間計算
    estimated_remaining = None
    if (scraping_status["status"] == "running" and 
        scraping_status["start_time"] and 
        scraping_status["progress"] > 0):
        
        elapsed = (datetime.now() - scraping_status["start_time"]).total_seconds()
        remaining_progress = 100 - scraping_status["progress"]
        estimated_remaining = int((elapsed / scraping_status["progress"]) * remaining_progress)
    
    return ScrapingStatusResponse(
        status=scraping_status["status"],
        progress=scraping_status["progress"],
        collected=scraping_status["collected"],
        total=scraping_status["total"],
        current_url=scraping_status["current_url"],
        estimated_remaining=estimated_remaining,
        message="Status retrieved successfully"
    )


@router.post("/stop", response_model=BaseResponse)
async def stop_scraping() -> BaseResponse:
    """
    スクレイピング停止
    
    Returns:
        停止結果
    """
    global scraping_status
    
    if scraping_status["status"] != "running":
        raise HTTPException(
            status_code=400,
            detail="No scraping is currently running"
        )
    
    try:
        # スクレイピングエンジンに停止指示
        await scraping_engine.stop()
        
        # ステータス更新
        scraping_status.update({
            "status": "idle",
            "end_time": datetime.now()
        })
        
        return BaseResponse(
            message="Scraping stopped successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_scraping_history(
    limit: int = 10,
    offset: int = 0
):
    """
    スクレイピング履歴取得
    
    Args:
        limit: 取得件数
        offset: オフセット
        
    Returns:
        実行履歴
    """
    try:
        # Google Sheets から履歴取得
        history = await google_sheets_service.get_collection_logs(
            limit=limit,
            offset=offset
        )
        
        return {
            "success": True,
            "history": history,
            "count": len(history),
            "message": "History retrieved successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config")
async def get_scraping_config():
    """
    スクレイピング設定取得
    
    Returns:
        現在の設定
    """
    try:
        config = await scraping_engine.get_config()
        
        return {
            "success": True,
            "config": config,
            "message": "Config retrieved successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/config")
async def update_scraping_config(config: Dict[str, Any]):
    """
    スクレイピング設定更新
    
    Args:
        config: 新しい設定
        
    Returns:
        更新結果
    """
    try:
        await scraping_engine.update_config(config)
        
        return {
            "success": True,
            "message": "Config updated successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))