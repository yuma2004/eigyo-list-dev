import apiClient from './api'
import type { HealthCheckResponse, APIInfoResponse } from '../types/api'

export class HealthService {
  // ヘルスチェック
  static async healthCheck(): Promise<HealthCheckResponse> {
    const response = await apiClient.get('/health')
    return response.data
  }

  // API情報取得
  static async getAPIInfo(): Promise<APIInfoResponse> {
    const response = await apiClient.get('/api/info')
    return response.data
  }
}

export default HealthService