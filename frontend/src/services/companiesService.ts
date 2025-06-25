import apiClient from './api'
import type {
  Company,
  CompanyResponse,
  CompaniesListResponse,
  CompanyCreateResponse,
  CompanyFilters,
  PaginationParams,
  BaseResponse,
} from '../types/api'

export class CompaniesService {
  // 企業一覧取得
  static async getCompanies(
    filters?: CompanyFilters,
    pagination?: PaginationParams
  ): Promise<CompaniesListResponse> {
    const params = new URLSearchParams()
    
    if (pagination?.page) params.append('page', pagination.page.toString())
    if (pagination?.page_size) params.append('page_size', pagination.page_size.toString())
    if (filters?.status) params.append('status', filters.status)
    if (filters?.prefecture) params.append('prefecture', filters.prefecture)
    if (filters?.industry) params.append('industry', filters.industry)
    if (filters?.keyword) params.append('keyword', filters.keyword)

    const response = await apiClient.get(`/api/companies?${params.toString()}`)
    return response.data
  }

  // 企業詳細取得
  static async getCompany(id: number): Promise<CompanyResponse> {
    const response = await apiClient.get(`/api/companies/${id}`)
    return response.data
  }

  // 企業作成
  static async createCompany(company: Company): Promise<CompanyCreateResponse> {
    const response = await apiClient.post('/api/companies', company)
    return response.data
  }

  // 企業更新
  static async updateCompany(id: number, company: Partial<Company>): Promise<BaseResponse> {
    const response = await apiClient.put(`/api/companies/${id}`, company)
    return response.data
  }

  // 企業削除
  static async deleteCompany(id: number): Promise<BaseResponse> {
    const response = await apiClient.delete(`/api/companies/${id}`)
    return response.data
  }

  // 重複チェック
  static async checkDuplicate(id: number): Promise<any> {
    const response = await apiClient.get(`/api/companies/${id}/duplicate-check`)
    return response.data
  }
}

export default CompaniesService