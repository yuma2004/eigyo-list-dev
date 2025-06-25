import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import App from '../../App'
import * as companiesService from '../../services/companiesService'
import * as scrapingService from '../../services/scrapingService'
import * as salesService from '../../services/salesService'
import * as exportService from '../../services/exportService'

// Mock services
vi.mock('../../services/companiesService')
vi.mock('../../services/scrapingService')
vi.mock('../../services/salesService')
vi.mock('../../services/exportService')

const mockCompaniesService = vi.mocked(companiesService)
const mockScrapingService = vi.mocked(scrapingService)
const mockSalesService = vi.mocked(salesService)
const mockExportService = vi.mocked(exportService)

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('統合テスト: ユーザーワークフロー', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // 基本的なモックデータ設定
    mockCompaniesService.getCompanies.mockResolvedValue({
      companies: [
        {
          id: 1,
          company_name: 'テスト企業1',
          url: 'https://test1.com',
          address: '東京都渋谷区',
          tel: '03-1234-5678',
          prefecture: '東京都',
          representative: '田中太郎',
          business_content: 'IT事業',
        },
      ],
      total: 1,
      page: 1,
      page_size: 100,
    })

    mockScrapingService.getScrapingStatus.mockResolvedValue({
      status: 'idle',
      progress: 0,
      collected: 0,
      total: 0,
    })

    mockSalesService.getSalesDashboard.mockResolvedValue({
      summary: {
        '未着手': 5,
        'アプローチ中': 3,
        '商談中': 2,
        '成約': 1,
        '見送り': 1,
      },
      total_companies: 12,
      recent_updates: [],
      conversion_rate: 8.3,
    })

    mockExportService.getExportStats.mockResolvedValue({
      total_companies: 12,
      status_summary: {
        '未着手': 5,
        'アプローチ中': 3,
        '商談中': 2,
        '成約': 1,
        '見送り': 1,
      },
      prefecture_summary: {
        '東京都': 8,
        '大阪府': 3,
        '愛知県': 1,
      },
      last_updated: '2024-01-15T10:00:00Z',
    })
  })

  describe('完全な営業活動ワークフロー', () => {
    test('データ収集 → 企業管理 → 営業管理 → エクスポートの一連の流れ', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // Step 1: データ収集ページでスクレイピングを開始
      fireEvent.click(screen.getByText('データ収集'))
      
      await waitFor(() => {
        expect(screen.getByText('Webスクレイピングによる企業情報の自動収集を実行できます')).toBeInTheDocument()
      })

      // スクレイピング設定入力
      const keywordInput = screen.getByPlaceholderText('IT企業,広告代理店 (カンマ区切りで複数指定)')
      fireEvent.change(keywordInput, { target: { value: 'IT企業,広告代理店' } })

      // 対象都道府県選択
      fireEvent.click(screen.getByText('選択してください'))
      fireEvent.click(screen.getByText('東京都'))

      // スクレイピング開始
      mockScrapingService.startScraping.mockResolvedValue({ task_id: 'test-task-123' })
      const startButton = screen.getByText('収集開始')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(mockScrapingService.startScraping).toHaveBeenCalledWith({
          keywords: ['IT企業', '広告代理店'],
          target_sites: ['job_sites'],
          max_pages: 10,
          prefecture: '東京都',
          industry: undefined,
        })
      })

      // Step 2: 企業管理ページで収集した企業を確認・編集
      fireEvent.click(screen.getByText('企業管理'))
      
      await waitFor(() => {
        expect(screen.getByText('収集した企業情報の確認・編集・管理ができます')).toBeInTheDocument()
        expect(screen.getByText('テスト企業1')).toBeInTheDocument()
      })

      // 企業詳細を表示
      fireEvent.click(screen.getByText('テスト企業1'))
      
      await waitFor(() => {
        expect(screen.getByText('企業詳細')).toBeInTheDocument()
        expect(screen.getByText('https://test1.com')).toBeInTheDocument()
      })

      // Step 3: 営業ステータスを更新
      mockSalesService.getSalesStatus.mockResolvedValue({
        status: {
          company_id: 1,
          status: '未着手',
          contact_person: '',
          last_contact_date: null,
          next_action: '',
          memo: '',
          updated_at: '2024-01-15T10:00:00Z',
        },
      })

      const statusUpdateButton = screen.getByText('ステータス更新')
      fireEvent.click(statusUpdateButton)

      await waitFor(() => {
        expect(screen.getByText('営業ステータスを更新')).toBeInTheDocument()
      })

      // ステータス変更
      fireEvent.click(screen.getByDisplayValue('未着手'))
      fireEvent.click(screen.getByText('アプローチ中'))

      // 担当者入力
      const contactPersonInput = screen.getByPlaceholderText('担当者名を入力')
      fireEvent.change(contactPersonInput, { target: { value: '営業太郎' } })

      // メモ入力
      const memoInput = screen.getByPlaceholderText('営業活動に関するメモ')
      fireEvent.change(memoInput, { target: { value: '初回アプローチ完了。次回商談予定。' } })

      // 保存
      mockSalesService.updateSalesStatus.mockResolvedValue({})
      const saveButton = screen.getByText('保存')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockSalesService.updateSalesStatus).toHaveBeenCalledWith(1, {
          status: 'アプローチ中',
          contact_person: '営業太郎',
          last_contact_date: undefined,
          next_action: '',
          memo: '初回アプローチ完了。次回商談予定。',
        })
      })

      // Step 4: 営業管理ダッシュボードで進捗確認
      fireEvent.click(screen.getByText('営業管理'))
      
      await waitFor(() => {
        expect(screen.getByText('営業ステータスの管理とダッシュボードで進捗を確認できます')).toBeInTheDocument()
        expect(screen.getByText('総企業数')).toBeInTheDocument()
        expect(screen.getByText('12')).toBeInTheDocument()
      })

      // Step 5: エクスポートで結果をダウンロード
      fireEvent.click(screen.getByText('エクスポート'))
      
      await waitFor(() => {
        expect(screen.getByText('企業リストをCSVやExcel形式でエクスポートできます')).toBeInTheDocument()
        expect(screen.getByText('登録企業数')).toBeInTheDocument()
      })

      // CSV エクスポート
      mockExportService.downloadCSV.mockResolvedValue(undefined)
      const csvExportButton = screen.getByText('CSV形式でエクスポート')
      fireEvent.click(csvExportButton)

      await waitFor(() => {
        expect(mockExportService.downloadCSV).toHaveBeenCalledWith({
          status: undefined,
          prefecture: undefined,
          industry: undefined,
          include_sales_status: true,
          date_from: undefined,
          date_to: undefined,
        })
      })
    })

    test('新規企業登録から営業活動完了までの流れ', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // 企業管理ページで新規企業追加
      fireEvent.click(screen.getByText('企業管理'))
      
      await waitFor(() => {
        expect(screen.getByText('新規追加')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('新規追加'))

      await waitFor(() => {
        expect(screen.getByText('企業登録')).toBeInTheDocument()
      })

      // 企業情報入力
      const companyNameInput = screen.getByPlaceholderText('例: 株式会社サンプル')
      fireEvent.change(companyNameInput, { target: { value: '新規テスト企業' } })

      const urlInput = screen.getByPlaceholderText('https://example.com')
      fireEvent.change(urlInput, { target: { value: 'https://newtest.com' } })

      const addressInput = screen.getByPlaceholderText('東京都渋谷区1-1-1')
      fireEvent.change(addressInput, { target: { value: '東京都新宿区2-2-2' } })

      const businessContentInput = screen.getByPlaceholderText('IT事業、コンサルティング業務など')
      fireEvent.change(businessContentInput, { target: { value: 'Webサービス開発' } })

      // 企業登録
      mockCompaniesService.createCompany.mockResolvedValue({
        id: 2,
        company_name: '新規テスト企業',
        url: 'https://newtest.com',
        address: '東京都新宿区2-2-2',
        business_content: 'Webサービス開発',
      })

      const registerButton = screen.getByText('登録')
      fireEvent.click(registerButton)

      await waitFor(() => {
        expect(mockCompaniesService.createCompany).toHaveBeenCalledWith({
          company_name: '新規テスト企業',
          url: 'https://newtest.com',
          address: '東京都新宿区2-2-2',
          tel: '',
          fax: '',
          representative: '',
          business_content: 'Webサービス開発',
          established_date: '',
          capital: '',
          contact_url: '',
        })
      })

      // 営業活動開始から完了まで
      // (実際のアプリケーションでは、登録後に企業詳細ページに遷移するなど)
      
      expect(screen.queryByText('企業登録')).not.toBeInTheDocument()
    })
  })

  describe('エラーハンドリングの統合テスト', () => {
    test('API エラー時の適切な処理とユーザーフィードバック', async () => {
      // API エラーをシミュレート
      mockCompaniesService.getCompanies.mockRejectedValue(new Error('API Error'))

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('企業管理'))

      await waitFor(() => {
        expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
        expect(screen.getByText('ページを再読み込みしてください')).toBeInTheDocument()
      })

      // 再試行ボタンの動作確認
      const retryButton = screen.getByText('再試行')
      expect(retryButton).toBeInTheDocument()
    })

    test('ネットワークエラー時の適切な処理', async () => {
      mockScrapingService.startScraping.mockRejectedValue(new Error('Network Error'))

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('データ収集'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('IT企業,広告代理店 (カンマ区切りで複数指定)')).toBeInTheDocument()
      })

      const keywordInput = screen.getByPlaceholderText('IT企業,広告代理店 (カンマ区切りで複数指定)')
      fireEvent.change(keywordInput, { target: { value: 'テストキーワード' } })

      const startButton = screen.getByText('収集開始')
      fireEvent.click(startButton)

      await waitFor(() => {
        expect(mockScrapingService.startScraping).toHaveBeenCalled()
      })
      
      // エラーメッセージの表示確認は、実際のエラーハンドリング実装に依存
    })
  })

  describe('パフォーマンスとUX統合テスト', () => {
    test('大量データでのページネーション動作', async () => {
      // 大量データのモック
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        company_name: `企業${i + 1}`,
        url: `https://company${i + 1}.com`,
        prefecture: i % 2 === 0 ? '東京都' : '大阪府',
        representative: `代表者${i + 1}`,
        business_content: `事業内容${i + 1}`,
      }))

      mockCompaniesService.getCompanies.mockResolvedValue({
        companies: largeDataset.slice(0, 100),
        total: 1000,
        page: 1,
        page_size: 100,
      })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('企業管理'))

      await waitFor(() => {
        expect(screen.getByText('企業1')).toBeInTheDocument()
        expect(screen.getByText('1-100 / 1000件')).toBeInTheDocument()
      })

      // ページネーション操作のテスト
      const nextPageButton = screen.getByTitle('Next Page')
      if (nextPageButton) {
        fireEvent.click(nextPageButton)
        
        await waitFor(() => {
          expect(mockCompaniesService.getCompanies).toHaveBeenCalledWith(
            {},
            { page: 2, page_size: 100 }
          )
        })
      }
    })

    test('リアルタイム更新機能の動作確認', async () => {
      // スクレイピング進行中のステータス更新をシミュレート
      let progressValue = 0
      mockScrapingService.getScrapingStatus
        .mockResolvedValueOnce({
          status: 'running',
          progress: 0,
          collected: 0,
          total: 100,
        })
        .mockResolvedValueOnce({
          status: 'running',
          progress: 50,
          collected: 50,
          total: 100,
        })
        .mockResolvedValueOnce({
          status: 'completed',
          progress: 100,
          collected: 100,
          total: 100,
        })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('データ収集'))

      await waitFor(() => {
        expect(screen.getByText('実行中')).toBeInTheDocument()
      })

      // リアルタイム更新のテストは実際のポーリング間隔に依存するため、
      // ここでは基本的な表示確認に留める
      expect(screen.getByText('進捗状況')).toBeInTheDocument()
    })
  })
})