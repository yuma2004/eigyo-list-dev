import apiClient from './api'
import type { ExportRequest } from '../types/api'

export class ExportService {
  // CSV エクスポート
  static async exportCSV(filters?: Omit<ExportRequest, 'format'>): Promise<Blob> {
    const params = new URLSearchParams()
    
    if (filters?.status) params.append('status', filters.status)
    if (filters?.prefecture) params.append('prefecture', filters.prefecture)
    if (filters?.industry) params.append('industry', filters.industry)
    if (filters?.include_sales_status !== undefined) {
      params.append('include_sales_status', filters.include_sales_status.toString())
    }

    const response = await apiClient.get(`/api/export/csv?${params.toString()}`, {
      responseType: 'blob',
    })
    return response.data
  }

  // Excel エクスポート
  static async exportExcel(filters?: Omit<ExportRequest, 'format'>): Promise<Blob> {
    const params = new URLSearchParams()
    
    if (filters?.status) params.append('status', filters.status)
    if (filters?.prefecture) params.append('prefecture', filters.prefecture)
    if (filters?.industry) params.append('industry', filters.industry)
    if (filters?.include_sales_status !== undefined) {
      params.append('include_sales_status', filters.include_sales_status.toString())
    }

    const response = await apiClient.get(`/api/export/excel?${params.toString()}`, {
      responseType: 'blob',
    })
    return response.data
  }

  // テンプレート エクスポート
  static async exportTemplate(): Promise<Blob> {
    const response = await apiClient.get('/api/export/template', {
      responseType: 'blob',
    })
    return response.data
  }

  // エクスポート統計情報取得
  static async getExportStats(): Promise<any> {
    const response = await apiClient.get('/api/export/stats')
    return response.data
  }

  // ファイルダウンロードヘルパー
  static downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // CSV ダウンロード
  static async downloadCSV(filters?: Omit<ExportRequest, 'format'>, filename?: string): Promise<void> {
    const blob = await this.exportCSV(filters)
    const defaultFilename = `companies_${new Date().toISOString().split('T')[0]}.csv`
    this.downloadFile(blob, filename || defaultFilename)
  }

  // Excel ダウンロード
  static async downloadExcel(filters?: Omit<ExportRequest, 'format'>, filename?: string): Promise<void> {
    const blob = await this.exportExcel(filters)
    const defaultFilename = `companies_${new Date().toISOString().split('T')[0]}.xlsx`
    this.downloadFile(blob, filename || defaultFilename)
  }

  // テンプレート ダウンロード
  static async downloadTemplate(filename?: string): Promise<void> {
    const blob = await this.exportTemplate()
    this.downloadFile(blob, filename || 'companies_template.xlsx')
  }
}

export default ExportService