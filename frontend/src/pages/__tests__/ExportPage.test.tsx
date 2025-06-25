import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import ExportPage from '../ExportPage'

// Export Service のモック
const mockExportService = {
  downloadCSV: vi.fn(),
  downloadExcel: vi.fn(),
  downloadTemplate: vi.fn(),
  getExportStats: vi.fn(),
}

vi.mock('../../services/exportService', () => ({
  default: mockExportService,
}))

// React Query のモック
const mockUseQuery = vi.fn()

vi.mock('react-query', async () => {
  const actual = await vi.importActual('react-query')
  return {
    ...actual,
    useQuery: () => mockUseQuery(),
  }
})

// テスト用データ
const mockExportStats = {
  total_companies: 150,
  status_summary: {
    '未着手': 80,
    'アプローチ中': 30,
    '商談中': 20,
    '成約': 15,
    '見送り': 5,
  },
  prefecture_summary: {
    '東京都': 50,
    '大阪府': 30,
    '愛知県': 25,
    '神奈川県': 20,
    'その他': 25,
  },
  last_updated: '2024-01-01T12:00:00Z',
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
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

describe('ExportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuery.mockReturnValue({
      data: mockExportStats,
      isLoading: false,
      isError: false,
    })
  })

  it('should render export page title', () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    expect(screen.getByText('エクスポート')).toBeInTheDocument()
    expect(screen.getByText('企業リストをCSVやExcel形式でエクスポートできます')).toBeInTheDocument()
  })

  it('should display export statistics', () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    expect(screen.getByText('150件')).toBeInTheDocument() // total companies
    expect(screen.getByText('80')).toBeInTheDocument() // 未着手
    expect(screen.getByText('30')).toBeInTheDocument() // アプローチ中
    expect(screen.getByText('50')).toBeInTheDocument() // 東京都
  })

  it('should show export format options', () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    expect(screen.getByText('CSV形式')).toBeInTheDocument()
    expect(screen.getByText('Excel形式')).toBeInTheDocument()
    expect(screen.getByText('テンプレート')).toBeInTheDocument()
  })

  it('should show filter options', () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    expect(screen.getByLabelText('営業ステータス')).toBeInTheDocument()
    expect(screen.getByLabelText('都道府県')).toBeInTheDocument()
    expect(screen.getByLabelText('業界')).toBeInTheDocument()
    expect(screen.getByText('営業ステータスを含める')).toBeInTheDocument()
  })

  it('should export CSV when CSV button clicked', async () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    const csvButton = screen.getByText('CSV形式でエクスポート')
    fireEvent.click(csvButton)

    await waitFor(() => {
      expect(mockExportService.downloadCSV).toHaveBeenCalledWith({
        status: undefined,
        prefecture: undefined,
        industry: undefined,
        include_sales_status: true,
      })
    })
  })

  it('should export Excel when Excel button clicked', async () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    const excelButton = screen.getByText('Excel形式でエクスポート')
    fireEvent.click(excelButton)

    await waitFor(() => {
      expect(mockExportService.downloadExcel).toHaveBeenCalledWith({
        status: undefined,
        prefecture: undefined,
        industry: undefined,
        include_sales_status: true,
      })
    })
  })

  it('should download template when template button clicked', async () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    const templateButton = screen.getByText('テンプレートをダウンロード')
    fireEvent.click(templateButton)

    await waitFor(() => {
      expect(mockExportService.downloadTemplate).toHaveBeenCalled()
    })
  })

  it('should apply filters when exporting', async () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    // フィルター設定
    const statusSelect = screen.getByLabelText('営業ステータス')
    fireEvent.change(statusSelect, { target: { value: 'アプローチ中' } })

    const prefectureSelect = screen.getByLabelText('都道府県')
    fireEvent.change(prefectureSelect, { target: { value: '東京都' } })

    const industrySelect = screen.getByLabelText('業界')
    fireEvent.change(industrySelect, { target: { value: 'IT' } })

    // 営業ステータス含めるチェックを外す
    const includeStatusCheckbox = screen.getByLabelText('営業ステータスを含める')
    fireEvent.click(includeStatusCheckbox)

    // CSVエクスポート
    const csvButton = screen.getByText('CSV形式でエクスポート')
    fireEvent.click(csvButton)

    await waitFor(() => {
      expect(mockExportService.downloadCSV).toHaveBeenCalledWith({
        status: 'アプローチ中',
        prefecture: '東京都',
        industry: 'IT',
        include_sales_status: false,
      })
    })
  })

  it('should show preview when preview button clicked', async () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    const previewButton = screen.getByText('プレビュー')
    fireEvent.click(previewButton)

    await waitFor(() => {
      expect(screen.getByText('エクスポートプレビュー')).toBeInTheDocument()
    })
  })

  it('should validate date range filters', async () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    const fromDate = screen.getByLabelText('作成日（開始）')
    const toDate = screen.getByLabelText('作成日（終了）')

    // 終了日を開始日より前に設定
    fireEvent.change(fromDate, { target: { value: '2024-01-10' } })
    fireEvent.change(toDate, { target: { value: '2024-01-05' } })

    const csvButton = screen.getByText('CSV形式でエクスポート')
    fireEvent.click(csvButton)

    await waitFor(() => {
      expect(screen.getByText('終了日は開始日以降を選択してください')).toBeInTheDocument()
    })
  })

  it('should show loading state during export', async () => {
    // ダウンロードを遅延させるモック
    mockExportService.downloadCSV.mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    )

    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    const csvButton = screen.getByText('CSV形式でエクスポート')
    fireEvent.click(csvButton)

    expect(screen.getByText('エクスポート中...')).toBeInTheDocument()
  })

  it('should handle export errors', async () => {
    mockExportService.downloadCSV.mockRejectedValue(new Error('Export failed'))

    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    const csvButton = screen.getByText('CSV形式でエクスポート')
    fireEvent.click(csvButton)

    await waitFor(() => {
      expect(screen.getByText('エクスポートに失敗しました')).toBeInTheDocument()
    })
  })

  it('should display loading state for stats', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should display error state for stats', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    expect(screen.getByText('統計情報の取得に失敗しました')).toBeInTheDocument()
  })

  it('should show export history', () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    expect(screen.getByText('エクスポート履歴')).toBeInTheDocument()
  })

  it('should reset filters when reset button clicked', async () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    // フィルター設定
    const statusSelect = screen.getByLabelText('営業ステータス')
    fireEvent.change(statusSelect, { target: { value: 'アプローチ中' } })

    // リセットボタンクリック
    const resetButton = screen.getByText('リセット')
    fireEvent.click(resetButton)

    await waitFor(() => {
      expect(statusSelect).toHaveValue('')
    })
  })

  it('should show export count estimate', () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    expect(screen.getByText('エクスポート対象: 150件')).toBeInTheDocument()
  })

  it('should update export count when filters applied', async () => {
    render(
      <TestWrapper>
        <ExportPage />
      </TestWrapper>
    )

    const statusSelect = screen.getByLabelText('営業ステータス')
    fireEvent.change(statusSelect, { target: { value: 'アプローチ中' } })

    await waitFor(() => {
      expect(screen.getByText('エクスポート対象: 30件')).toBeInTheDocument()
    })
  })
})