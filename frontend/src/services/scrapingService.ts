import apiClient from './api'
import type {
  ScrapingConfig,
  ScrapingResponse,
  ScrapingStatusResponse,
  BaseResponse,
} from '../types/api'

export class ScrapingService {
  // スクレイピング開始
  static async startScraping(config: ScrapingConfig): Promise<ScrapingResponse> {
    const response = await apiClient.post('/api/scraping/start', config)
    return response.data
  }

  // スクレイピング状況取得
  static async getScrapingStatus(): Promise<ScrapingStatusResponse> {
    const response = await apiClient.get('/api/scraping/status')
    return response.data
  }

  // スクレイピング停止
  static async stopScraping(): Promise<BaseResponse> {
    const response = await apiClient.post('/api/scraping/stop')
    return response.data
  }

  // スクレイピング履歴取得
  static async getScrapingHistory(limit = 10, offset = 0): Promise<any> {
    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    params.append('offset', offset.toString())
    
    const response = await apiClient.get(`/api/scraping/history?${params.toString()}`)
    return response.data
  }

  // スクレイピング設定取得
  static async getScrapingConfig(): Promise<any> {
    const response = await apiClient.get('/api/scraping/config')
    return response.data
  }

  // スクレイピング設定更新
  static async updateScrapingConfig(config: Record<string, any>): Promise<BaseResponse> {
    const response = await apiClient.put('/api/scraping/config', config)
    return response.data
  }
}

export default ScrapingService