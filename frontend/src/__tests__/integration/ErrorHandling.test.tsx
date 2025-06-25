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

/**
 * エラーハンドリング統合テスト
 * 様々なエラーシナリオでの適切な処理とユーザーフィードバック
 */

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
      queries: { 
        retry: false,
        refetchOnWindowFocus: false,
      },
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

describe('エラーハンドリング統合テスト', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // コンソールエラーの抑制（テスト中の意図的なエラー）
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('ネットワークエラーハンドリング', () => {
    test('完全なネットワーク切断時の処理', async () => {
      // すべてのAPIでネットワークエラーをシミュレート
      const networkError = new Error('Network Error')
      networkError.name = 'NetworkError'
      
      mockCompaniesService.getCompanies.mockRejectedValue(networkError)
      mockScrapingService.getScrapingStatus.mockRejectedValue(networkError)
      mockSalesService.getSalesDashboard.mockRejectedValue(networkError)
      mockExportService.getExportStats.mockRejectedValue(networkError)

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // 企業管理ページでのエラー確認
      fireEvent.click(screen.getByText('企業管理'))
      
      await waitFor(() => {
        expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
      })

      // 再試行ボタンの確認
      expect(screen.getByText('再試行')).toBeInTheDocument()

      // データ収集ページでのエラー確認
      fireEvent.click(screen.getByText('データ収集'))
      
      await waitFor(() => {
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      })

      // 営業管理ページでのエラー確認
      fireEvent.click(screen.getByText('営業管理'))
      
      await waitFor(() => {
        expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
      })

      // エクスポートページでのエラー確認
      fireEvent.click(screen.getByText('エクスポート'))
      
      await waitFor(() => {
        expect(screen.getByText('統計情報の取得に失敗しました')).toBeInTheDocument()
      })
    })

    test('断続的なネットワークエラーからの復旧', async () => {
      let attemptCount = 0
      
      // 最初の2回は失敗、3回目は成功
      mockCompaniesService.getCompanies.mockImplementation(() => {
        attemptCount++
        if (attemptCount <= 2) {
          return Promise.reject(new Error('Network timeout'))
        }
        return Promise.resolve({
          companies: [
            {
              id: 1,
              company_name: '復旧テスト企業',
              url: 'https://recovery-test.com',
              prefecture: '東京都',
            }
          ],
          total: 1,
          page: 1,
          page_size: 100,
        })
      })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('企業管理'))

      // 最初はエラー表示
      await waitFor(() => {
        expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
      })

      // 再試行実行
      fireEvent.click(screen.getByText('再試行'))

      // まだエラー（2回目の失敗）
      await waitFor(() => {
        expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
      })

      // 再度再試行
      fireEvent.click(screen.getByText('再試行'))

      // 成功して企業データが表示される
      await waitFor(() => {
        expect(screen.getByText('復旧テスト企業')).toBeInTheDocument()
      })

      expect(attemptCount).toBe(3)
    })
  })

  describe('APIエラーレスポンスハンドリング', () => {
    test('HTTP 404 エラーの処理', async () => {
      const notFoundError = new Error('Not Found')
      // @ts-ignore
      notFoundError.response = { status: 404, data: { detail: '企業が見つかりません' } }
      
      mockCompaniesService.getCompany.mockRejectedValue(notFoundError)

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // 存在しない企業IDでアクセス
      fireEvent.click(screen.getByText('企業管理'))
      
      // 何らかの方法で詳細ページに遷移する想定
      // （実際のルーティングに依存）
      
      await waitFor(() => {
        expect(screen.getByText('企業が見つかりません')).toBeInTheDocument()
      })
    })

    test('HTTP 400 バリデーションエラーの処理', async () => {
      const validationError = new Error('Validation Error')
      // @ts-ignore
      validationError.response = {
        status: 400,
        data: {
          detail: [
            {
              field: 'company_name',
              message: '会社名は必須です'
            },
            {
              field: 'url',
              message: '正しいURLを入力してください'
            }
          ]
        }
      }

      mockCompaniesService.createCompany.mockRejectedValue(validationError)

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('企業管理'))
      fireEvent.click(screen.getByText('新規追加'))

      // 不正なデータで送信
      fireEvent.change(screen.getByPlaceholderText('例: 株式会社サンプル'), {
        target: { value: '' }
      })
      fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
        target: { value: 'invalid-url' }
      })

      fireEvent.click(screen.getByText('登録'))

      await waitFor(() => {
        expect(screen.getByText('会社名は必須です')).toBeInTheDocument()
        expect(screen.getByText('正しいURLを入力してください')).toBeInTheDocument()
      })
    })

    test('HTTP 500 サーバーエラーの処理', async () => {
      const serverError = new Error('Internal Server Error')
      // @ts-ignore
      serverError.response = { 
        status: 500, 
        data: { detail: 'サーバー内部エラーが発生しました' } 
      }

      mockScrapingService.startScraping.mockRejectedValue(serverError)

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('データ収集'))

      await waitFor(() => {
        expect(screen.getByPlaceholderText('IT企業,広告代理店 (カンマ区切りで複数指定)')).toBeInTheDocument()
      })

      fireEvent.change(
        screen.getByPlaceholderText('IT企業,広告代理店 (カンマ区切りで複数指定)'),
        { target: { value: 'テストキーワード' } }
      )

      fireEvent.click(screen.getByText('収集開始'))

      await waitFor(() => {
        expect(screen.getByText('スクレイピングの開始に失敗しました')).toBeInTheDocument()
      })
    })

    test('HTTP 401 認証エラーの処理', async () => {
      const authError = new Error('Unauthorized')
      // @ts-ignore
      authError.response = { 
        status: 401, 
        data: { detail: '認証が必要です' } 
      }

      mockExportService.downloadCSV.mockRejectedValue(authError)

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // エクスポート統計は成功させる
      mockExportService.getExportStats.mockResolvedValue({
        total_companies: 10,
        status_summary: { '未着手': 5, 'アプローチ中': 3, '成約': 2 },
        prefecture_summary: { '東京都': 8, '大阪府': 2 },
        last_updated: '2024-01-15T10:00:00Z',
      })

      fireEvent.click(screen.getByText('エクスポート'))

      await waitFor(() => {
        expect(screen.getByText('CSV形式でエクスポート')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('CSV形式でエクスポート'))

      await waitFor(() => {
        expect(screen.getByText('エクスポートに失敗しました')).toBeInTheDocument()
      })
    })
  })

  describe('データ整合性エラーハンドリング', () => {
    test('不完全なデータでの表示処理', async () => {
      // 一部フィールドが欠損したデータ
      mockCompaniesService.getCompanies.mockResolvedValue({
        companies: [
          {
            id: 1,
            company_name: '不完全企業1',
            url: 'https://incomplete1.com',
            // address: undefined,
            // tel: null,
            prefecture: '東京都',
          },
          {
            id: 2,
            company_name: '', // 空文字
            url: 'https://incomplete2.com',
            address: '大阪府大阪市',
            prefecture: '大阪府',
          }
        ],
        total: 2,
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
        expect(screen.getByText('不完全企業1')).toBeInTheDocument()
        // 空文字の企業名も何らかの形で表示される
        expect(screen.getByText('https://incomplete2.com')).toBeInTheDocument()
      })

      // データが欠損していてもアプリケーションがクラッシュしない
      expect(screen.queryByText('Error')).not.toBeInTheDocument()
    })

    test('不正なJSON データの処理', async () => {
      // JSONパースエラーをシミュレート
      const parseError = new Error('Unexpected token in JSON')
      parseError.name = 'SyntaxError'

      mockSalesService.getSalesDashboard.mockRejectedValue(parseError)

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('営業管理'))

      await waitFor(() => {
        expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
      })

      // パースエラーでもアプリケーションが継続動作
      fireEvent.click(screen.getByText('企業管理'))
      
      // 他のページには正常に遷移できる
      expect(screen.getByText('企業管理')).toBeInTheDocument()
    })
  })

  describe('フォームバリデーションエラーハンドリング', () => {
    test('必須フィールドの検証', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('企業管理'))
      fireEvent.click(screen.getByText('新規追加'))

      // 必須フィールドを空のまま送信
      fireEvent.click(screen.getByText('登録'))

      await waitFor(() => {
        expect(screen.getByText('会社名を入力してください')).toBeInTheDocument()
        expect(screen.getByText('URLを入力してください')).toBeInTheDocument()
      })

      // モーダルが閉じていないことを確認
      expect(screen.getByText('企業登録')).toBeInTheDocument()
    })

    test('フィールドフォーマット検証', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('企業管理'))
      fireEvent.click(screen.getByText('新規追加'))

      // 不正なURL形式を入力
      fireEvent.change(screen.getByPlaceholderText('例: 株式会社サンプル'), {
        target: { value: '正常な企業名' }
      })
      fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
        target: { value: 'not-a-valid-url' }
      })

      fireEvent.click(screen.getByText('登録'))

      await waitFor(() => {
        expect(screen.getByText('正しいURLを入力してください')).toBeInTheDocument()
      })
    })
  })

  describe('リソース制限エラーハンドリング', () => {
    test('ファイルサイズ制限エラーの処理', async () => {
      const fileSizeError = new Error('File size too large')
      // @ts-ignore
      fileSizeError.response = {
        status: 413,
        data: { detail: 'ファイルサイズが制限を超えています' }
      }

      mockExportService.downloadExcel.mockRejectedValue(fileSizeError)

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      mockExportService.getExportStats.mockResolvedValue({
        total_companies: 10000, // 大量データ
        status_summary: {},
        prefecture_summary: {},
        last_updated: '2024-01-15T10:00:00Z',
      })

      fireEvent.click(screen.getByText('エクスポート'))

      await waitFor(() => {
        expect(screen.getByText('Excel形式でエクスポート')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Excel形式でエクスポート'))

      await waitFor(() => {
        expect(screen.getByText('エクスポートに失敗しました')).toBeInTheDocument()
      })
    })

    test('同時接続数制限エラーの処理', async () => {
      const rateLimitError = new Error('Too many requests')
      // @ts-ignore
      rateLimitError.response = {
        status: 429,
        data: { detail: '同時接続数の制限に達しています。しばらく待ってから再試行してください。' }
      }

      mockScrapingService.startScraping.mockRejectedValue(rateLimitError)

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('データ収集'))

      // スクレイピング設定
      const keywordInput = screen.getByPlaceholderText('IT企業,広告代理店 (カンマ区切りで複数指定)')
      fireEvent.change(keywordInput, { target: { value: 'テストキーワード' } })

      fireEvent.click(screen.getByText('収集開始'))

      await waitFor(() => {
        expect(screen.getByText('スクレイピングの開始に失敗しました')).toBeInTheDocument()
      })
    })
  })

  describe('状態管理エラーハンドリング', () => {
    test('状態不整合時の処理', async () => {
      // スクレイピング状態が不整合な場合
      mockScrapingService.getScrapingStatus
        .mockResolvedValueOnce({
          status: 'running',
          progress: 50,
          collected: 50,
          total: 100,
        })
        .mockResolvedValueOnce({
          status: 'idle', // 次の取得で急に idle に変わる
          progress: 0,
          collected: 0,
          total: 0,
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

      // 状態が変わっても適切に処理される
      await waitFor(() => {
        expect(screen.getByText('待機中')).toBeInTheDocument()
      }, { timeout: 5000 })
    })

    test('キャッシュ無効化エラーの処理', async () => {
      let callCount = 0
      
      // 最初の呼び出しは成功、後で失敗するパターン
      mockCompaniesService.getCompanies.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            companies: [{ id: 1, company_name: 'テスト企業', url: 'https://test.com' }],
            total: 1,
            page: 1,
            page_size: 100,
          })
        } else {
          return Promise.reject(new Error('Cache invalidation error'))
        }
      })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('企業管理'))

      // 最初は正常表示
      await waitFor(() => {
        expect(screen.getByText('テスト企業')).toBeInTheDocument()
      })

      // 更新ボタンクリック
      fireEvent.click(screen.getByText('更新'))

      // エラーになっても以前のデータが残るか、適切なエラー表示
      await waitFor(() => {
        // いずれかの状態になる
        const hasError = screen.queryByText('データの取得に失敗しました')
        const hasData = screen.queryByText('テスト企業')
        
        expect(hasError || hasData).toBeTruthy()
      })
    })
  })

  describe('エラー復旧メカニズム', () => {
    test('自動リトライ機能', async () => {
      let attemptCount = 0
      
      // 3回失敗後に成功
      mockSalesService.updateSalesStatus.mockImplementation(() => {
        attemptCount++
        if (attemptCount <= 3) {
          return Promise.reject(new Error('Temporary server error'))
        }
        return Promise.resolve({})
      })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      // 何らかの方法でステータス更新をトリガー
      // （実際の操作フローに依存）
      
      // リトライが自動で実行されることを確認
      await waitFor(() => {
        expect(attemptCount).toBeGreaterThan(1)
      }, { timeout: 10000 })
    })

    test('エラー状態からの手動復旧', async () => {
      // 最初は失敗
      mockCompaniesService.getCompanies.mockRejectedValueOnce(new Error('Initial error'))
      
      // 2回目は成功
      mockCompaniesService.getCompanies.mockResolvedValueOnce({
        companies: [{ id: 1, company_name: '復旧企業', url: 'https://recovery.com' }],
        total: 1,
        page: 1,
        page_size: 100,
      })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('企業管理'))

      // エラー表示確認
      await waitFor(() => {
        expect(screen.getByText('データの取得に失敗しました')).toBeInTheDocument()
      })

      // 手動で再試行
      fireEvent.click(screen.getByText('再試行'))

      // 復旧確認
      await waitFor(() => {
        expect(screen.getByText('復旧企業')).toBeInTheDocument()
      })

      // エラーメッセージが消えていることを確認
      expect(screen.queryByText('データの取得に失敗しました')).not.toBeInTheDocument()
    })
  })

  describe('ユーザビリティエラーハンドリング', () => {
    test('操作中断時の状態保持', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('企業管理'))
      fireEvent.click(screen.getByText('新規追加'))

      // フォームに入力
      fireEvent.change(screen.getByPlaceholderText('例: 株式会社サンプル'), {
        target: { value: '中断テスト企業' }
      })
      fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
        target: { value: 'https://interrupt-test.com' }
      })

      // モーダルを一度閉じる
      fireEvent.click(screen.getByText('キャンセル'))

      // 再度開く
      fireEvent.click(screen.getByText('新規追加'))

      // フォームがリセットされていることを確認（正常な動作）
      expect(screen.getByPlaceholderText('例: 株式会社サンプル')).toHaveValue('')
    })

    test('長時間操作での適切なフィードバック', async () => {
      // 長時間かかる操作をシミュレート
      mockExportService.downloadCSV.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve(undefined), 5000) // 5秒遅延
        })
      })

      mockExportService.getExportStats.mockResolvedValue({
        total_companies: 10,
        status_summary: {},
        prefecture_summary: {},
        last_updated: '2024-01-15T10:00:00Z',
      })

      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      )

      fireEvent.click(screen.getByText('エクスポート'))

      await waitFor(() => {
        expect(screen.getByText('CSV形式でエクスポート')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('CSV形式でエクスポート'))

      // ローディング状態の確認
      await waitFor(() => {
        expect(screen.getByText('エクスポート中...')).toBeInTheDocument()
      })

      // プログレスバーの存在確認
      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      // ボタンがローディング状態になっていることを確認
      const exportButton = screen.getByText('CSV形式でエクスポート').closest('button')
      expect(exportButton).toHaveAttribute('disabled')
    })
  })
})