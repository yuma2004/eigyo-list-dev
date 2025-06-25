import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import CompaniesList from '../CompaniesList'

// React Query のモック
const mockUseCompanies = vi.fn()
const mockUseCreateCompany = vi.fn()
const mockUseUpdateCompany = vi.fn()
const mockUseDeleteCompany = vi.fn()

vi.mock('../../hooks/useCompanies', () => ({
  useCompanies: () => mockUseCompanies(),
  useCreateCompany: () => mockUseCreateCompany(),
  useUpdateCompany: () => mockUseUpdateCompany(),
  useDeleteCompany: () => mockUseDeleteCompany(),
}))

// テスト用企業データ
const mockCompanies = [
  {
    id: 1,
    company_name: 'テスト株式会社',
    url: 'https://test.com',
    address: '東京都渋谷区1-1-1',
    tel: '03-1234-5678',
    representative: '山田太郎',
    business_content: 'IT事業',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    company_name: 'サンプル企業',
    url: 'https://sample.com',
    address: '大阪府大阪市2-2-2',
    tel: '06-1234-5678',
    representative: '田中花子',
    business_content: '広告代理店',
    created_at: '2024-01-02T00:00:00Z',
  },
]

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

describe('CompaniesList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCreateCompany.mockReturnValue({ mutate: vi.fn(), isLoading: false })
    mockUseUpdateCompany.mockReturnValue({ mutate: vi.fn(), isLoading: false })
    mockUseDeleteCompany.mockReturnValue({ mutate: vi.fn(), isLoading: false })
  })

  it('should render companies list page title', () => {
    mockUseCompanies.mockReturnValue({
      data: { companies: [], total: 0 },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompaniesList />
      </TestWrapper>
    )

    expect(screen.getByText('企業管理')).toBeInTheDocument()
    expect(screen.getByText('収集した企業情報の確認・編集・管理ができます')).toBeInTheDocument()
  })

  it('should display loading state', () => {
    mockUseCompanies.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompaniesList />
      </TestWrapper>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should display error state', () => {
    mockUseCompanies.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('API Error'),
    })

    render(
      <TestWrapper>
        <CompaniesList />
      </TestWrapper>
    )

    expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
  })

  it('should display companies in table', () => {
    mockUseCompanies.mockReturnValue({
      data: { companies: mockCompanies, total: 2 },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompaniesList />
      </TestWrapper>
    )

    expect(screen.getByText('テスト株式会社')).toBeInTheDocument()
    expect(screen.getByText('サンプル企業')).toBeInTheDocument()
    expect(screen.getByText('https://test.com')).toBeInTheDocument()
    expect(screen.getByText('山田太郎')).toBeInTheDocument()
  })

  it('should show search and filter controls', () => {
    mockUseCompanies.mockReturnValue({
      data: { companies: [], total: 0 },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompaniesList />
      </TestWrapper>
    )

    expect(screen.getByPlaceholderText('会社名で検索')).toBeInTheDocument()
    expect(screen.getByText('ステータス')).toBeInTheDocument()
    expect(screen.getByText('都道府県')).toBeInTheDocument()
  })

  it('should show action buttons', () => {
    mockUseCompanies.mockReturnValue({
      data: { companies: [], total: 0 },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompaniesList />
      </TestWrapper>
    )

    expect(screen.getByText('新規追加')).toBeInTheDocument()
    expect(screen.getByText('CSV出力')).toBeInTheDocument()
    expect(screen.getByText('Excel出力')).toBeInTheDocument()
  })

  it('should handle search input', async () => {
    mockUseCompanies.mockReturnValue({
      data: { companies: [], total: 0 },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompaniesList />
      </TestWrapper>
    )

    const searchInput = screen.getByPlaceholderText('会社名で検索')
    fireEvent.change(searchInput, { target: { value: 'テスト' } })

    await waitFor(() => {
      expect(searchInput).toHaveValue('テスト')
    })
  })

  it('should open create modal when new company button clicked', async () => {
    mockUseCompanies.mockReturnValue({
      data: { companies: [], total: 0 },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompaniesList />
      </TestWrapper>
    )

    const addButton = screen.getByText('新規追加')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('企業登録')).toBeInTheDocument()
    })
  })

  it('should show pagination when there are many companies', () => {
    mockUseCompanies.mockReturnValue({
      data: { 
        companies: mockCompanies, 
        total: 150,
        page: 1,
        page_size: 100,
        has_next: true 
      },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompaniesList />
      </TestWrapper>
    )

    expect(screen.getByText('150件')).toBeInTheDocument()
  })

  it('should handle edit company action', async () => {
    mockUseCompanies.mockReturnValue({
      data: { companies: mockCompanies, total: 2 },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompaniesList />
      </TestWrapper>
    )

    const editButtons = screen.getAllByText('編集')
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByText('企業編集')).toBeInTheDocument()
    })
  })

  it('should handle delete company action', async () => {
    const mockDelete = vi.fn()
    mockUseDeleteCompany.mockReturnValue({ mutate: mockDelete, isLoading: false })
    
    mockUseCompanies.mockReturnValue({
      data: { companies: mockCompanies, total: 2 },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompaniesList />
      </TestWrapper>
    )

    const deleteButtons = screen.getAllByText('削除')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText('削除確認')).toBeInTheDocument()
    })

    const confirmButton = screen.getByText('削除')
    fireEvent.click(confirmButton)

    expect(mockDelete).toHaveBeenCalledWith(1)
  })

  it('should show empty state when no companies', () => {
    mockUseCompanies.mockReturnValue({
      data: { companies: [], total: 0 },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompaniesList />
      </TestWrapper>
    )

    expect(screen.getByText('企業データがありません')).toBeInTheDocument()
    expect(screen.getByText('データ収集を開始して企業情報を追加しましょう')).toBeInTheDocument()
  })
})