"""
テストデータフィクスチャ
統合テストで使用するテストデータの生成と管理
"""

import pytest
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from faker import Faker
from factory import Factory, Sequence, LazyAttribute, SubFactory, fuzzy
from factory.alchemy import SQLAlchemyModelFactory
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.database import Company, SalesStatus
from app.core.database import get_db_session


fake = Faker('ja_JP')  # 日本語データ生成


class CompanyFactory(SQLAlchemyModelFactory):
    """企業データファクトリー"""
    
    class Meta:
        model = Company
        sqlalchemy_session_persistence = "commit"
    
    id = Sequence(lambda n: n + 1)
    company_name = LazyAttribute(lambda obj: fake.company())
    url = LazyAttribute(lambda obj: f"https://{fake.domain_name()}")
    address = LazyAttribute(lambda obj: fake.address())
    tel = LazyAttribute(lambda obj: fake.phone_number())
    fax = LazyAttribute(lambda obj: fake.phone_number())
    representative = LazyAttribute(lambda obj: fake.name())
    business_content = LazyAttribute(lambda obj: fake.catch_phrase())
    established_date = LazyAttribute(lambda obj: fake.date())
    capital = LazyAttribute(lambda obj: f"{fake.random_int(min=100, max=50000)}万円")
    contact_url = LazyAttribute(lambda obj: f"{obj.url}/contact")
    prefecture = fuzzy.FuzzyChoice([
        '東京都', '大阪府', '愛知県', '神奈川県', '福岡県',
        '北海道', '宮城県', '埼玉県', '千葉県', '京都府',
        '兵庫県', '広島県', '静岡県', '茨城県', '栃木県'
    ])
    created_at = LazyAttribute(lambda obj: fake.date_time_this_year())
    updated_at = LazyAttribute(lambda obj: fake.date_time_this_month())


class SalesStatusFactory(SQLAlchemyModelFactory):
    """営業ステータスファクトリー"""
    
    class Meta:
        model = SalesStatus
        sqlalchemy_session_persistence = "commit"
    
    company_id = SubFactory(CompanyFactory)
    status = fuzzy.FuzzyChoice([
        '未着手', 'アプローチ中', '商談中', '成約', '見送り'
    ])
    contact_person = LazyAttribute(lambda obj: fake.name())
    last_contact_date = LazyAttribute(lambda obj: fake.date_this_month())
    next_action = LazyAttribute(lambda obj: fake.sentence())
    memo = LazyAttribute(lambda obj: fake.text(max_nb_chars=200))
    created_at = LazyAttribute(lambda obj: fake.date_time_this_year())
    updated_at = LazyAttribute(lambda obj: fake.date_time_this_month())


@pytest.fixture
async def db_session():
    """テスト用データベースセッション"""
    async with get_db_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
def company_data():
    """基本的な企業データ"""
    return {
        "company_name": "テスト株式会社",
        "url": "https://test-company.com",
        "address": "東京都渋谷区テスト1-1-1",
        "tel": "03-1234-5678",
        "fax": "03-1234-5679",
        "representative": "テスト太郎",
        "business_content": "テストサービスの開発・運営",
        "established_date": "2020-01-01",
        "capital": "1000万円",
        "contact_url": "https://test-company.com/contact",
        "prefecture": "東京都"
    }


@pytest.fixture
def sales_status_data():
    """基本的な営業ステータスデータ"""
    return {
        "status": "アプローチ中",
        "contact_person": "営業太郎",
        "last_contact_date": "2024-01-15",
        "next_action": "商談設定",
        "memo": "初回アプローチ完了。反応良好。"
    }


@pytest.fixture
def scraping_config_data():
    """基本的なスクレイピング設定データ"""
    return {
        "keywords": ["IT企業", "広告代理店"],
        "target_sites": ["job_sites"],
        "max_pages": 10,
        "prefecture": "東京都",
        "industry": "IT"
    }


@pytest.fixture
async def sample_companies(db_session: AsyncSession) -> List[Company]:
    """サンプル企業データセット"""
    companies = []
    
    # IT企業データ
    it_companies = [
        {
            "company_name": "株式会社テックソリューション",
            "url": "https://tech-solution.com",
            "address": "東京都港区六本木1-1-1",
            "tel": "03-0001-0001",
            "representative": "田中一郎",
            "business_content": "Webシステム開発、モバイルアプリ開発",
            "prefecture": "東京都"
        },
        {
            "company_name": "株式会社データアナリティクス",
            "url": "https://data-analytics.com",
            "address": "東京都新宿区西新宿2-2-2",
            "tel": "03-0002-0002",
            "representative": "佐藤花子",
            "business_content": "ビッグデータ解析、AI・機械学習",
            "prefecture": "東京都"
        },
        {
            "company_name": "株式会社クラウドサービス",
            "url": "https://cloud-service.com",
            "address": "大阪府大阪市北区梅田3-3-3",
            "tel": "06-0003-0003",
            "representative": "鈴木次郎",
            "business_content": "クラウドインフラ、SaaS開発",
            "prefecture": "大阪府"
        }
    ]
    
    for company_data in it_companies:
        company = Company(**company_data)
        db_session.add(company)
        companies.append(company)
    
    # 広告代理店データ
    ad_agencies = [
        {
            "company_name": "株式会社アドバタイジング",
            "url": "https://advertising.com",
            "address": "東京都渋谷区渋谷4-4-4",
            "tel": "03-0004-0004",
            "representative": "高橋三郎",
            "business_content": "デジタル広告、マーケティング戦略",
            "prefecture": "東京都"
        },
        {
            "company_name": "株式会社メディアプランニング",
            "url": "https://media-planning.com",
            "address": "愛知県名古屋市中区栄5-5-5",
            "tel": "052-0005-0005",
            "representative": "山田美咲",
            "business_content": "メディア企画、広告制作",
            "prefecture": "愛知県"
        }
    ]
    
    for company_data in ad_agencies:
        company = Company(**company_data)
        db_session.add(company)
        companies.append(company)
    
    await db_session.commit()
    
    # リフレッシュしてIDを取得
    for company in companies:
        await db_session.refresh(company)
    
    return companies


@pytest.fixture
async def sample_sales_statuses(db_session: AsyncSession, sample_companies: List[Company]) -> List[SalesStatus]:
    """サンプル営業ステータスデータセット"""
    statuses = []
    
    status_data = [
        {
            "company_id": sample_companies[0].id,
            "status": "アプローチ中",
            "contact_person": "営業太郎",
            "last_contact_date": "2024-01-10",
            "next_action": "商談設定",
            "memo": "Webサイトからの問い合わせ。システム開発案件で関心あり。"
        },
        {
            "company_id": sample_companies[1].id,
            "status": "商談中",
            "contact_person": "営業花子",
            "last_contact_date": "2024-01-12",
            "next_action": "提案書提出",
            "memo": "データ分析ツールの導入を検討中。予算感も良い。"
        },
        {
            "company_id": sample_companies[2].id,
            "status": "成約",
            "contact_person": "営業次郎",
            "last_contact_date": "2024-01-08",
            "next_action": "プロジェクト開始準備",
            "memo": "クラウド移行プロジェクト契約締結完了。"
        },
        {
            "company_id": sample_companies[3].id,
            "status": "未着手",
            "contact_person": "",
            "last_contact_date": None,
            "next_action": "初回アプローチ",
            "memo": ""
        },
        {
            "company_id": sample_companies[4].id,
            "status": "見送り",
            "contact_person": "営業三郎",
            "last_contact_date": "2024-01-05",
            "next_action": "",
            "memo": "予算の都合で今期は見送り。来期再検討予定。"
        }
    ]
    
    for status_info in status_data:
        sales_status = SalesStatus(**status_info)
        db_session.add(sales_status)
        statuses.append(sales_status)
    
    await db_session.commit()
    
    return statuses


@pytest.fixture
def large_dataset_companies() -> List[Dict[str, Any]]:
    """大量データテスト用企業データセット"""
    companies = []
    
    prefectures = ['東京都', '大阪府', '愛知県', '神奈川県', '福岡県']
    industries = ['IT', '広告', 'コンサル', '製造業', '金融']
    statuses = ['未着手', 'アプローチ中', '商談中', '成約', '見送り']
    
    for i in range(1000):
        company = {
            "company_name": f"株式会社テスト{i:04d}",
            "url": f"https://test{i:04d}.com",
            "address": f"{prefectures[i % len(prefectures)]}テスト区テスト{i}-{i}-{i}",
            "tel": f"0{(i % 9) + 1}-{i:04d}-{(i*2) % 10000:04d}",
            "representative": f"代表者{i}",
            "business_content": f"{industries[i % len(industries)]}事業{i}",
            "prefecture": prefectures[i % len(prefectures)],
            "sales_status": {
                "status": statuses[i % len(statuses)],
                "contact_person": f"担当者{i}" if i % 5 != 0 else "",
                "last_contact_date": (datetime.now() - timedelta(days=i % 30)).strftime('%Y-%m-%d') if i % 3 != 0 else None,
                "memo": f"テストメモ{i}"
            }
        }
        companies.append(company)
    
    return companies


@pytest.fixture
def mock_scraping_responses():
    """スクレイピング用モックレスポンス"""
    return [
        {
            "url": "https://example-job-site.com/company/1",
            "html": """
            <html>
                <head><title>株式会社モック企業1</title></head>
                <body>
                    <div class="company-profile">
                        <h1>株式会社モック企業1</h1>
                        <div class="info">
                            <p>所在地: 東京都千代田区丸の内1-1-1</p>
                            <p>電話: 03-1111-1111</p>
                            <p>設立: 2015年4月</p>
                            <p>事業内容: ITコンサルティング、システム開発</p>
                        </div>
                        <div class="contact">
                            <a href="/contact">お問い合わせ</a>
                        </div>
                    </div>
                </body>
            </html>
            """,
            "expected_data": {
                "company_name": "株式会社モック企業1",
                "url": "https://example-job-site.com/company/1",
                "address": "東京都千代田区丸の内1-1-1",
                "tel": "03-1111-1111",
                "business_content": "ITコンサルティング、システム開発",
                "contact_url": "https://example-job-site.com/contact"
            }
        },
        {
            "url": "https://example-job-site.com/company/2",
            "html": """
            <html>
                <head><title>株式会社モック企業2</title></head>
                <body>
                    <div class="company-info">
                        <h2>株式会社モック企業2</h2>
                        <table>
                            <tr><td>住所</td><td>大阪府大阪市中央区本町2-2-2</td></tr>
                            <tr><td>TEL</td><td>06-2222-2222</td></tr>
                            <tr><td>FAX</td><td>06-2222-2223</td></tr>
                            <tr><td>代表者</td><td>モック太郎</td></tr>
                            <tr><td>設立</td><td>2018年7月</td></tr>
                            <tr><td>資本金</td><td>3000万円</td></tr>
                        </table>
                        <p>デジタルマーケティング、広告運用代行</p>
                    </div>
                </body>
            </html>
            """,
            "expected_data": {
                "company_name": "株式会社モック企業2",
                "url": "https://example-job-site.com/company/2",
                "address": "大阪府大阪市中央区本町2-2-2",
                "tel": "06-2222-2222",
                "fax": "06-2222-2223",
                "representative": "モック太郎",
                "business_content": "デジタルマーケティング、広告運用代行",
                "capital": "3000万円"
            }
        }
    ]


@pytest.fixture
def mock_api_responses():
    """API統合テスト用モックレスポンス"""
    return {
        "companies_list": {
            "companies": [
                {
                    "id": 1,
                    "company_name": "APIテスト企業1",
                    "url": "https://api-test1.com",
                    "prefecture": "東京都",
                    "representative": "API太郎",
                    "business_content": "APIテスト事業"
                },
                {
                    "id": 2,
                    "company_name": "APIテスト企業2",
                    "url": "https://api-test2.com",
                    "prefecture": "大阪府",
                    "representative": "API花子",
                    "business_content": "API開発サービス"
                }
            ],
            "total": 2,
            "page": 1,
            "page_size": 100
        },
        "company_detail": {
            "company": {
                "id": 1,
                "company_name": "APIテスト企業1",
                "url": "https://api-test1.com",
                "address": "東京都港区APIテスト1-1-1",
                "tel": "03-API1-API1",
                "representative": "API太郎",
                "business_content": "APIテスト事業、システム統合",
                "prefecture": "東京都"
            }
        },
        "sales_dashboard": {
            "summary": {
                "未着手": 10,
                "アプローチ中": 5,
                "商談中": 3,
                "成約": 2,
                "見送り": 1
            },
            "total_companies": 21,
            "recent_updates": [
                {
                    "company_name": "最近更新企業1",
                    "status": "商談中",
                    "contact_person": "更新太郎",
                    "updated_at": "2024-01-15T10:00:00Z"
                }
            ],
            "conversion_rate": 9.5
        },
        "scraping_status": {
            "status": "idle",
            "progress": 0,
            "collected": 0,
            "total": 0,
            "current_url": None,
            "estimated_remaining": None
        },
        "export_stats": {
            "total_companies": 21,
            "status_summary": {
                "未着手": 10,
                "アプローチ中": 5,
                "商談中": 3,
                "成約": 2,
                "見送り": 1
            },
            "prefecture_summary": {
                "東京都": 15,
                "大阪府": 4,
                "愛知県": 2
            },
            "last_updated": "2024-01-15T10:00:00Z"
        }
    }


@pytest.fixture
def performance_test_config():
    """パフォーマンステスト用設定"""
    return {
        "small_dataset": 100,
        "medium_dataset": 1000,
        "large_dataset": 10000,
        "concurrent_users": 10,
        "test_duration": 60,  # seconds
        "acceptable_response_time": 2.0,  # seconds
        "acceptable_throughput": 10.0,  # requests per second
        "memory_limit": 500,  # MB
        "cpu_threshold": 80.0  # percent
    }


@pytest.fixture
def error_scenarios():
    """エラーシナリオテスト用データ"""
    return {
        "network_errors": [
            {"type": "timeout", "message": "Request timeout"},
            {"type": "connection", "message": "Connection refused"},
            {"type": "dns", "message": "DNS resolution failed"}
        ],
        "http_errors": [
            {"status": 400, "message": "Bad Request"},
            {"status": 401, "message": "Unauthorized"},
            {"status": 403, "message": "Forbidden"},
            {"status": 404, "message": "Not Found"},
            {"status": 429, "message": "Too Many Requests"},
            {"status": 500, "message": "Internal Server Error"},
            {"status": 502, "message": "Bad Gateway"},
            {"status": 503, "message": "Service Unavailable"}
        ],
        "validation_errors": [
            {"field": "company_name", "message": "会社名は必須です"},
            {"field": "url", "message": "正しいURLを入力してください"},
            {"field": "email", "message": "正しいメールアドレスを入力してください"}
        ],
        "business_logic_errors": [
            {"code": "DUPLICATE_COMPANY", "message": "同じ企業が既に登録されています"},
            {"code": "INVALID_STATUS_TRANSITION", "message": "不正なステータス変更です"},
            {"code": "SCRAPING_IN_PROGRESS", "message": "スクレイピングが実行中です"}
        ]
    }


# ユーティリティ関数
def create_test_companies(count: int, prefix: str = "テスト") -> List[Dict[str, Any]]:
    """指定数のテスト企業データを生成"""
    companies = []
    for i in range(count):
        company = {
            "company_name": f"{prefix}企業{i:04d}",
            "url": f"https://{prefix.lower()}{i:04d}.com",
            "address": f"東京都{prefix}区{prefix}{i}-{i}-{i}",
            "tel": f"03-{i:04d}-{i:04d}",
            "representative": f"{prefix}太郎{i}",
            "business_content": f"{prefix}事業{i}",
            "prefecture": "東京都"
        }
        companies.append(company)
    return companies


def create_test_sales_statuses(company_ids: List[int]) -> List[Dict[str, Any]]:
    """指定された企業IDに対する営業ステータスデータを生成"""
    statuses = ['未着手', 'アプローチ中', '商談中', '成約', '見送り']
    sales_statuses = []
    
    for i, company_id in enumerate(company_ids):
        status = {
            "company_id": company_id,
            "status": statuses[i % len(statuses)],
            "contact_person": f"担当者{i}" if i % 3 != 0 else "",
            "last_contact_date": (datetime.now() - timedelta(days=i % 30)).strftime('%Y-%m-%d') if i % 2 == 0 else None,
            "next_action": f"次回アクション{i}",
            "memo": f"テストメモ{i}"
        }
        sales_statuses.append(status)
    
    return sales_statuses


async def cleanup_test_data(db_session: AsyncSession):
    """テストデータのクリーンアップ"""
    await db_session.execute("DELETE FROM sales_statuses")
    await db_session.execute("DELETE FROM companies")
    await db_session.execute("ALTER SEQUENCE companies_id_seq RESTART WITH 1")
    await db_session.commit()


# Faker プロバイダーのカスタマイズ
class CustomProvider:
    """カスタムFakerプロバイダー"""
    
    @staticmethod
    def japanese_company_name():
        """日本企業名生成"""
        prefixes = ['株式会社', '有限会社', '合同会社']
        names = ['テクノロジー', 'システムズ', 'ソリューション', 'サービス', 'コンサルティング']
        return f"{fake.random_element(prefixes)}{fake.random_element(names)}"
    
    @staticmethod
    def japanese_business_content():
        """日本企業事業内容生成"""
        contents = [
            'システム開発・運用', 'Webサービス企画・開発', 'デジタルマーケティング',
            'ITコンサルティング', 'データ分析・解析', 'AI・機械学習開発',
            'クラウドサービス提供', 'セキュリティソリューション', 'アプリケーション開発'
        ]
        return fake.random_element(contents)


# Fakerにカスタムプロバイダーを追加
fake.add_provider(CustomProvider)