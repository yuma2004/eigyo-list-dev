"""
スクレイピングエンジンのテスト
TDD (t-wada式) - Red -> Green -> Refactor
"""
import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime

# まだ実装していないモジュールをインポート（RED phase）
from app.services.scraping_engine import ScrapingEngine, RateLimiter


class TestRateLimiter:
    """レート制限機能のテストクラス"""
    
    def test_指定した間隔でリクエストを制限できる(self):
        """レート制限の基本機能テスト"""
        # Arrange
        rate_limiter = RateLimiter(requests_per_second=2)
        
        # Act
        start_time = datetime.now()
        asyncio.run(rate_limiter.wait())
        asyncio.run(rate_limiter.wait())
        end_time = datetime.now()
        
        # Assert
        elapsed = (end_time - start_time).total_seconds()
        assert elapsed >= 0.5  # 2リクエスト/秒 = 0.5秒間隔


class TestScrapingEngine:
    """スクレイピングエンジンのテストクラス"""
    
    @pytest.fixture
    def scraping_engine(self):
        """テスト用のScrapingEngineインスタンス"""
        config = {
            "interval": 1,
            "timeout": 30,
            "max_pages_per_site": 100,
            "user_agents": ["Mozilla/5.0 Test Agent"]
        }
        return ScrapingEngine(config)
    
    @pytest.mark.asyncio
    async def test_企業情報を抽出できる(self, scraping_engine):
        """企業情報抽出機能のテスト"""
        # Arrange
        mock_html = """
        <html>
            <body>
                <h1>テスト株式会社</h1>
                <div class="company-info">
                    <p>住所: 東京都千代田区1-1-1</p>
                    <p>電話: 03-1234-5678</p>
                    <p>代表者: 山田太郎</p>
                </div>
            </body>
        </html>
        """
        
        # Act
        with patch.object(scraping_engine, 'fetch_page', return_value=mock_html):
            company_info = await scraping_engine.extract_company_info("https://example.com")
        
        # Assert
        assert company_info["company_name"] == "テスト株式会社"
        assert company_info["address"] == "東京都千代田区1-1-1"
        assert company_info["tel"] == "03-1234-5678"
        assert company_info["representative"] == "山田太郎"
    
    @pytest.mark.asyncio
    async def test_複数のURLから並列で情報を収集できる(self, scraping_engine):
        """並列処理機能のテスト"""
        # Arrange
        urls = [
            "https://example1.com",
            "https://example2.com",
            "https://example3.com"
        ]
        
        # Act
        with patch.object(scraping_engine, 'extract_company_info', new_callable=AsyncMock) as mock_extract:
            mock_extract.side_effect = [
                {"company_name": f"会社{i}"} for i in range(1, 4)
            ]
            results = await scraping_engine.scrape_multiple(urls)
        
        # Assert
        assert len(results) == 3
        assert mock_extract.call_count == 3
    
    @pytest.mark.asyncio
    async def test_タイムアウト時に適切にエラーハンドリングできる(self, scraping_engine):
        """タイムアウト処理のテスト"""
        # Arrange & Act
        with patch.object(scraping_engine, 'fetch_page', side_effect=asyncio.TimeoutError()):
            result = await scraping_engine.extract_company_info("https://timeout.com")
        
        # Assert
        assert result["error"] is True
        assert "timeout" in result["error_message"].lower()
    
    @pytest.mark.asyncio
    async def test_User_Agentをランダムに選択できる(self, scraping_engine):
        """User-Agentローテーション機能のテスト"""
        # Arrange
        scraping_engine.user_agents = [
            "Agent1",
            "Agent2",
            "Agent3"
        ]
        
        # Act
        selected_agents = set()
        for _ in range(10):
            agent = scraping_engine.get_random_user_agent()
            selected_agents.add(agent)
        
        # Assert
        assert len(selected_agents) > 1  # 複数のUser-Agentが選択されている
    
    def test_設定ファイルから正しく設定を読み込める(self):
        """設定読み込み機能のテスト"""
        # Arrange
        mock_config = {
            "scraping": {
                "interval": 2,
                "timeout": 60,
                "max_pages_per_site": 50
            }
        }
        
        # Act
        with patch('app.services.scraping_engine.load_config', return_value=mock_config):
            engine = ScrapingEngine.from_config_file("config.yaml")
        
        # Assert
        assert engine.config["interval"] == 2
        assert engine.config["timeout"] == 60
        assert engine.config["max_pages_per_site"] == 50 