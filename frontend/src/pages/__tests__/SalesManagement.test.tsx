import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import SalesManagement from '../SalesManagement'

// React Query のモック
const mockUseSalesDashboard = vi.fn()
const mockUseSalesStatuses = vi.fn()
const mockUseUpcomingFollowUps = vi.fn()
const mockUseConversionAnalytics = vi.fn()
const mockUseUpdateSalesStatus = vi.fn()
const mockUseScheduleFollowUp = vi.fn()

vi.mock('../../hooks/useSales', () => ({
  useSalesDashboard: () => mockUseSalesDashboard(),
  useSalesStatuses: () => mockUseSalesStatuses(),
  useUpcomingFollowUps: () => mockUseUpcomingFollowUps(),
  useConversionAnalytics: () => mockUseConversionAnalytics(),
  useUpdateSalesStatus: () => mockUseUpdateSalesStatus(),
  useScheduleFollowUp: () => mockUseScheduleFollowUp(),
}))

// テスト用データ
const mockDashboardData = {
  summary: {
    '未着手': 45,
    'アプローチ中': 12,
    '商談中': 8,
    '成約': 5,
    '見送り': 3,
  },
  total_companies: 73,
  recent_updates: [
    {
      company_name: 'テスト株式会社',
      status: 'アプローチ中',
      updated_at: '2024-01-01T10:00:00Z',
      contact_person: '田中',
    },
    {
      company_name: 'サンプル企業',
      status: '商談中',
      updated_at: '2024-01-01T09:00:00Z',
      contact_person: '佐藤',
    },
  ],
  conversion_rate: 6.8,
}

const mockSalesStatuses = [
  {
    status: {
      company_id: 1,
      status: 'アプローチ中',
      memo: '初回メール送信済み',
      contact_person: '田中',
      last_contact_date: '2024-01-01',
      next_action: '電話フォロー',
      updated_at: '2024-01-01T10:00:00Z',
    },
  },
  {
    status: {
      company_id: 2,
      status: '商談中',
      memo: '提案書送付済み',
      contact_person: '佐藤',
      last_contact_date: '2024-01-02',
      next_action: '次回面談',
      updated_at: '2024-01-02T14:00:00Z',
    },
  },
]

const mockUpcomingFollowUps = [
  {
    company_id: 1,
    company_name: 'テスト株式会社',
    next_action: '電話フォロー',
    scheduled_date: '2024-01-05',
    contact_person: '田中',
  },
  {
    company_id: 3,
    company_name: 'フォロー企業',
    next_action: 'メール送信',
    scheduled_date: '2024-01-06',
    contact_person: '山田',
  },
]

const mockConversionAnalytics = {
  period: 'monthly',
  analytics: {
    total_approached: 100,
    total_converted: 8,
    conversion_rate: 8.0,
    monthly_data: [
      { month: '2024-01', approached: 50, converted: 4, rate: 8.0 },
      { month: '2024-02', approached: 50, converted: 4, rate: 8.0 },
    ],
  },
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

describe('SalesManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseUpdateSalesStatus.mockReturnValue({ mutate: vi.fn(), isLoading: false })
    mockUseScheduleFollowUp.mockReturnValue({ mutate: vi.fn(), isLoading: false })
  })

  it('should render sales management page title', () => {
    mockUseSalesDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatuses.mockReturnValue({
      data: mockSalesStatuses,
      isLoading: false,
      isError: false,
    })
    mockUseUpcomingFollowUps.mockReturnValue({
      data: { follow_ups: mockUpcomingFollowUps },
      isLoading: false,
      isError: false,
    })
    mockUseConversionAnalytics.mockReturnValue({
      data: mockConversionAnalytics,
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <SalesManagement />
      </TestWrapper>
    )

    expect(screen.getByText('営業管理')).toBeInTheDocument()
    expect(screen.getByText('営業ステータスの管理とダッシュボードで進捗を確認できます')).toBeInTheDocument()
  })

  it('should display sales dashboard statistics', () => {
    mockUseSalesDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatuses.mockReturnValue({
      data: mockSalesStatuses,
      isLoading: false,
      isError: false,
    })
    mockUseUpcomingFollowUps.mockReturnValue({
      data: { follow_ups: mockUpcomingFollowUps },
      isLoading: false,
      isError: false,
    })
    mockUseConversionAnalytics.mockReturnValue({
      data: mockConversionAnalytics,
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <SalesManagement />
      </TestWrapper>
    )

    expect(screen.getByText('73')).toBeInTheDocument() // total companies
    expect(screen.getByText('45')).toBeInTheDocument() // 未着手
    expect(screen.getByText('12')).toBeInTheDocument() // アプローチ中
    expect(screen.getByText('8')).toBeInTheDocument() // 商談中
    expect(screen.getByText('5')).toBeInTheDocument() // 成約
    expect(screen.getByText('6.8%')).toBeInTheDocument() // conversion rate
  })

  it('should display recent updates', () => {
    mockUseSalesDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatuses.mockReturnValue({
      data: mockSalesStatuses,
      isLoading: false,
      isError: false,
    })
    mockUseUpcomingFollowUps.mockReturnValue({
      data: { follow_ups: mockUpcomingFollowUps },
      isLoading: false,
      isError: false,
    })
    mockUseConversionAnalytics.mockReturnValue({
      data: mockConversionAnalytics,
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <SalesManagement />
      </TestWrapper>
    )

    expect(screen.getByText('最近の更新')).toBeInTheDocument()
    expect(screen.getByText('テスト株式会社')).toBeInTheDocument()
    expect(screen.getByText('サンプル企業')).toBeInTheDocument()
  })

  it('should display upcoming follow-ups', () => {
    mockUseSalesDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatuses.mockReturnValue({
      data: mockSalesStatuses,
      isLoading: false,
      isError: false,
    })
    mockUseUpcomingFollowUps.mockReturnValue({
      data: { follow_ups: mockUpcomingFollowUps },
      isLoading: false,
      isError: false,
    })
    mockUseConversionAnalytics.mockReturnValue({
      data: mockConversionAnalytics,
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <SalesManagement />
      </TestWrapper>
    )

    expect(screen.getByText('今後の予定')).toBeInTheDocument()
    expect(screen.getByText('電話フォロー')).toBeInTheDocument()
    expect(screen.getByText('メール送信')).toBeInTheDocument()
    expect(screen.getByText('フォロー企業')).toBeInTheDocument()
  })

  it('should display sales statuses table', () => {
    mockUseSalesDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatuses.mockReturnValue({
      data: mockSalesStatuses,
      isLoading: false,
      isError: false,
    })
    mockUseUpcomingFollowUps.mockReturnValue({
      data: { follow_ups: mockUpcomingFollowUps },
      isLoading: false,
      isError: false,
    })
    mockUseConversionAnalytics.mockReturnValue({
      data: mockConversionAnalytics,
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <SalesManagement />
      </TestWrapper>
    )

    expect(screen.getByText('営業ステータス一覧')).toBeInTheDocument()
    expect(screen.getByText('初回メール送信済み')).toBeInTheDocument()
    expect(screen.getByText('提案書送付済み')).toBeInTheDocument()
  })

  it('should show status filters', () => {
    mockUseSalesDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatuses.mockReturnValue({
      data: mockSalesStatuses,
      isLoading: false,
      isError: false,
    })
    mockUseUpcomingFollowUps.mockReturnValue({
      data: { follow_ups: mockUpcomingFollowUps },
      isLoading: false,
      isError: false,
    })
    mockUseConversionAnalytics.mockReturnValue({
      data: mockConversionAnalytics,
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <SalesManagement />
      </TestWrapper>
    )

    expect(screen.getByDisplayValue('すべて')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('担当者名で検索')).toBeInTheDocument()
  })

  it('should filter by status', async () => {
    mockUseSalesDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatuses.mockReturnValue({
      data: mockSalesStatuses,
      isLoading: false,
      isError: false,
    })
    mockUseUpcomingFollowUps.mockReturnValue({
      data: { follow_ups: mockUpcomingFollowUps },
      isLoading: false,
      isError: false,
    })
    mockUseConversionAnalytics.mockReturnValue({
      data: mockConversionAnalytics,
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <SalesManagement />
      </TestWrapper>
    )

    const statusFilter = screen.getByDisplayValue('すべて')
    fireEvent.change(statusFilter, { target: { value: 'アプローチ中' } })

    await waitFor(() => {
      expect(statusFilter).toHaveValue('アプローチ中')
    })
  })

  it('should open status update modal', async () => {
    mockUseSalesDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatuses.mockReturnValue({
      data: mockSalesStatuses,
      isLoading: false,
      isError: false,
    })
    mockUseUpcomingFollowUps.mockReturnValue({
      data: { follow_ups: mockUpcomingFollowUps },
      isLoading: false,
      isError: false,
    })
    mockUseConversionAnalytics.mockReturnValue({
      data: mockConversionAnalytics,
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <SalesManagement />
      </TestWrapper>
    )

    const updateButtons = screen.getAllByText('更新')
    fireEvent.click(updateButtons[0])

    await waitFor(() => {
      expect(screen.getByText('ステータス更新')).toBeInTheDocument()
    })
  })

  it('should update sales status', async () => {
    const mockUpdate = vi.fn()
    mockUseUpdateSalesStatus.mockReturnValue({ mutate: mockUpdate, isLoading: false })

    mockUseSalesDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatuses.mockReturnValue({
      data: mockSalesStatuses,
      isLoading: false,
      isError: false,
    })
    mockUseUpcomingFollowUps.mockReturnValue({
      data: { follow_ups: mockUpcomingFollowUps },
      isLoading: false,
      isError: false,
    })
    mockUseConversionAnalytics.mockReturnValue({
      data: mockConversionAnalytics,
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <SalesManagement />
      </TestWrapper>
    )

    const updateButtons = screen.getAllByText('更新')
    fireEvent.click(updateButtons[0])

    await waitFor(() => {
      expect(screen.getByText('ステータス更新')).toBeInTheDocument()
    })

    const statusSelect = screen.getByDisplayValue('アプローチ中')
    fireEvent.change(statusSelect, { target: { value: '商談中' } })

    const saveButton = screen.getByText('保存')
    fireEvent.click(saveButton)

    expect(mockUpdate).toHaveBeenCalledWith({
      companyId: 1,
      statusData: {
        status: '商談中',
        memo: expect.any(String),
        contact_person: expect.any(String),
        next_action: expect.any(String),
      },
    })
  })

  it('should display loading state', () => {
    mockUseSalesDashboard.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    mockUseSalesStatuses.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    mockUseUpcomingFollowUps.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })
    mockUseConversionAnalytics.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    })

    render(
      <TestWrapper>
        <SalesManagement />
      </TestWrapper>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should display error state', () => {
    mockUseSalesDashboard.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    mockUseSalesStatuses.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    mockUseUpcomingFollowUps.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })
    mockUseConversionAnalytics.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    })

    render(
      <TestWrapper>
        <SalesManagement />
      </TestWrapper>
    )

    expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
  })

  it('should show conversion analytics chart', () => {
    mockUseSalesDashboard.mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
    })
    mockUseSalesStatuses.mockReturnValue({
      data: mockSalesStatuses,
      isLoading: false,
      isError: false,
    })
    mockUseUpcomingFollowUps.mockReturnValue({
      data: { follow_ups: mockUpcomingFollowUps },
      isLoading: false,
      isError: false,
    })
    mockUseConversionAnalytics.mockReturnValue({
      data: mockConversionAnalytics,
      isLoading: false,
      isError: false,
    })

    render(
      <TestWrapper>
        <SalesManagement />
      </TestWrapper>
    )

    expect(screen.getByText('成約率推移')).toBeInTheDocument()
  })
})