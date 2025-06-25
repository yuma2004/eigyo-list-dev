// API共通型定義

export interface BaseResponse {
  success: boolean
  message: string
  timestamp: string
}

export interface ErrorResponse extends BaseResponse {
  success: false
  error_code?: string
  details?: Record<string, any>
}

// 企業関連の型定義
export interface Company {
  id?: number
  company_name: string
  url: string
  address?: string
  postal_code?: string
  prefecture?: string
  city?: string
  address_detail?: string
  tel?: string
  fax?: string
  representative?: string
  business_content?: string
  established_date?: string
  capital?: string
  contact_url?: string
  source_url?: string
  created_at?: string
  updated_at?: string
}

export interface CompanyResponse extends BaseResponse {
  company: Company
}

export interface CompaniesListResponse extends BaseResponse {
  companies: Company[]
  total: number
  page: number
  page_size: number
  has_next: boolean
}

export interface CompanyCreateResponse extends BaseResponse {
  company_id: number
}

// 営業ステータス関連の型定義
export interface SalesStatus {
  company_id: number
  status: string
  memo?: string
  contact_person?: string
  last_contact_date?: string
  next_action?: string
  updated_at?: string
}

export interface SalesStatusResponse extends BaseResponse {
  status: SalesStatus
}

export interface SalesDashboardResponse extends BaseResponse {
  summary: Record<string, number>
  total_companies: number
  recent_updates: Array<Record<string, any>>
  conversion_rate: number
}

// スクレイピング関連の型定義
export interface ScrapingConfig {
  keywords: string[]
  target_sites?: string[]
  max_pages?: number
  prefecture?: string
  industry?: string
}

export interface ScrapingResult {
  collected: number
  errors: number
  skipped: number
  execution_time?: number
  details?: Record<string, any>
}

export interface ScrapingResponse extends BaseResponse {
  result: ScrapingResult
}

export interface ScrapingStatusResponse extends BaseResponse {
  status: string // "idle" | "running" | "completed" | "error"
  progress: number
  collected: number
  total?: number
  current_url?: string
  estimated_remaining?: number
}

// フィルター関連の型定義
export interface CompanyFilters {
  status?: string
  prefecture?: string
  industry?: string
  keyword?: string
}

export interface PaginationParams {
  page?: number
  page_size?: number
}

// エクスポート関連の型定義
export interface ExportRequest {
  format: 'csv' | 'excel'
  status?: string
  prefecture?: string
  industry?: string
  date_from?: string
  date_to?: string
  include_sales_status?: boolean
}

// ヘルスチェック関連の型定義
export interface HealthCheckResponse {
  status: string
  timestamp: string
  version: string
  uptime?: number
}

export interface APIInfoResponse {
  title: string
  version: string
  description: string
  endpoints: Record<string, string>
}

// APIエラー型定義
export interface APIError {
  message: string
  status: number
  details?: Record<string, any>
}