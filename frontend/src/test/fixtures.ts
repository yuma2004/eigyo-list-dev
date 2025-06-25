/**
 * フロントエンド用テストフィクスチャ
 * UIテストで使用するモックデータと設定
 */

import { Company, SalesStatus, ScrapingStatus, ScrapingConfig } from '../types/api'

// 基本的なテストデータ
export const mockCompany: Company = {
  id: 1,
  company_name: 'テスト株式会社',
  url: 'https://test.com',
  address: '東京都渋谷区テスト1-1-1',
  tel: '03-1234-5678',
  fax: '03-1234-5679',
  representative: 'テスト太郎',
  business_content: 'テストサービスの開発・運営',
  established_date: '2020-01-01',
  capital: '1000万円',
  contact_url: 'https://test.com/contact',
  prefecture: '東京都',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

export const mockSalesStatus: SalesStatus = {
  company_id: 1,
  status: 'アプローチ中',
  contact_person: '営業太郎',
  last_contact_date: '2024-01-15',
  next_action: '商談設定',
  memo: '初回アプローチ完了。反応良好。',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z'
}

export const mockScrapingStatus: ScrapingStatus = {
  status: 'idle',
  progress: 0,
  collected: 0,
  total: 0,
  current_url: null,
  estimated_remaining: null,
  started_at: null
}

export const mockScrapingConfig: ScrapingConfig = {
  keywords: ['IT企業', '広告代理店'],
  target_sites: ['job_sites'],
  max_pages: 10,
  prefecture: '東京都',
  industry: 'IT'
}

// 複数データセット
export const mockCompanies: Company[] = [
  {
    ...mockCompany,
    id: 1,
    company_name: 'テクノロジー株式会社',
    url: 'https://technology.com',
    prefecture: '東京都',
    business_content: 'システム開発、AI・機械学習'
  },
  {
    ...mockCompany,
    id: 2,
    company_name: '株式会社アドバンス',
    url: 'https://advance.com',
    address: '大阪府大阪市北区梅田2-2-2',
    prefecture: '大阪府',
    business_content: 'デジタルマーケティング、広告運用'
  },
  {
    ...mockCompany,
    id: 3,
    company_name: 'ソリューション株式会社',
    url: 'https://solution.com',
    address: '愛知県名古屋市中区栄3-3-3',
    prefecture: '愛知県',
    business_content: 'ITコンサルティング、業務効率化'
  },
  {
    ...mockCompany,
    id: 4,
    company_name: '株式会社イノベーション',
    url: 'https://innovation.com',
    address: '神奈川県横浜市西区みなとみらい4-4-4',
    prefecture: '神奈川県',
    business_content: 'スタートアップ支援、新規事業開発'
  },
  {
    ...mockCompany,
    id: 5,
    company_name: 'クリエイティブ株式会社',
    url: 'https://creative.com',
    address: '福岡県福岡市中央区天神5-5-5',
    prefecture: '福岡県',
    business_content: 'Webデザイン、UI/UX設計'
  }
]

export const mockSalesStatuses = [
  {
    ...mockSalesStatus,
    company_id: 1,
    status: 'アプローチ中' as const,
    contact_person: '営業太郎',
    last_contact_date: '2024-01-10'
  },
  {
    ...mockSalesStatus,
    company_id: 2,
    status: '商談中' as const,
    contact_person: '営業花子',
    last_contact_date: '2024-01-12'
  },
  {
    ...mockSalesStatus,
    company_id: 3,
    status: '成約' as const,
    contact_person: '営業次郎',
    last_contact_date: '2024-01-08'
  },
  {
    ...mockSalesStatus,
    company_id: 4,
    status: '未着手' as const,
    contact_person: '',
    last_contact_date: null
  },
  {
    ...mockSalesStatus,
    company_id: 5,
    status: '見送り' as const,
    contact_person: '営業三郎',
    last_contact_date: '2024-01-05'
  }
]

// ダッシュボード用データ
export const mockDashboardData = {
  summary: {
    '未着手': 5,
    'アプローチ中': 3,
    '商談中': 2,
    '成約': 1,
    '見送り': 1
  },
  total_companies: 12,
  recent_updates: [
    {
      company_name: 'テクノロジー株式会社',
      status: 'アプローチ中',
      contact_person: '営業太郎',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      company_name: '株式会社アドバンス',
      status: '商談中',
      contact_person: '営業花子',
      updated_at: '2024-01-14T15:30:00Z'
    }
  ],
  conversion_rate: 8.3
}

export const mockAnalyticsData = {
  analytics: {
    conversion_rate: 12.5,
    total_approached: 40,
    total_converted: 5,
    monthly_data: [
      { month: '2023-12', approached: 8, converted: 1 },
      { month: '2024-01', approached: 12, converted: 2 },
      { month: '2024-02', approached: 20, converted: 2 }
    ]
  }
}

export const mockExportStats = {
  total_companies: 12,
  status_summary: {
    '未着手': 5,
    'アプローチ中': 3,
    '商談中': 2,
    '成約': 1,
    '見送り': 1
  },
  prefecture_summary: {
    '東京都': 8,
    '大阪府': 2,
    '愛知県': 1,
    '神奈川県': 1
  },
  last_updated: '2024-01-15T10:00:00Z'
}

// スクレイピング関連データ
export const mockScrapingHistory = {
  history: [
    {
      id: 1,
      execution_date: '2024-01-15T09:00:00Z',
      keyword: 'IT企業',
      collected_count: 25,
      success_count: 23,
      error_count: 2,
      status: '成功'
    },
    {
      id: 2,
      execution_date: '2024-01-14T14:30:00Z',
      keyword: '広告代理店',
      collected_count: 18,
      success_count: 16,
      error_count: 2,
      status: '成功'
    },
    {
      id: 3,
      execution_date: '2024-01-13T11:15:00Z',
      keyword: 'コンサルティング',
      collected_count: 12,
      success_count: 10,
      error_count: 2,
      status: '部分成功'
    }
  ]
}

export const mockFollowUps = {
  follow_ups: [
    {
      company_name: 'テクノロジー株式会社',
      contact_person: '営業太郎',
      next_action: '商談実施',
      scheduled_date: '2024-01-20'
    },
    {
      company_name: '株式会社アドバンス',
      contact_person: '営業花子',
      next_action: '提案書提出',
      scheduled_date: '2024-01-22'
    }
  ]
}

// エラーシナリオ用データ
export const mockErrorResponses = {
  networkError: {
    name: 'NetworkError',
    message: 'Network request failed'
  },
  validationError: {
    response: {
      status: 400,
      data: {
        detail: [
          { field: 'company_name', message: '会社名は必須です' },
          { field: 'url', message: '正しいURLを入力してください' }
        ]
      }
    }
  },
  notFoundError: {
    response: {
      status: 404,
      data: { detail: '企業が見つかりません' }
    }
  },
  serverError: {
    response: {
      status: 500,
      data: { detail: 'サーバー内部エラーが発生しました' }
    }
  },
  unauthorizedError: {
    response: {
      status: 401,
      data: { detail: '認証が必要です' }
    }
  },
  rateLimitError: {
    response: {
      status: 429,
      data: { detail: '同時接続数の制限に達しています' }
    }
  }
}

// パフォーマンステスト用の大量データ
export const createLargeDataset = (size: number) => {
  const companies: Company[] = []
  const prefectures = ['東京都', '大阪府', '愛知県', '神奈川県', '福岡県']
  
  for (let i = 0; i < size; i++) {
    companies.push({
      id: i + 1,
      company_name: `大量テスト企業${String(i + 1).padStart(4, '0')}`,
      url: `https://large-test${String(i + 1).padStart(4, '0')}.com`,
      address: `${prefectures[i % prefectures.length]}大量区大量${i + 1}-${i + 1}-${i + 1}`,
      tel: `0${((i % 9) + 1)}-${String(i + 1).padStart(4, '0')}-${String((i * 2) % 10000).padStart(4, '0')}`,
      representative: `代表者${i + 1}`,
      business_content: `大量テスト事業${i + 1}`,
      prefecture: prefectures[i % prefectures.length],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    })
  }
  
  return companies
}

// API レスポンスのモック
export const createMockApiResponse = <T>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data)
})

export const createMockApiError = (status: number, message: string) => ({
  ok: false,
  status,
  json: async () => ({ detail: message }),
  text: async () => JSON.stringify({ detail: message })
})

// React Query用のモック
export const mockQueryClient = {
  getQueryData: vi.fn(),
  setQueryData: vi.fn(),
  invalidateQueries: vi.fn(),
  prefetchQuery: vi.fn(),
  removeQueries: vi.fn(),
  clear: vi.fn()
}

// ルーターのモック
export const mockNavigate = vi.fn()
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default'
}

// フォームの入力値
export const validCompanyForm = {
  company_name: '新規テスト企業',
  url: 'https://new-test.com',
  address: '東京都新宿区新規1-1-1',
  tel: '03-9999-9999',
  representative: '新規太郎',
  business_content: '新規事業開発'
}

export const invalidCompanyForm = {
  company_name: '', // 必須エラー
  url: 'invalid-url', // フォーマットエラー
  address: '東京都新宿区新規1-1-1',
  tel: '03-9999-9999'
}

export const validSalesStatusForm = {
  status: 'アプローチ中' as const,
  contact_person: '新規営業太郎',
  last_contact_date: '2024-01-20',
  next_action: '初回商談',
  memo: '新規フォームテスト用メモ'
}

export const validScrapingForm = {
  keywords: 'テストキーワード1,テストキーワード2',
  prefecture: '東京都',
  industry: 'IT',
  max_pages: 20,
  target_sites: ['job_sites']
}

// テーブルのカラム設定
export const companyTableColumns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: '会社名', dataIndex: 'company_name', key: 'company_name' },
  { title: 'URL', dataIndex: 'url', key: 'url' },
  { title: '都道府県', dataIndex: 'prefecture', key: 'prefecture' },
  { title: '代表者', dataIndex: 'representative', key: 'representative' },
  { title: '事業内容', dataIndex: 'business_content', key: 'business_content' },
  { title: '操作', key: 'actions' }
]

// ページネーション設定
export const defaultPagination = {
  current: 1,
  pageSize: 100,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) => 
    `${range[0]}-${range[1]} / ${total}件`
}

// フィルター設定
export const defaultFilters = {
  keyword: undefined,
  status: undefined,
  prefecture: undefined,
  industry: undefined
}

// アニメーションを無効化するためのCSS
export const disableAnimations = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`

// テスト環境用のユーティリティ
export const testUtils = {
  // 非同期処理の完了を待つ
  waitForPromises: () => new Promise(resolve => setTimeout(resolve, 0)),
  
  // 指定時間待機
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // ランダムな文字列生成
  randomString: (length = 8) => 
    Math.random().toString(36).substring(2, length + 2),
  
  // ランダムな整数生成
  randomInt: (min = 0, max = 100) => 
    Math.floor(Math.random() * (max - min + 1)) + min,
  
  // 日付フォーマット
  formatDate: (date: Date) => 
    date.toISOString().split('T')[0],
  
  // 今日の日付
  today: () => new Date().toISOString().split('T')[0],
  
  // N日前の日付
  daysAgo: (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() - days)
    return date.toISOString().split('T')[0]
  }
}

// テスト実行環境の検出
export const isCI = process.env.CI === 'true'
export const isTestEnv = process.env.NODE_ENV === 'test'
export const testTimeout = isCI ? 10000 : 5000

// デバッグ用のコンソール出力制御
export const debug = {
  log: isTestEnv ? () => {} : console.log,
  error: isTestEnv ? () => {} : console.error,
  warn: isTestEnv ? () => {} : console.warn,
  info: isTestEnv ? () => {} : console.info
}