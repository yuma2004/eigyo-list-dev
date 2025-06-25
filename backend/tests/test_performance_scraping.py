"""
スクレイピング機能パフォーマンステスト
大量データ処理、並行処理、メモリ使用量の検証
"""

import pytest
import asyncio
import time
import psutil
import threading
from unittest.mock import Mock, patch, AsyncMock
from concurrent.futures import ThreadPoolExecutor
from app.core.scraping_engine import ScrapingEngine
from app.models.requests import ScrapingConfig
from typing import List, Dict, Any
import requests
from bs4 import BeautifulSoup


class TestScrapingPerformance:
    """スクレイピングパフォーマンステスト"""
    
    @pytest.fixture
    def scraping_engine(self):
        """テスト用スクレイピングエンジン"""
        return ScrapingEngine()
    
    @pytest.fixture
    def performance_config(self):
        """パフォーマンステスト用設定"""
        return ScrapingConfig(
            keywords=["IT企業", "広告代理店", "コンサルティング"],
            target_sites=["job_sites", "press_sites"],
            max_pages=50,
            prefecture="東京都",
            industry="IT"
        )
    
    @pytest.fixture
    def large_config(self):
        """大量データ処理用設定"""
        return ScrapingConfig(
            keywords=[
                "IT企業", "広告代理店", "コンサルティング", "システム開発",
                "Webサービス", "アプリ開発", "AI", "機械学習", "データ分析",
                "クラウドサービス", "セキュリティ", "インフラ", "DevOps",
                "フィンテック", "EdTech", "HealthTech", "スタートアップ"
            ],
            target_sites=["job_sites", "press_sites", "company_sites"],
            max_pages=200,
            prefecture=None,  # 全都道府県
            industry=None     # 全業界
        )

    async def test_concurrent_scraping_performance(self, scraping_engine: ScrapingEngine, performance_config: ScrapingConfig):
        """並行スクレイピングのパフォーマンステスト"""
        
        # モックレスポンスの準備
        mock_responses = []
        for i in range(100):
            mock_html = f"""
            <html>
                <head><title>テスト企業{i}</title></head>
                <body>
                    <h1>株式会社テスト{i}</h1>
                    <div class="company-info">
                        <p>住所: 東京都渋谷区テスト{i}-{i}-{i}</p>
                        <p>電話: 03-{i:04d}-{i:04d}</p>
                        <p>事業内容: ITサービス開発{i}</p>
                    </div>
                    <a href="mailto:contact{i}@test.com">お問い合わせ</a>
                </body>
            </html>
            """
            mock_responses.append(mock_html)
        
        with patch('requests.Session.get') as mock_get:
            # 各URLに対して異なるレスポンスを返すモック
            def side_effect(*args, **kwargs):
                url = args[0]
                index = hash(url) % len(mock_responses)
                response = Mock()
                response.status_code = 200
                response.text = mock_responses[index]
                response.headers = {'content-type': 'text/html'}
                return response
            
            mock_get.side_effect = side_effect
            
            # パフォーマンステスト実行
            start_time = time.time()
            start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
            
            # 並行処理でスクレイピング実行
            results = await scraping_engine.execute_scraping(performance_config)
            
            end_time = time.time()
            end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
            
            execution_time = end_time - start_time
            memory_usage = end_memory - start_memory
            
            print(f"並行スクレイピング実行時間: {execution_time:.2f}秒")
            print(f"メモリ使用量増加: {memory_usage:.2f}MB")
            print(f"処理件数: {len(results)}件")
            print(f"1件あたりの処理時間: {execution_time/len(results):.3f}秒")
            
            # パフォーマンス assertion
            assert execution_time < 30.0  # 30秒以内
            assert memory_usage < 100.0   # 100MB未満の増加
            assert len(results) > 0       # 結果が取得できている
            assert execution_time / len(results) < 0.5  # 1件あたり0.5秒未満

    async def test_large_scale_data_processing(self, scraping_engine: ScrapingEngine, large_config: ScrapingConfig):
        """大量データ処理のパフォーマンステスト"""
        
        # 大量のモックデータ準備
        mock_companies = []
        for i in range(1000):
            company_data = {
                "company_name": f"大量テスト企業{i}",
                "url": f"https://large-test{i}.com",
                "address": f"東京都新宿区大量{i}-{i}-{i}",
                "tel": f"03-{i:04d}-{(i*2) % 10000:04d}",
                "business_content": f"大量処理テスト事業{i}、システム開発",
                "representative": f"大量太郎{i}",
                "prefecture": ["東京都", "大阪府", "愛知県", "神奈川県", "福岡県"][i % 5]
            }
            mock_companies.append(company_data)
        
        with patch.object(scraping_engine, '_scrape_company_data') as mock_scrape:
            # 大量データを順次返すモック
            mock_scrape.side_effect = mock_companies
            
            start_time = time.time()
            start_memory = psutil.Process().memory_info().rss / 1024 / 1024
            
            # 大量データ処理実行
            results = await scraping_engine.process_large_dataset(large_config, max_items=1000)
            
            end_time = time.time()
            end_memory = psutil.Process().memory_info().rss / 1024 / 1024
            
            execution_time = end_time - start_time
            memory_usage = end_memory - start_memory
            throughput = len(results) / execution_time
            
            print(f"大量データ処理時間: {execution_time:.2f}秒")
            print(f"メモリ使用量: {memory_usage:.2f}MB") 
            print(f"処理件数: {len(results)}件")
            print(f"スループット: {throughput:.2f}件/秒")
            
            # パフォーマンス assertion
            assert execution_time < 120.0  # 2分以内
            assert memory_usage < 500.0    # 500MB未満
            assert len(results) >= 900     # 90%以上の成功率
            assert throughput > 5.0        # 5件/秒以上

    async def test_memory_leak_detection(self, scraping_engine: ScrapingEngine, performance_config: ScrapingConfig):
        """メモリリーク検出テスト"""
        
        initial_memory = psutil.Process().memory_info().rss / 1024 / 1024
        memory_samples = [initial_memory]
        
        # 複数回スクレイピングを実行してメモリ使用量を監視
        for iteration in range(10):
            with patch('requests.Session.get') as mock_get:
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.text = """
                <html>
                    <head><title>メモリテスト企業</title></head>
                    <body>
                        <h1>株式会社メモリテスト</h1>
                        <p>メモリリーク検出テスト用企業</p>
                    </body>
                </html>
                """
                mock_get.return_value = mock_response
                
                await scraping_engine.execute_scraping(performance_config)
                
                # ガベージコレクション強制実行
                import gc
                gc.collect()
                
                current_memory = psutil.Process().memory_info().rss / 1024 / 1024
                memory_samples.append(current_memory)
                
                print(f"反復 {iteration + 1}: メモリ使用量 {current_memory:.2f}MB")
        
        # メモリ使用量の傾向分析
        memory_growth = memory_samples[-1] - memory_samples[0]
        average_growth_per_iteration = memory_growth / 10
        
        print(f"総メモリ増加量: {memory_growth:.2f}MB")
        print(f"反復あたりの平均増加量: {average_growth_per_iteration:.2f}MB")
        
        # メモリリークの検出
        assert memory_growth < 50.0  # 50MB未満の増加
        assert average_growth_per_iteration < 5.0  # 反復あたり5MB未満

    async def test_rate_limiting_performance(self, scraping_engine: ScrapingEngine):
        """レート制限下でのパフォーマンステスト"""
        
        # レート制限設定（1秒間に2リクエスト）
        rate_limit_config = ScrapingConfig(
            keywords=["レート制限テスト"],
            target_sites=["job_sites"],
            max_pages=20,
            rate_limit=2.0  # requests per second
        )
        
        with patch('requests.Session.get') as mock_get:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.text = "<html><title>レート制限テスト</title></html>"
            mock_get.return_value = mock_response
            
            start_time = time.time()
            
            await scraping_engine.execute_scraping_with_rate_limit(rate_limit_config)
            
            end_time = time.time()
            execution_time = end_time - start_time
            
            # レート制限が正しく動作していることを確認
            expected_min_time = (20 - 1) / 2.0  # 19リクエストを2req/secで処理
            
            print(f"レート制限実行時間: {execution_time:.2f}秒")
            print(f"期待最小時間: {expected_min_time:.2f}秒")
            print(f"リクエスト数: {mock_get.call_count}")
            
            assert execution_time >= expected_min_time * 0.9  # 多少の誤差を許容
            assert execution_time <= expected_min_time * 2.0  # 過度に遅くない

    async def test_error_handling_performance(self, scraping_engine: ScrapingEngine, performance_config: ScrapingConfig):
        """エラーハンドリング下でのパフォーマンステスト"""
        
        error_count = 0
        success_count = 0
        
        def mock_get_with_errors(*args, **kwargs):
            nonlocal error_count, success_count
            
            # 30%の確率でエラーを発生
            if (error_count + success_count) % 10 < 3:
                error_count += 1
                raise requests.RequestException("ネットワークエラー")
            else:
                success_count += 1
                response = Mock()
                response.status_code = 200
                response.text = "<html><title>成功レスポンス</title></html>"
                return response
        
        with patch('requests.Session.get', side_effect=mock_get_with_errors):
            start_time = time.time()
            
            results = await scraping_engine.execute_scraping_with_retry(
                performance_config,
                max_retries=3,
                retry_delay=0.1
            )
            
            end_time = time.time()
            execution_time = end_time - start_time
            
            print(f"エラー含む実行時間: {execution_time:.2f}秒")
            print(f"エラー数: {error_count}")
            print(f"成功数: {success_count}")
            print(f"成功率: {success_count/(error_count + success_count)*100:.1f}%")
            print(f"最終結果数: {len(results)}")
            
            # エラーがあっても合理的な時間で完了すること
            assert execution_time < 60.0  # 1分以内
            assert len(results) > 0       # 何らかの結果が得られる
            assert success_count > error_count  # 成功数がエラー数を上回る

    async def test_concurrent_user_simulation(self, scraping_engine: ScrapingEngine):
        """複数ユーザー同時アクセスのシミュレーション"""
        
        async def user_session(user_id: int):
            """個別ユーザーのスクレイピングセッション"""
            config = ScrapingConfig(
                keywords=[f"ユーザー{user_id}企業"],
                target_sites=["job_sites"],
                max_pages=10
            )
            
            start_time = time.time()
            
            with patch('requests.Session.get') as mock_get:
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.text = f"<html><title>ユーザー{user_id}の結果</title></html>"
                mock_get.return_value = mock_response
                
                results = await scraping_engine.execute_scraping(config)
                
            end_time = time.time()
            
            return {
                'user_id': user_id,
                'execution_time': end_time - start_time,
                'results_count': len(results),
                'success': len(results) > 0
            }
        
        # 10人の同時ユーザーをシミュレート
        start_time = time.time()
        
        tasks = [user_session(i) for i in range(10)]
        user_results = await asyncio.gather(*tasks)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # 結果分析
        execution_times = [r['execution_time'] for r in user_results]
        success_rate = sum(1 for r in user_results if r['success']) / len(user_results)
        avg_execution_time = sum(execution_times) / len(execution_times)
        max_execution_time = max(execution_times)
        
        print(f"総実行時間: {total_time:.2f}秒")
        print(f"平均個別実行時間: {avg_execution_time:.2f}秒")
        print(f"最大個別実行時間: {max_execution_time:.2f}秒")
        print(f"成功率: {success_rate*100:.1f}%")
        
        # 同時実行の効果確認
        sequential_time_estimate = sum(execution_times)
        concurrency_efficiency = sequential_time_estimate / total_time
        
        print(f"並行処理効率: {concurrency_efficiency:.1f}x")
        
        # パフォーマンス assertion
        assert total_time < 30.0         # 30秒以内で完了
        assert success_rate >= 0.8       # 80%以上の成功率
        assert concurrency_efficiency > 5.0  # 5倍以上の並行処理効果

    async def test_database_write_performance(self, scraping_engine: ScrapingEngine):
        """データベース書き込みパフォーマンステスト"""
        
        # 大量のテストデータ準備
        test_companies = []
        for i in range(500):
            company = {
                "company_name": f"DB書き込みテスト企業{i}",
                "url": f"https://db-test{i}.com",
                "address": f"東京都中央区DB{i}-{i}-{i}",
                "tel": f"03-{i:04d}-{i:04d}",
                "business_content": f"データベーステスト事業{i}"
            }
            test_companies.append(company)
        
        with patch.object(scraping_engine, 'save_companies_batch') as mock_save:
            # バッチ書き込みのモック
            async def mock_batch_save(companies_batch):
                # 実際のDB操作をシミュレート
                await asyncio.sleep(0.01 * len(companies_batch))  # DBレイテンシシミュレーション
                return len(companies_batch)
            
            mock_save.side_effect = mock_batch_save
            
            start_time = time.time()
            
            # バッチサイズ50でデータベース書き込み
            total_saved = await scraping_engine.save_companies_in_batches(
                test_companies, 
                batch_size=50
            )
            
            end_time = time.time()
            execution_time = end_time - start_time
            throughput = total_saved / execution_time
            
            print(f"DB書き込み時間: {execution_time:.2f}秒")
            print(f"保存件数: {total_saved}件")
            print(f"書き込みスループット: {throughput:.2f}件/秒")
            print(f"バッチ数: {mock_save.call_count}")
            
            # パフォーマンス assertion
            assert execution_time < 30.0    # 30秒以内
            assert total_saved == 500       # 全件保存成功
            assert throughput > 10.0        # 10件/秒以上
            assert mock_save.call_count == 10  # 50件x10バッチ

    async def test_resource_cleanup_performance(self, scraping_engine: ScrapingEngine):
        """リソースクリーンアップのパフォーマンステスト"""
        
        # リソース使用量監視
        initial_threads = threading.active_count()
        initial_memory = psutil.Process().memory_info().rss / 1024 / 1024
        
        # 複数のスクレイピングセッションを実行
        for session in range(5):
            config = ScrapingConfig(
                keywords=[f"クリーンアップテスト{session}"],
                target_sites=["job_sites"],
                max_pages=20
            )
            
            with patch('requests.Session.get') as mock_get:
                mock_response = Mock()
                mock_response.status_code = 200
                mock_response.text = f"<html><title>セッション{session}</title></html>"
                mock_get.return_value = mock_response
                
                await scraping_engine.execute_scraping(config)
            
            # 各セッション後にクリーンアップ実行
            await scraping_engine.cleanup_resources()
            
            current_threads = threading.active_count()
            current_memory = psutil.Process().memory_info().rss / 1024 / 1024
            
            print(f"セッション{session+1}後:")
            print(f"  スレッド数: {current_threads} (初期: {initial_threads})")
            print(f"  メモリ: {current_memory:.2f}MB (初期: {initial_memory:.2f}MB)")
        
        # 最終的なリソース状態確認
        final_threads = threading.active_count()
        final_memory = psutil.Process().memory_info().rss / 1024 / 1024
        
        thread_growth = final_threads - initial_threads
        memory_growth = final_memory - initial_memory
        
        print(f"\n最終リソース状態:")
        print(f"スレッド増加: {thread_growth}")
        print(f"メモリ増加: {memory_growth:.2f}MB")
        
        # リソースリークの検出
        assert thread_growth <= 2        # スレッド数の過度な増加なし
        assert memory_growth < 50.0      # 50MB未満のメモリ増加


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])