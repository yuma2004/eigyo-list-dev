import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import ScrapingPage from '../ScrapingPage'

// React Query のモック
const mockUseScrapingStatus = vi.fn()
const mockUseScrapingHistory = vi.fn()
const mockUseScrapingConfig = vi.fn()
const mockUseStartScraping = vi.fn()
const mockUseStopScraping = vi.fn()
const mockUseUpdateScrapingConfig = vi.fn()

vi.mock('../../hooks/useScraping', () => ({
  useScrapingStatus: () => mockUseScrapingStatus(),
  useScrapingHistory: () => mockUseScrapingHistory(),
  useScrapingConfig: () => mockUseScrapingConfig(),
  useStartScraping: () => mockUseStartScraping(),
  useStopScraping: () => mockUseStopScraping(),
  useUpdateScrapingConfig: () => mockUseUpdateScrapingConfig(),
}))

// テスト用データ
const mockScrapingStatus = {
  status: 'idle',
  progress: 0,
  collected: 0,
  total: null,
  current_url: null,
  estimated_remaining: null,
}

const mockRunningStatus = {
  status: 'running',
  progress: 45,
  collected: 23,
  total: 50,
  current_url: 'https://example.com',
  estimated_remaining: 300,
}

const mockScrapingHistory = [
  {
    id: 1,
    execution_date: '2024-01-01T10:00:00Z',
    keyword: 'IT企業',
    collected_count: 25,
    success_count: 23,
    error_count: 2,
    status: '成功',
  },
  {
    id: 2,
    execution_date: '2024-01-02T14:00:00Z',
    keyword: '広告代理店',
    collected_count: 15,
    success_count: 15,
    error_count: 0,
    status: '成功',
  },
]

const mockScrapingConfig = {
  interval: 1,
  timeout: 30,
  max_pages_per_site: 100,
  user_agents: ['Mozilla/5.0...'],
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

describe('ScrapingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseStartScraping.mockReturnValue({ mutate: vi.fn(), isLoading: false })
    mockUseStopScraping.mockReturnValue({ mutate: vi.fn(), isLoading: false })
    mockUseUpdateScrapingConfig.mockReturnValue({ mutate: vi.fn(), isLoading: false })
  })

  it('should render scraping page title', () => {
    mockUseScrapingStatus.mockReturnValue({
      data: mockScrapingStatus,
      isLoading: false,
    })
    mockUseScrapingHistory.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    })
    mockUseScrapingConfig.mockReturnValue({
      data: { config: mockScrapingConfig },
      isLoading: false,
    })

    render(
      <TestWrapper>
        <ScrapingPage />
      </TestWrapper>
    )

    expect(screen.getByText('データ収集')).toBeInTheDocument()
    expect(screen.getByText('Webスクレイピングによる企業情報の自動収集を実行できます')).toBeInTheDocument()
  })

  it('should display scraping configuration form', () => {
    mockUseScrapingStatus.mockReturnValue({
      data: mockScrapingStatus,
      isLoading: false,
    })
    mockUseScrapingHistory.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    })
    mockUseScrapingConfig.mockReturnValue({
      data: { config: mockScrapingConfig },
      isLoading: false,
    })

    render(
      <TestWrapper>
        <ScrapingPage />
      </TestWrapper>
    )

    expect(screen.getByLabelText('検索キーワード')).toBeInTheDocument()
    expect(screen.getByLabelText('対象都道府県')).toBeInTheDocument()
    expect(screen.getByLabelText('対象業界')).toBeInTheDocument()
    expect(screen.getByLabelText('最大ページ数')).toBeInTheDocument()
  })

  it('should show start button when scraping is idle', () => {
    mockUseScrapingStatus.mockReturnValue({
      data: mockScrapingStatus,
      isLoading: false,
    })
    mockUseScrapingHistory.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    })
    mockUseScrapingConfig.mockReturnValue({
      data: { config: mockScrapingConfig },
      isLoading: false,
    })

    render(
      <TestWrapper>
        <ScrapingPage />
      </TestWrapper>
    )

    expect(screen.getByText('収集開始')).toBeInTheDocument()
    expect(screen.queryByText('収集停止')).not.toBeInTheDocument()
  })

  it('should show stop button when scraping is running', () => {
    mockUseScrapingStatus.mockReturnValue({
      data: mockRunningStatus,
      isLoading: false,
    })
    mockUseScrapingHistory.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    })
    mockUseScrapingConfig.mockReturnValue({
      data: { config: mockScrapingConfig },
      isLoading: false,
    })

    render(
      <TestWrapper>
        <ScrapingPage />
      </TestWrapper>
    )

    expect(screen.getByText('収集停止')).toBeInTheDocument()
    expect(screen.queryByText('収集開始')).not.toBeInTheDocument()
  })

  it('should display progress bar when scraping is running', () => {
    mockUseScrapingStatus.mockReturnValue({
      data: mockRunningStatus,
      isLoading: false,
    })
    mockUseScrapingHistory.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    })
    mockUseScrapingConfig.mockReturnValue({
      data: { config: mockScrapingConfig },
      isLoading: false,
    })

    render(
      <TestWrapper>
        <ScrapingPage />
      </TestWrapper>
    )

    expect(screen.getByText('45%')).toBeInTheDocument()
    expect(screen.getByText('23/50')).toBeInTheDocument()
    expect(screen.getByText('実行中')).toBeInTheDocument()
  })

  it('should display current URL when scraping is running', () => {
    mockUseScrapingStatus.mockReturnValue({
      data: mockRunningStatus,
      isLoading: false,
    })
    mockUseScrapingHistory.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    })
    mockUseScrapingConfig.mockReturnValue({
      data: { config: mockScrapingConfig },
      isLoading: false,
    })

    render(
      <TestWrapper>
        <ScrapingPage />
      </TestWrapper>
    )

    expect(screen.getByText('https://example.com')).toBeInTheDocument()
  })

  it('should display scraping history', () => {
    mockUseScrapingStatus.mockReturnValue({
      data: mockScrapingStatus,
      isLoading: false,
    })
    mockUseScrapingHistory.mockReturnValue({
      data: { history: mockScrapingHistory },
      isLoading: false,
    })
    mockUseScrapingConfig.mockReturnValue({
      data: { config: mockScrapingConfig },
      isLoading: false,
    })

    render(
      <TestWrapper>
        <ScrapingPage />
      </TestWrapper>
    )

    expect(screen.getByText('実行履歴')).toBeInTheDocument()
    expect(screen.getByText('IT企業')).toBeInTheDocument()
    expect(screen.getByText('広告代理店')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('should start scraping when form is submitted', async () => {
    const mockStart = vi.fn()
    mockUseStartScraping.mockReturnValue({ mutate: mockStart, isLoading: false })

    mockUseScrapingStatus.mockReturnValue({
      data: mockScrapingStatus,
      isLoading: false,
    })
    mockUseScrapingHistory.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    })
    mockUseScrapingConfig.mockReturnValue({
      data: { config: mockScrapingConfig },
      isLoading: false,
    })

    render(
      <TestWrapper>
        <ScrapingPage />
      </TestWrapper>
    )

    // フォーム入力
    const keywordInput = screen.getByLabelText('検索キーワード')
    fireEvent.change(keywordInput, { target: { value: 'IT企業,広告代理店' } })

    const maxPagesInput = screen.getByLabelText('最大ページ数')
    fireEvent.change(maxPagesInput, { target: { value: '20' } })

    // 開始ボタンクリック
    const startButton = screen.getByText('収集開始')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledWith({
        keywords: ['IT企業', '広告代理店'],
        max_pages: 20,
        target_sites: ['job_sites'],
        prefecture: undefined,
        industry: undefined,
      })
    })
  })

  it('should stop scraping when stop button clicked', async () => {
    const mockStop = vi.fn()
    mockUseStopScraping.mockReturnValue({ mutate: mockStop, isLoading: false })

    mockUseScrapingStatus.mockReturnValue({
      data: mockRunningStatus,
      isLoading: false,
    })
    mockUseScrapingHistory.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    })
    mockUseScrapingConfig.mockReturnValue({
      data: { config: mockScrapingConfig },
      isLoading: false,
    })

    render(
      <TestWrapper>
        <ScrapingPage />
      </TestWrapper>
    )

    const stopButton = screen.getByText('収集停止')
    fireEvent.click(stopButton)

    expect(mockStop).toHaveBeenCalled()
  })

  it('should validate required fields', async () => {
    mockUseScrapingStatus.mockReturnValue({
      data: mockScrapingStatus,
      isLoading: false,
    })
    mockUseScrapingHistory.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    })
    mockUseScrapingConfig.mockReturnValue({
      data: { config: mockScrapingConfig },
      isLoading: false,
    })

    render(
      <TestWrapper>
        <ScrapingPage />
      </TestWrapper>
    )

    // キーワードを空にして開始ボタンクリック
    const startButton = screen.getByText('収集開始')
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByText('検索キーワードを入力してください')).toBeInTheDocument()
    })
  })

  it('should show configuration settings', () => {
    mockUseScrapingStatus.mockReturnValue({
      data: mockScrapingStatus,
      isLoading: false,
    })
    mockUseScrapingHistory.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    })
    mockUseScrapingConfig.mockReturnValue({
      data: { config: mockScrapingConfig },
      isLoading: false,
    })

    render(
      <TestWrapper>
        <ScrapingPage />
      </TestWrapper>
    )

    expect(screen.getByText('詳細設定')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1')).toBeInTheDocument() // interval
    expect(screen.getByDisplayValue('30')).toBeInTheDocument() // timeout
    expect(screen.getByDisplayValue('100')).toBeInTheDocument() // max_pages_per_site
  })

  it('should update configuration when settings changed', async () => {
    const mockUpdateConfig = vi.fn()
    mockUseUpdateScrapingConfig.mockReturnValue({ mutate: mockUpdateConfig, isLoading: false })

    mockUseScrapingStatus.mockReturnValue({
      data: mockScrapingStatus,
      isLoading: false,
    })
    mockUseScrapingHistory.mockReturnValue({
      data: { history: [] },
      isLoading: false,
    })
    mockUseScrapingConfig.mockReturnValue({
      data: { config: mockScrapingConfig },
      isLoading: false,
    })

    render(
      <TestWrapper>
        <ScrapingPage />
      </TestWrapper>
    )

    const intervalInput = screen.getByDisplayValue('1')
    fireEvent.change(intervalInput, { target: { value: '2' } })

    const saveButton = screen.getByText('設定保存')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        interval: 2,
        timeout: 30,
        max_pages_per_site: 100,
      })
    })
  })
})