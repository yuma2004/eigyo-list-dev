"""
企業情報モデル
"""
import re
from typing import Optional, Dict, Any, ClassVar
from datetime import datetime
from pydantic import BaseModel, Field, field_validator, ConfigDict, field_serializer


class Company(BaseModel):
    """企業情報モデル"""
    
    model_config = ConfigDict()
    
    id: Optional[int] = None
    company_name: str = Field(..., min_length=1, description="会社名")
    url: str = Field(..., description="企業サイトURL")
    address: Optional[str] = Field(None, description="住所")
    postal_code: Optional[str] = Field(None, description="郵便番号")
    prefecture: Optional[str] = Field(None, description="都道府県")
    city: Optional[str] = Field(None, description="市区町村")
    address_detail: Optional[str] = Field(None, description="住所詳細")
    tel: Optional[str] = Field(None, description="電話番号")
    fax: Optional[str] = Field(None, description="FAX番号")
    representative: Optional[str] = Field(None, description="代表者名")
    business_content: Optional[str] = Field(None, description="事業内容")
    established_date: Optional[str] = Field(None, description="設立年月日")
    capital: Optional[str] = Field(None, description="資本金")
    contact_url: Optional[str] = Field(None, description="問い合わせフォームURL")
    source_url: Optional[str] = Field(None, description="情報収集元URL")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    @field_validator("company_name")
    @classmethod
    def validate_company_name(cls, v):
        """会社名のバリデーション"""
        if not v or not v.strip():
            raise ValueError("company_name cannot be empty")
        return v.strip()
    
    @field_validator("url")
    @classmethod
    def validate_url(cls, v):
        """URLのバリデーション"""
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        if not url_pattern.match(v):
            raise ValueError(f"Invalid URL format: {v}")
        return v
    
    def parse_address(self) -> Dict[str, str]:
        """
        住所を構成要素に分解する
        
        Returns:
            分解された住所情報
        """
        if not self.address:
            return {
                "postal_code": "",
                "prefecture": "",
                "city": "",
                "address_detail": ""
            }
        
        parsed = {
            "postal_code": "",
            "prefecture": "",
            "city": "",
            "address_detail": ""
        }
        
        # 郵便番号の抽出
        postal_match = re.search(r'〒?(\d{3}-?\d{4})', self.address)
        if postal_match:
            parsed["postal_code"] = postal_match.group(1)
            address_without_postal = self.address.replace(postal_match.group(0), "").strip()
        else:
            address_without_postal = self.address
        
        # 都道府県の抽出
        prefectures = [
            "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
            "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
            "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
            "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
            "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
            "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
            "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
        ]
        
        for pref in prefectures:
            if pref in address_without_postal:
                parsed["prefecture"] = pref
                remaining = address_without_postal.split(pref, 1)[1].strip()
                
                # 市区町村の抽出（簡易版）
                city_match = re.match(r'^([^市区町村]+(?:市|区|町|村))', remaining)
                if city_match:
                    parsed["city"] = city_match.group(1)
                    parsed["address_detail"] = remaining[len(city_match.group(1)):].strip()
                else:
                    parsed["address_detail"] = remaining
                break
        
        return parsed

    @field_serializer('created_at', 'updated_at')
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        """日時フィールドのシリアライズ"""
        return dt.isoformat() if dt else None


class SalesStatus(BaseModel):
    """営業ステータスモデル"""
    
    model_config = ConfigDict()
    
    # クラス変数として定義
    VALID_STATUSES: ClassVar[list[str]] = ["未着手", "アプローチ中", "商談中", "成約", "見送り"]
    
    company_id: int = Field(..., description="企業ID")
    status: str = Field(..., description="営業ステータス")
    memo: Optional[str] = Field(None, description="メモ")
    contact_person: Optional[str] = Field(None, description="担当者名")
    last_contact_date: Optional[datetime] = Field(None, description="最終コンタクト日")
    next_action: Optional[str] = Field(None, description="次回アクション予定")
    updated_at: Optional[datetime] = None
    
    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        """ステータスのバリデーション"""
        if v not in cls.VALID_STATUSES:
            raise ValueError(f"Invalid status: {v}. Must be one of {cls.VALID_STATUSES}")
        return v 

    @field_serializer('last_contact_date', 'updated_at')
    def serialize_datetime(self, dt: Optional[datetime]) -> Optional[str]:
        """日時フィールドのシリアライズ"""
        return dt.isoformat() if dt else None 