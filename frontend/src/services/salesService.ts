import apiClient from './api'
import type {
  SalesStatus,
  SalesStatusResponse,
  SalesDashboardResponse,
  BaseResponse,
} from '../types/api'

export interface SalesStatusUpdateRequest {
  status: string
  memo?: string
  contact_person?: string
  next_action?: string
}

export class SalesService {
  // 営業ステータス取得
  static async getSalesStatus(companyId: number): Promise<SalesStatusResponse> {
    const response = await apiClient.get(`/api/sales/${companyId}`)
    return response.data
  }

  // 営業ステータス更新
  static async updateSalesStatus(
    companyId: number,
    statusData: SalesStatusUpdateRequest
  ): Promise<BaseResponse> {
    const response = await apiClient.put(`/api/sales/${companyId}`, statusData)
    return response.data
  }

  // 営業ステータス一覧取得
  static async getSalesStatuses(
    filters?: {
      status?: string
      contact_person?: string
    },
    pagination?: {
      limit?: number
      offset?: number
    }
  ): Promise<SalesStatusResponse[]> {
    const params = new URLSearchParams()
    
    if (filters?.status) params.append('status', filters.status)
    if (filters?.contact_person) params.append('contact_person', filters.contact_person)
    if (pagination?.limit) params.append('limit', pagination.limit.toString())
    if (pagination?.offset) params.append('offset', pagination.offset.toString())

    const response = await apiClient.get(`/api/sales?${params.toString()}`)
    return response.data
  }

  // 営業ダッシュボード取得
  static async getSalesDashboard(): Promise<SalesDashboardResponse> {
    const response = await apiClient.get('/api/sales/dashboard')
    return response.data
  }

  // フォローアップ予定設定
  static async scheduleFollowUp(
    companyId: number,
    followUpData: Record<string, any>
  ): Promise<BaseResponse> {
    const response = await apiClient.post(`/api/sales/${companyId}/follow-up`, followUpData)
    return response.data
  }

  // 今後のフォローアップ予定取得
  static async getUpcomingFollowUps(days = 7): Promise<any> {
    const params = new URLSearchParams()
    params.append('days', days.toString())
    
    const response = await apiClient.get(`/api/sales/follow-ups/upcoming?${params.toString()}`)
    return response.data
  }

  // 成約率分析取得
  static async getConversionAnalytics(period: 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<any> {
    const params = new URLSearchParams()
    params.append('period', period)
    
    const response = await apiClient.get(`/api/sales/analytics/conversion?${params.toString()}`)
    return response.data
  }
}

export default SalesService