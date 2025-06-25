"""
企業情報 CRUD API
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from datetime import datetime

from app.models.company import Company
from app.models.responses import (
    CompanyResponse,
    CompaniesListResponse,
    CompanyCreateResponse,
    CompanyUpdateResponse,
    CompanyDeleteResponse,
    ErrorResponse
)
from app.services.company_service import CompanyService
from app.services.google_sheets import GoogleSheetsService

router = APIRouter()

# サービス依存関係の初期化
def get_company_service():
    """CompanyService の依存関係注入"""
    google_sheets_service = GoogleSheetsService()
    return CompanyService(google_sheets_service)

company_service = get_company_service()


@router.get("/", response_model=CompaniesListResponse)
async def get_companies(
    page: int = Query(1, ge=1, description="ページ番号"),
    page_size: int = Query(100, ge=1, le=1000, description="ページサイズ"),
    status: Optional[str] = Query(None, description="営業ステータスフィルター"),
    prefecture: Optional[str] = Query(None, description="都道府県フィルター"),
    industry: Optional[str] = Query(None, description="業界フィルター"),
    keyword: Optional[str] = Query(None, description="キーワード検索"),
) -> CompaniesListResponse:
    """
    企業一覧取得
    
    Args:
        page: ページ番号
        page_size: ページサイズ
        status: 営業ステータスフィルター
        prefecture: 都道府県フィルター
        industry: 業界フィルター
        keyword: キーワード検索
        
    Returns:
        企業一覧
    """
    try:
        # フィルター条件の構築
        filters = {}
        if status:
            filters["status"] = status
        if prefecture:
            filters["prefecture"] = prefecture
        if industry:
            filters["industry"] = industry
        if keyword:
            filters["keyword"] = keyword
            
        # 企業一覧取得
        companies = await company_service.get_companies(
            page=page,
            page_size=page_size,
            filters=filters
        )
        
        # 総件数取得（簡略化）
        total = len(companies)  # 実際には別途カウントクエリが必要
        has_next = len(companies) == page_size
        
        return CompaniesListResponse(
            companies=companies,
            total=total,
            page=page,
            page_size=page_size,
            has_next=has_next,
            message="Companies retrieved successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: int) -> CompanyResponse:
    """
    企業詳細取得
    
    Args:
        company_id: 企業ID
        
    Returns:
        企業詳細情報
    """
    try:
        company = await company_service.get_company_by_id(company_id)
        
        if not company:
            raise HTTPException(
                status_code=404,
                detail="Company not found"
            )
            
        return CompanyResponse(
            company=company,
            message="Company retrieved successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=CompanyCreateResponse, status_code=201)
async def create_company(company_data: Company) -> CompanyCreateResponse:
    """
    企業作成
    
    Args:
        company_data: 企業情報
        
    Returns:
        作成結果
    """
    try:
        # 作成日時設定
        company_data.created_at = datetime.now()
        company_data.updated_at = datetime.now()
        
        # 企業追加
        company_id = await company_service.add_company(company_data)
        
        return CompanyCreateResponse(
            company_id=company_id,
            message="Company created successfully"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{company_id}", response_model=CompanyUpdateResponse)
async def update_company(
    company_id: int,
    company_data: Company
) -> CompanyUpdateResponse:
    """
    企業更新
    
    Args:
        company_id: 企業ID
        company_data: 更新する企業情報
        
    Returns:
        更新結果
    """
    try:
        # 更新日時設定
        company_data.updated_at = datetime.now()
        company_data.id = company_id
        
        # 企業更新
        success = await company_service.update_company(company_data)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Company not found"
            )
            
        return CompanyUpdateResponse(
            message="Company updated successfully"
        )
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{company_id}", response_model=CompanyDeleteResponse)
async def delete_company(company_id: int) -> CompanyDeleteResponse:
    """
    企業削除
    
    Args:
        company_id: 企業ID
        
    Returns:
        削除結果
    """
    try:
        success = await company_service.delete_company(company_id)
        
        if not success:
            raise HTTPException(
                status_code=404,
                detail="Company not found"
            )
            
        return CompanyDeleteResponse(
            message="Company deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{company_id}/duplicate-check")
async def check_duplicate(company_id: int):
    """
    重複チェック
    
    Args:
        company_id: 企業ID
        
    Returns:
        重複チェック結果
    """
    try:
        company = await company_service.get_company_by_id(company_id)
        
        if not company:
            raise HTTPException(
                status_code=404,
                detail="Company not found"
            )
            
        duplicates = await company_service.find_duplicates(company)
        
        return {
            "success": True,
            "duplicates": duplicates,
            "count": len(duplicates),
            "message": "Duplicate check completed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))