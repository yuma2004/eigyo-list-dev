"""
スクレイピングエンジン
"""
import asyncio
import random
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from bs4 import BeautifulSoup
import httpx
import yaml
from loguru import logger


class RateLimiter:
    """レート制限を管理するクラス"""
    
    def __init__(self, requests_per_second: float = 1.0):
        """
        初期化
        
        Args:
            requests_per_second: 1秒あたりのリクエスト数
        """
        self.requests_per_second = requests_per_second
        self.interval = 1.0 / requests_per_second
        self.last_request_time = 0
    
    async def wait(self):
        """レート制限に基づいて待機する"""
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        
        if time_since_last_request < self.interval:
            wait_time = self.interval - time_since_last_request
            await asyncio.sleep(wait_time)
        
        self.last_request_time = time.time()


class ScrapingEngine:
    """Webスクレイピングエンジン"""
    
    def __init__(self, config: Dict[str, Any]):
        """
        初期化
        
        Args:
            config: 設定情報の辞書
        """
        self.config = config
        self.rate_limiter = RateLimiter(1.0 / config.get("interval", 1))
        self.timeout = config.get("timeout", 30)
        self.max_pages_per_site = config.get("max_pages_per_site", 100)
        self.user_agents = config.get("user_agents", [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        ])
    
    @classmethod
    def from_config_file(cls, config_path: str) -> "ScrapingEngine":
        """設定ファイルからインスタンスを作成"""
        config = load_config(config_path)
        return cls(config["scraping"])
    
    def get_random_user_agent(self) -> str:
        """ランダムなUser-Agentを取得"""
        return random.choice(self.user_agents)
    
    async def fetch_page(self, url: str) -> str:
        """
        ページをフェッチする
        
        Args:
            url: 取得するURL
            
        Returns:
            HTMLコンテンツ
        """
        await self.rate_limiter.wait()
        
        headers = {
            "User-Agent": self.get_random_user_agent()
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    url,
                    headers=headers,
                    timeout=self.timeout,
                    follow_redirects=True
                )
                response.raise_for_status()
                return response.text
                
            except httpx.TimeoutException:
                logger.error(f"タイムアウト: {url}")
                raise asyncio.TimeoutError(f"Request timeout for {url}")
            except Exception as e:
                logger.error(f"ページ取得エラー: {url} - {e}")
                raise
    
    async def extract_company_info(self, url: str) -> Dict[str, Any]:
        """
        企業情報を抽出する
        
        Args:
            url: 企業サイトのURL
            
        Returns:
            抽出した企業情報
        """
        try:
            html = await self.fetch_page(url)
            soup = BeautifulSoup(html, "html.parser")
            
            # 基本的な情報抽出ロジック（実際のサイトに合わせて調整が必要）
            company_info = {
                "url": url,
                "company_name": "",
                "address": "",
                "tel": "",
                "fax": "",
                "representative": "",
                "business_content": "",
                "established_date": "",
                "capital": "",
                "contact_url": ""
            }
            
            # タイトルから会社名を取得
            title_tag = soup.find("title")
            if title_tag:
                company_info["company_name"] = title_tag.text.strip()
            
            # h1タグからも会社名を探す
            h1_tag = soup.find("h1")
            if h1_tag and not company_info["company_name"]:
                company_info["company_name"] = h1_tag.text.strip()
            
            # 会社情報を含む可能性のあるdivを探す
            info_keywords = ["company-info", "corporate-info", "会社概要", "企業情報"]
            for keyword in info_keywords:
                info_div = soup.find("div", class_=keyword) or soup.find("div", id=keyword)
                if info_div:
                    # パラグラフタグから情報を抽出
                    paragraphs = info_div.find_all("p")
                    for p in paragraphs:
                        text = p.get_text().strip()
                        
                        # 住所を抽出
                        if "住所:" in text:
                            company_info["address"] = text.replace("住所:", "").strip()
                        elif "所在地:" in text:
                            company_info["address"] = text.replace("所在地:", "").strip()
                        
                        # 電話番号を抽出
                        elif "電話:" in text:
                            company_info["tel"] = text.replace("電話:", "").strip()
                        elif "TEL:" in text:
                            company_info["tel"] = text.replace("TEL:", "").strip()
                        
                        # 代表者を抽出
                        elif "代表者:" in text:
                            company_info["representative"] = text.replace("代表者:", "").strip()
                        elif "代表:" in text and "代表者" not in text:
                            company_info["representative"] = text.replace("代表:", "").strip()
            
            return company_info
            
        except asyncio.TimeoutError:
            return {
                "url": url,
                "error": True,
                "error_message": "Request timeout"
            }
        except Exception as e:
            logger.error(f"企業情報抽出エラー: {url} - {e}")
            return {
                "url": url,
                "error": True,
                "error_message": str(e)
            }
    
    async def scrape_multiple(self, urls: List[str]) -> List[Dict[str, Any]]:
        """
        複数のURLから並列で情報を収集する
        
        Args:
            urls: URLのリスト
            
        Returns:
            企業情報のリスト
        """
        tasks = []
        for url in urls[:self.max_pages_per_site]:
            task = self.extract_company_info(url)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # エラーを処理
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({
                    "url": urls[i],
                    "error": True,
                    "error_message": str(result)
                })
            else:
                processed_results.append(result)
        
        return processed_results
    
    async def search_companies(self, keyword: str) -> List[Dict[str, str]]:
        """
        キーワードで企業を検索する（実装は検索エンジンAPIに依存）
        
        Args:
            keyword: 検索キーワード
            
        Returns:
            検索結果のリスト
        """
        # TODO: 実際の検索エンジンAPIまたはスクレイピングを実装
        # ここでは仮の実装
        logger.info(f"検索キーワード: {keyword}")
        return []


def load_config(config_path: str) -> Dict[str, Any]:
    """設定ファイルを読み込む"""
    with open(config_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) 