import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import CompanyDetail from '../CompanyDetail'

// React Router のモック
const mockUseParams = vi.fn()
const mockUseNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockUseNavigate(),
  }
})

// React Query のモック
const mockUseCompany = vi.fn()
const mockUseSalesStatus = vi.fn()
const mockUseUpdateCompany = vi.fn()
const mockUseUpdateSalesStatus = vi.fn()

vi.mock('../../hooks/useCompanies', () => ({
  useCompany: () => mockUseCompany(),
  useUpdateCompany: () => mockUseUpdateCompany(),
}))

vi.mock('../../hooks/useSales', () => ({
  useSalesStatus: () => mockUseSalesStatus(),
  useUpdateSalesStatus: () => mockUseUpdateSalesStatus(),
}))

// テスト用データ
const mockCompany = {
  id: 1,
  company_name: 'テスト株式会社',
  url: 'https://test.com',
  address: '東京都渋谷区1-1-1',
  postal_code: '150-0001',
  prefecture: '東京都',
  city: '渋谷区',
  address_detail: '1-1-1',
  tel: '03-1234-5678',
  fax: '03-1234-5679',
  representative: '山田太郎',
  business_content: 'IT事業',
  established_date: '2020-01-01',
  capital: '1000万円',
  contact_url: 'https://test.com/contact',
  source_url: 'https://source.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockSalesStatus = {
  company_id: 1,
  status: '未着手',
  memo: '初回アプローチ予定',
  contact_person: '田中',
  last_contact_date: '2024-01-01',
  next_action: '電話でのアプローチ',
  updated_at: '2024-01-01T00:00:00Z',
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

describe('CompanyDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ id: '1' })
    mockUseNavigate.mockReturnValue(vi.fn())
    mockUseUpdateCompany.mockReturnValue({ mutate: vi.fn(), isLoading: false })
    mockUseUpdateSalesStatus.mockReturnValue({ mutate: vi.fn(), isLoading: false })
  })

  it('should render company detail page title', () => {
    mockUseCompany.mockReturnValue({
      data: { company: mockCompany },
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatus.mockReturnValue({
      data: { status: mockSalesStatus },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompanyDetail />
      </TestWrapper>
    )

    expect(screen.getByText('企業詳細')).toBeInTheDocument()
    expect(screen.getByText('企業の詳細情報と営業履歴を確認できます')).toBeInTheDocument()
  })

  it('should display loading state', () => {
    mockUseCompany.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    mockUseSalesStatus.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompanyDetail />
      </TestWrapper>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should display company not found error', () => {
    mockUseCompany.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: { response: { status: 404 } },
    })
    mockUseSalesStatus.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompanyDetail />
      </TestWrapper>
    )

    expect(screen.getByText('企業が見つかりません')).toBeInTheDocument()
  })

  it('should display company information', () => {
    mockUseCompany.mockReturnValue({
      data: { company: mockCompany },
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatus.mockReturnValue({
      data: { status: mockSalesStatus },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompanyDetail />
      </TestWrapper>
    )

    expect(screen.getByText('テスト株式会社')).toBeInTheDocument()
    expect(screen.getByText('https://test.com')).toBeInTheDocument()
    expect(screen.getByText('東京都渋谷区1-1-1')).toBeInTheDocument()
    expect(screen.getByText('03-1234-5678')).toBeInTheDocument()
    expect(screen.getByText('山田太郎')).toBeInTheDocument()
    expect(screen.getByText('IT事業')).toBeInTheDocument()
  })

  it('should display sales status information', () => {
    mockUseCompany.mockReturnValue({
      data: { company: mockCompany },
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatus.mockReturnValue({
      data: { status: mockSalesStatus },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompanyDetail />
      </TestWrapper>
    )

    expect(screen.getByText('営業ステータス')).toBeInTheDocument()
    expect(screen.getByText('未着手')).toBeInTheDocument()
    expect(screen.getByText('初回アプローチ予定')).toBeInTheDocument()
    expect(screen.getByText('田中')).toBeInTheDocument()
    expect(screen.getByText('電話でのアプローチ')).toBeInTheDocument()
  })

  it('should show edit company button', () => {
    mockUseCompany.mockReturnValue({
      data: { company: mockCompany },
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatus.mockReturnValue({
      data: { status: mockSalesStatus },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompanyDetail />
      </TestWrapper>
    )

    expect(screen.getByText('企業情報編集')).toBeInTheDocument()
  })

  it('should show update sales status button', () => {
    mockUseCompany.mockReturnValue({
      data: { company: mockCompany },
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatus.mockReturnValue({
      data: { status: mockSalesStatus },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompanyDetail />
      </TestWrapper>
    )

    expect(screen.getByText('ステータス更新')).toBeInTheDocument()
  })

  it('should open edit modal when edit button clicked', async () => {
    mockUseCompany.mockReturnValue({
      data: { company: mockCompany },
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatus.mockReturnValue({
      data: { status: mockSalesStatus },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompanyDetail />
      </TestWrapper>
    )

    const editButton = screen.getByText('企業情報編集')
    fireEvent.click(editButton)

    await waitFor(() => {
      expect(screen.getByText('企業情報を編集')).toBeInTheDocument()
    })
  })

  it('should open sales status modal when status button clicked', async () => {
    mockUseCompany.mockReturnValue({
      data: { company: mockCompany },
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatus.mockReturnValue({
      data: { status: mockSalesStatus },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompanyDetail />
      </TestWrapper>
    )

    const statusButton = screen.getByText('ステータス更新')
    fireEvent.click(statusButton)

    await waitFor(() => {
      expect(screen.getByText('営業ステータスを更新')).toBeInTheDocument()
    })
  })

  it('should show back button', () => {
    mockUseCompany.mockReturnValue({
      data: { company: mockCompany },
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatus.mockReturnValue({
      data: { status: mockSalesStatus },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompanyDetail />
      </TestWrapper>
    )

    expect(screen.getByText('戻る')).toBeInTheDocument()
  })

  it('should navigate back when back button clicked', () => {
    const mockNavigate = vi.fn()
    mockUseNavigate.mockReturnValue(mockNavigate)
    
    mockUseCompany.mockReturnValue({
      data: { company: mockCompany },
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatus.mockReturnValue({
      data: { status: mockSalesStatus },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompanyDetail />
      </TestWrapper>
    )

    const backButton = screen.getByText('戻る')
    fireEvent.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/companies')
  })

  it('should display company website link', () => {
    mockUseCompany.mockReturnValue({
      data: { company: mockCompany },
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatus.mockReturnValue({
      data: { status: mockSalesStatus },
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <CompanyDetail />
      </TestWrapper>
    )

    const websiteLink = screen.getByRole('link', { name: 'https://test.com' })
    expect(websiteLink).toHaveAttribute('href', 'https://test.com')
    expect(websiteLink).toHaveAttribute('target', '_blank')
  })
})