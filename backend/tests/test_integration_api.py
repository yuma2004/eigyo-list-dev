"""
API統合テスト
FastAPI エンドポイントの統合テストを実装
"""

import pytest
import asyncio
from httpx import AsyncClient
from fastapi import status
from app.main import app
from app.models.responses import *
import json
from datetime import datetime, timedelta


@pytest.fixture
async def client():
    """テスト用HTTPクライアント"""
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


class TestCompaniesIntegration:
    """企業管理API統合テスト"""
    
    async def test_complete_company_crud_workflow(self, client: AsyncClient):
        """企業CRUD操作の完全なワークフローテスト"""
        
        # 1. 企業一覧取得（空の状態）
        response = await client.get("/api/companies/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 0
        assert len(data["companies"]) == 0
        
        # 2. 新規企業作成
        new_company = {
            "company_name": "統合テスト企業",
            "url": "https://integration-test.com",
            "address": "東京都渋谷区テスト1-1-1",
            "tel": "03-1234-5678",
            "fax": "03-1234-5679",
            "representative": "統合太郎",
            "business_content": "統合テスト事業",
            "established_date": "2020-01-01",
            "capital": "1000万円",
            "contact_url": "https://integration-test.com/contact"
        }
        
        response = await client.post("/api/companies/", json=new_company)
        assert response.status_code == status.HTTP_201_CREATED
        created_company = response.json()["company"]
        company_id = created_company["id"]
        assert created_company["company_name"] == "統合テスト企業"
        
        # 3. 作成した企業を取得
        response = await client.get(f"/api/companies/{company_id}")
        assert response.status_code == status.HTTP_200_OK
        fetched_company = response.json()["company"]
        assert fetched_company["company_name"] == "統合テスト企業"
        assert fetched_company["url"] == "https://integration-test.com"
        
        # 4. 企業情報を更新
        updated_data = {
            "company_name": "統合テスト企業（更新）",
            "url": "https://integration-test-updated.com",
            "address": "東京都新宿区テスト2-2-2",
            "tel": "03-9876-5432",
            "business_content": "統合テスト事業（拡大）"
        }
        
        response = await client.put(f"/api/companies/{company_id}", json=updated_data)
        assert response.status_code == status.HTTP_200_OK
        updated_company = response.json()["company"]
        assert updated_company["company_name"] == "統合テスト企業（更新）"
        assert updated_company["url"] == "https://integration-test-updated.com"
        
        # 5. 企業一覧で更新された企業を確認
        response = await client.get("/api/companies/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 1
        assert data["companies"][0]["company_name"] == "統合テスト企業（更新）"
        
        # 6. 企業削除
        response = await client.delete(f"/api/companies/{company_id}")
        assert response.status_code == status.HTTP_200_OK
        
        # 7. 削除確認
        response = await client.get(f"/api/companies/{company_id}")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        
        # 8. 企業一覧が空になったことを確認
        response = await client.get("/api/companies/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 0

    async def test_company_filtering_and_pagination(self, client: AsyncClient):
        """企業フィルタリングとページネーション統合テスト"""
        
        # テストデータ作成
        companies = [
            {
                "company_name": f"テスト企業{i}",
                "url": f"https://test{i}.com",
                "prefecture": "東京都" if i % 2 == 0 else "大阪府",
                "business_content": f"事業内容{i}"
            }
            for i in range(1, 26)  # 25件のテストデータ
        ]
        
        created_ids = []
        for company in companies:
            response = await client.post("/api/companies/", json=company)
            assert response.status_code == status.HTTP_201_CREATED
            created_ids.append(response.json()["company"]["id"])
        
        # ページネーションテスト
        response = await client.get("/api/companies/?page=1&page_size=10")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["companies"]) == 10
        assert data["total"] == 25
        assert data["page"] == 1
        
        # 2ページ目取得
        response = await client.get("/api/companies/?page=2&page_size=10")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["companies"]) == 10
        assert data["page"] == 2
        
        # 都道府県フィルタリング
        response = await client.get("/api/companies/?prefecture=東京都")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 13  # 25件中、偶数番号の13件
        
        # キーワード検索
        response = await client.get("/api/companies/?keyword=テスト企業1")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # "テスト企業1", "テスト企業10", "テスト企業11"... がヒット
        assert data["total"] >= 1
        
        # クリーンアップ
        for company_id in created_ids:
            await client.delete(f"/api/companies/{company_id}")


class TestScrapingIntegration:
    """スクレイピングAPI統合テスト"""
    
    async def test_scraping_workflow(self, client: AsyncClient):
        """スクレイピングワークフローの統合テスト"""
        
        # 1. 初期状態確認
        response = await client.get("/api/scraping/status")
        assert response.status_code == status.HTTP_200_OK
        status_data = response.json()
        assert status_data["status"] == "idle"
        
        # 2. 設定確認
        response = await client.get("/api/scraping/config")
        assert response.status_code == status.HTTP_200_OK
        
        # 3. スクレイピング開始
        scraping_config = {
            "keywords": ["IT企業", "統合テスト"],
            "target_sites": ["job_sites"],
            "max_pages": 5,
            "prefecture": "東京都",
            "industry": "IT"
        }
        
        response = await client.post("/api/scraping/start", json=scraping_config)
        assert response.status_code == status.HTTP_200_OK
        start_data = response.json()
        assert "task_id" in start_data
        
        # 4. スクレイピング状態確認
        response = await client.get("/api/scraping/status")
        assert response.status_code == status.HTTP_200_OK
        status_data = response.json()
        assert status_data["status"] in ["running", "completed"]
        
        # 5. 履歴確認
        response = await client.get("/api/scraping/history?limit=10")
        assert response.status_code == status.HTTP_200_OK
        history_data = response.json()
        assert "history" in history_data
        assert len(history_data["history"]) >= 0
        
        # 6. スクレイピング停止（実行中の場合）
        if status_data["status"] == "running":
            response = await client.post("/api/scraping/stop")
            assert response.status_code == status.HTTP_200_OK

    async def test_scraping_config_management(self, client: AsyncClient):
        """スクレイピング設定管理の統合テスト"""
        
        # 現在の設定取得
        response = await client.get("/api/scraping/config")
        assert response.status_code == status.HTTP_200_OK
        original_config = response.json()["config"]
        
        # 設定更新
        new_config = {
            "interval": 3,
            "timeout": 60,
            "max_pages_per_site": 50,
            "user_agent": "統合テストBot/1.0"
        }
        
        response = await client.post("/api/scraping/config", json=new_config)
        assert response.status_code == status.HTTP_200_OK
        
        # 更新された設定確認
        response = await client.get("/api/scraping/config")
        assert response.status_code == status.HTTP_200_OK
        updated_config = response.json()["config"]
        assert updated_config["interval"] == 3
        assert updated_config["timeout"] == 60


class TestSalesIntegration:
    """営業管理API統合テスト"""
    
    async def test_sales_management_workflow(self, client: AsyncClient):
        """営業管理ワークフローの統合テスト"""
        
        # 前提：企業を作成
        company_data = {
            "company_name": "営業テスト企業",
            "url": "https://sales-test.com",
            "address": "東京都渋谷区営業1-1-1"
        }
        
        response = await client.post("/api/companies/", json=company_data)
        assert response.status_code == status.HTTP_201_CREATED
        company_id = response.json()["company"]["id"]
        
        # 1. ダッシュボード取得
        response = await client.get("/api/sales/dashboard")
        assert response.status_code == status.HTTP_200_OK
        dashboard = response.json()
        assert "summary" in dashboard
        assert "total_companies" in dashboard
        
        # 2. 営業ステータス作成
        sales_status = {
            "status": "アプローチ中",
            "contact_person": "営業太郎",
            "last_contact_date": "2024-01-15",
            "next_action": "商談設定",
            "memo": "初回アプローチ完了"
        }
        
        response = await client.post(f"/api/sales/companies/{company_id}/status", json=sales_status)
        assert response.status_code == status.HTTP_200_OK
        
        # 3. 営業ステータス取得
        response = await client.get(f"/api/sales/companies/{company_id}/status")
        assert response.status_code == status.HTTP_200_OK
        status_data = response.json()
        assert status_data["status"]["status"] == "アプローチ中"
        assert status_data["status"]["contact_person"] == "営業太郎"
        
        # 4. 営業ステータス更新
        updated_status = {
            "status": "商談中",
            "contact_person": "営業太郎",
            "last_contact_date": "2024-01-20",
            "next_action": "提案書提出",
            "memo": "商談実施。提案書準備中。"
        }
        
        response = await client.put(f"/api/sales/companies/{company_id}/status", json=updated_status)
        assert response.status_code == status.HTTP_200_OK
        
        # 5. 更新確認
        response = await client.get(f"/api/sales/companies/{company_id}/status")
        assert response.status_code == status.HTTP_200_OK
        status_data = response.json()
        assert status_data["status"]["status"] == "商談中"
        assert status_data["status"]["next_action"] == "提案書提出"
        
        # 6. 営業ステータス一覧取得
        response = await client.get("/api/sales/statuses")
        assert response.status_code == status.HTTP_200_OK
        statuses = response.json()
        assert len(statuses) >= 1
        
        # 7. フォローアップ予定取得
        response = await client.get("/api/sales/follow-ups?days_ahead=7")
        assert response.status_code == status.HTTP_200_OK
        followups = response.json()
        assert "follow_ups" in followups
        
        # クリーンアップ
        await client.delete(f"/api/companies/{company_id}")

    async def test_sales_analytics_integration(self, client: AsyncClient):
        """営業分析機能の統合テスト"""
        
        # 複数の企業と営業ステータスを作成
        companies_data = [
            {"company_name": "分析企業1", "url": "https://analytics1.com"},
            {"company_name": "分析企業2", "url": "https://analytics2.com"},
            {"company_name": "分析企業3", "url": "https://analytics3.com"},
        ]
        
        company_ids = []
        for company_data in companies_data:
            response = await client.post("/api/companies/", json=company_data)
            company_ids.append(response.json()["company"]["id"])
        
        # 各企業に異なる営業ステータスを設定
        statuses = ["アプローチ中", "商談中", "成約"]
        for i, company_id in enumerate(company_ids):
            sales_status = {
                "status": statuses[i],
                "contact_person": f"担当者{i+1}",
                "last_contact_date": "2024-01-15"
            }
            response = await client.post(f"/api/sales/companies/{company_id}/status", json=sales_status)
            assert response.status_code == status.HTTP_200_OK
        
        # 分析データ取得
        response = await client.get("/api/sales/analytics?period=monthly")
        assert response.status_code == status.HTTP_200_OK
        analytics = response.json()
        assert "analytics" in analytics
        assert "conversion_rate" in analytics["analytics"]
        assert "total_approached" in analytics["analytics"]
        
        # ダッシュボードデータ更新確認
        response = await client.get("/api/sales/dashboard")
        assert response.status_code == status.HTTP_200_OK
        dashboard = response.json()
        assert dashboard["summary"]["アプローチ中"] >= 1
        assert dashboard["summary"]["商談中"] >= 1
        assert dashboard["summary"]["成約"] >= 1
        
        # クリーンアップ
        for company_id in company_ids:
            await client.delete(f"/api/companies/{company_id}")


class TestExportIntegration:
    """エクスポートAPI統合テスト"""
    
    async def test_export_workflow(self, client: AsyncClient):
        """エクスポートワークフローの統合テスト"""
        
        # テストデータ準備
        test_companies = [
            {
                "company_name": "エクスポート企業1",
                "url": "https://export1.com",
                "prefecture": "東京都",
                "business_content": "IT事業"
            },
            {
                "company_name": "エクスポート企業2", 
                "url": "https://export2.com",
                "prefecture": "大阪府",
                "business_content": "広告事業"
            }
        ]
        
        company_ids = []
        for company_data in test_companies:
            response = await client.post("/api/companies/", json=company_data)
            company_ids.append(response.json()["company"]["id"])
        
        # 営業ステータス設定
        for i, company_id in enumerate(company_ids):
            sales_status = {
                "status": "アプローチ中" if i == 0 else "商談中",
                "contact_person": f"担当者{i+1}"
            }
            await client.post(f"/api/sales/companies/{company_id}/status", json=sales_status)
        
        # 1. エクスポート統計取得
        response = await client.get("/api/export/stats")
        assert response.status_code == status.HTTP_200_OK
        stats = response.json()
        assert stats["total_companies"] >= 2
        assert "status_summary" in stats
        assert "prefecture_summary" in stats
        
        # 2. CSV エクスポート
        export_filters = {
            "status": "アプローチ中",
            "include_sales_status": True
        }
        
        response = await client.post("/api/export/csv", json=export_filters)
        assert response.status_code == status.HTTP_200_OK
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        
        # 3. Excel エクスポート
        response = await client.post("/api/export/excel", json=export_filters)
        assert response.status_code == status.HTTP_200_OK
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in response.headers["content-type"]
        
        # 4. テンプレートダウンロード
        response = await client.get("/api/export/template")
        assert response.status_code == status.HTTP_200_OK
        
        # 5. フィルタリングエクスポート
        prefecture_filter = {"prefecture": "東京都"}
        response = await client.post("/api/export/csv", json=prefecture_filter)
        assert response.status_code == status.HTTP_200_OK
        
        # クリーンアップ
        for company_id in company_ids:
            await client.delete(f"/api/companies/{company_id}")


class TestCrossModuleIntegration:
    """モジュール間統合テスト"""
    
    async def test_complete_business_workflow(self, client: AsyncClient):
        """完全なビジネスワークフローの統合テスト"""
        
        # 1. スクレイピングで企業データ収集（シミュレーション）
        scraping_config = {
            "keywords": ["統合テスト企業"],
            "target_sites": ["job_sites"],
            "max_pages": 1
        }
        
        response = await client.post("/api/scraping/start", json=scraping_config)
        assert response.status_code == status.HTTP_200_OK
        
        # 2. 手動で企業データ追加（スクレイピング結果のシミュレーション）
        company_data = {
            "company_name": "統合ワークフロー企業",
            "url": "https://integration-workflow.com",
            "address": "東京都港区統合1-1-1",
            "tel": "03-0000-0000",
            "business_content": "統合テストサービス"
        }
        
        response = await client.post("/api/companies/", json=company_data)
        assert response.status_code == status.HTTP_201_CREATED
        company_id = response.json()["company"]["id"]
        
        # 3. 営業活動開始
        sales_status = {
            "status": "アプローチ中",
            "contact_person": "統合太郎",
            "last_contact_date": "2024-01-15",
            "next_action": "資料送付",
            "memo": "統合テストによる営業活動"
        }
        
        response = await client.post(f"/api/sales/companies/{company_id}/status", json=sales_status)
        assert response.status_code == status.HTTP_200_OK
        
        # 4. 営業進捗更新
        updated_status = {
            "status": "商談中",
            "contact_person": "統合太郎",
            "last_contact_date": "2024-01-20",
            "next_action": "契約書作成",
            "memo": "商談成功。契約準備中。"
        }
        
        response = await client.put(f"/api/sales/companies/{company_id}/status", json=updated_status)
        assert response.status_code == status.HTTP_200_OK
        
        # 5. 最終的に成約
        final_status = {
            "status": "成約",
            "contact_person": "統合太郎",
            "last_contact_date": "2024-01-25",
            "next_action": "プロジェクト開始",
            "memo": "統合テスト成功！契約締結完了。"
        }
        
        response = await client.put(f"/api/sales/companies/{company_id}/status", json=final_status)
        assert response.status_code == status.HTTP_200_OK
        
        # 6. 結果をエクスポート
        export_filters = {
            "status": "成約",
            "include_sales_status": True
        }
        
        response = await client.post("/api/export/csv", json=export_filters)
        assert response.status_code == status.HTTP_200_OK
        
        # 7. 分析データ確認
        response = await client.get("/api/sales/analytics?period=monthly")
        assert response.status_code == status.HTTP_200_OK
        analytics = response.json()
        assert analytics["analytics"]["total_converted"] >= 1
        
        # 8. ダッシュボードで成果確認
        response = await client.get("/api/sales/dashboard")
        assert response.status_code == status.HTTP_200_OK
        dashboard = response.json()
        assert dashboard["summary"]["成約"] >= 1
        assert dashboard["conversion_rate"] > 0
        
        # クリーンアップ
        await client.delete(f"/api/companies/{company_id}")
        
        # 最終確認：削除されたことを確認
        response = await client.get(f"/api/companies/{company_id}")
        assert response.status_code == status.HTTP_404_NOT_FOUND


# パフォーマンステスト
class TestPerformanceIntegration:
    """パフォーマンス統合テスト"""
    
    @pytest.mark.asyncio
    async def test_bulk_operations_performance(self, client: AsyncClient):
        """大量データ操作のパフォーマンステスト"""
        import time
        
        # 大量企業データ作成
        start_time = time.time()
        company_ids = []
        
        for i in range(100):
            company_data = {
                "company_name": f"パフォーマンステスト企業{i}",
                "url": f"https://perf-test{i}.com",
                "prefecture": "東京都" if i % 2 == 0 else "大阪府"
            }
            
            response = await client.post("/api/companies/", json=company_data)
            assert response.status_code == status.HTTP_201_CREATED
            company_ids.append(response.json()["company"]["id"])
        
        creation_time = time.time() - start_time
        print(f"100件の企業作成時間: {creation_time:.2f}秒")
        
        # 一覧取得パフォーマンス
        start_time = time.time()
        response = await client.get("/api/companies/?page_size=100")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data["companies"]) == 100
        
        fetch_time = time.time() - start_time
        print(f"100件の企業取得時間: {fetch_time:.2f}秒")
        
        # フィルタリングパフォーマンス
        start_time = time.time()
        response = await client.get("/api/companies/?prefecture=東京都")
        assert response.status_code == status.HTTP_200_OK
        
        filter_time = time.time() - start_time
        print(f"フィルタリング時間: {filter_time:.2f}秒")
        
        # パフォーマンス assertion
        assert creation_time < 30.0  # 30秒以内
        assert fetch_time < 5.0      # 5秒以内
        assert filter_time < 3.0     # 3秒以内
        
        # クリーンアップ
        for company_id in company_ids:
            await client.delete(f"/api/companies/{company_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])