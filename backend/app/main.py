"""
営業リスト作成ツール FastAPI メインアプリケーション
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from datetime import datetime
import logging
from typing import Dict, Any

from app.api import companies, scraping, sales, export

# ロガー設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI アプリケーション初期化
app = FastAPI(
    title="営業リスト作成ツール API",
    description="ASPおよび広告代理店への営業活動を効率化するツールのAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # フロントエンド URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# エラーハンドラー
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """バリデーションエラーハンドラー"""
    logger.error(f"Validation error: {exc}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
            "timestamp": datetime.now().isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """一般的なエラーハンドラー"""
    logger.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )


# ルーターの登録
app.include_router(
    companies.router,
    prefix="/api/companies",
    tags=["companies"],
    responses={404: {"description": "Not found"}}
)

app.include_router(
    scraping.router,
    prefix="/api/scraping",
    tags=["scraping"],
    responses={404: {"description": "Not found"}}
)

app.include_router(
    sales.router,
    prefix="/api/sales",
    tags=["sales"],
    responses={404: {"description": "Not found"}}
)

app.include_router(
    export.router,
    prefix="/api/export",
    tags=["export"],
    responses={404: {"description": "Not found"}}
)


# ヘルスチェックエンドポイント
@app.get("/health", tags=["health"])
async def health_check() -> Dict[str, Any]:
    """
    ヘルスチェック
    
    Returns:
        アプリケーションの健康状態
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


@app.get("/api/info", tags=["info"])
async def api_info() -> Dict[str, Any]:
    """
    API 情報取得
    
    Returns:
        API の基本情報
    """
    return {
        "title": "営業リスト作成ツール API",
        "version": "1.0.0",
        "description": "ASPおよび広告代理店への営業活動を効率化するツールのAPI",
        "endpoints": {
            "companies": "/api/companies",
            "scraping": "/api/scraping", 
            "sales": "/api/sales",
            "export": "/api/export",
            "docs": "/docs",
            "health": "/health"
        }
    }


# 起動時の処理
@app.on_event("startup")
async def startup_event():
    """アプリケーション起動時の処理"""
    logger.info("営業リスト作成ツール API が起動しました")


@app.on_event("shutdown")
async def shutdown_event():
    """アプリケーション終了時の処理"""
    logger.info("営業リスト作成ツール API が終了しました")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )