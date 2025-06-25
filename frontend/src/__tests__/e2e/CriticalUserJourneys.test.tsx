import { test, expect } from '@playwright/test'

/**
 * エンドツーエンドテスト: 重要なユーザージャーニー
 * Playwright を使用したブラウザベースの統合テスト
 */

test.describe('営業リスト作成ツール E2E テスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト環境のセットアップ
    await page.goto('http://localhost:3000')
    
    // API モックの設定（必要に応じて）
    await page.route('**/api/**', async route => {
      const url = route.request().url()
      
      // デフォルトのモックレスポンス
      if (url.includes('/api/companies')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            companies: [
              {
                id: 1,
                company_name: 'E2Eテスト企業',
                url: 'https://e2e-test.com',
                address: '東京都渋谷区テスト1-1-1',
                prefecture: '東京都',
                representative: 'E2E太郎',
                business_content: 'E2Eテスト事業'
              }
            ],
            total: 1,
            page: 1,
            page_size: 100
          })
        })
      } else if (url.includes('/api/scraping/status')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'idle',
            progress: 0,
            collected: 0,
            total: 0
          })
        })
      } else {
        await route.continue()
      }
    })
  })

  test('完全な営業活動ワークフロー - データ収集から成約まで', async ({ page }) => {
    // Step 1: ホームページから開始
    await expect(page.locator('h2')).toContainText('営業リスト作成ツール')
    
    // Step 2: データ収集ページに移動
    await page.click('text=データ収集')
    await expect(page.locator('h2')).toContainText('データ収集')
    await expect(page.locator('text=Webスクレイピングによる企業情報の自動収集を実行できます')).toBeVisible()
    
    // Step 3: スクレイピング設定
    await page.fill('input[placeholder*="IT企業,広告代理店"]', 'IT企業,広告代理店,コンサルティング')
    
    // 都道府県選択
    await page.click('text=選択してください')
    await page.click('text=東京都')
    
    // 業界選択
    await page.locator('label:has-text("対象業界")').locator('+ * >> .ant-select').click()
    await page.click('text=IT')
    
    // 最大ページ数設定
    await page.fill('input[min="1"][max="100"]', '20')
    
    // Step 4: スクレイピング開始
    await page.click('button:has-text("収集開始")')
    
    // 実行状態の確認
    await expect(page.locator('text=実行中')).toBeVisible({ timeout: 10000 })
    
    // 進捗バーの表示確認
    await expect(page.locator('.ant-progress')).toBeVisible()
    
    // Step 5: 企業管理ページに移動
    await page.click('text=企業管理')
    await expect(page.locator('h2')).toContainText('企業管理')
    
    // 企業一覧の表示確認
    await expect(page.locator('text=E2Eテスト企業')).toBeVisible()
    
    // Step 6: 企業詳細表示
    await page.click('text=E2Eテスト企業')
    await expect(page.locator('h2')).toContainText('企業詳細')
    await expect(page.locator('text=https://e2e-test.com')).toBeVisible()
    
    // Step 7: 営業ステータス更新
    await page.click('button:has-text("ステータス更新")')
    await expect(page.locator('text=営業ステータスを更新')).toBeVisible()
    
    // ステータス選択
    await page.click('.ant-select:has-text("未着手")')
    await page.click('text=アプローチ中')
    
    // 担当者入力
    await page.fill('input[placeholder="担当者名を入力"]', 'E2E営業太郎')
    
    // 最終コンタクト日設定
    await page.click('input[placeholder]') // DatePicker
    await page.click('text=15') // 今月の15日を選択
    
    // 次回アクション入力
    await page.fill('input[placeholder="次回予定しているアクション"]', '商談アポイント取得')
    
    // メモ入力
    await page.fill('textarea[placeholder="営業活動に関するメモ"]', 'E2Eテストによる初回アプローチ。反応良好。')
    
    // 保存
    await page.click('button:has-text("保存")')
    
    // モーダルが閉じることを確認
    await expect(page.locator('text=営業ステータスを更新')).not.toBeVisible()
    
    // Step 8: 営業管理ダッシュボードで確認
    await page.click('text=営業管理')
    await expect(page.locator('h2')).toContainText('営業管理')
    
    // ダッシュボード統計の確認
    await expect(page.locator('text=総企業数')).toBeVisible()
    await expect(page.locator('text=アプローチ中')).toBeVisible()
    await expect(page.locator('text=成約率')).toBeVisible()
    
    // 営業ステータス一覧で更新内容確認
    await expect(page.locator('text=E2E営業太郎')).toBeVisible()
    await expect(page.locator('.ant-tag:has-text("アプローチ中")')).toBeVisible()
    
    // Step 9: 営業進捗を商談中に更新
    await page.click('button:has-text("更新"):first')
    
    await page.click('.ant-select:has-text("アプローチ中")')
    await page.click('text=商談中')
    
    await page.fill('input[placeholder="次回予定しているアクション"]', '提案書作成・提出')
    await page.fill('textarea[placeholder="営業活動に関するメモ"]', '商談実施済み。提案内容に興味を示している。')
    
    await page.click('button:has-text("保存")')
    
    // Step 10: 最終的に成約に更新
    await page.click('button:has-text("更新"):first')
    
    await page.click('.ant-select:has-text("商談中")')
    await page.click('text=成約')
    
    await page.fill('input[placeholder="次回予定しているアクション"]', 'プロジェクト開始準備')
    await page.fill('textarea[placeholder="営業活動に関するメモ"]', 'E2Eテスト成功！契約締結完了。プロジェクト開始予定。')
    
    await page.click('button:has-text("保存")')
    
    // 成約ステータスの確認
    await expect(page.locator('.ant-tag:has-text("成約")')).toBeVisible()
    
    // Step 11: エクスポートページで結果をダウンロード
    await page.click('text=エクスポート')
    await expect(page.locator('h2')).toContainText('エクスポート')
    
    // 統計情報確認
    await expect(page.locator('text=登録企業数')).toBeVisible()
    await expect(page.locator('text=エクスポート対象')).toBeVisible()
    
    // フィルター設定
    await page.click('label:has-text("営業ステータス") + * .ant-select')
    await page.click('text=成約')
    
    // プレビュー確認
    await page.click('button:has-text("プレビュー")')
    await expect(page.locator('text=エクスポートプレビュー')).toBeVisible()
    await expect(page.locator('text=E2Eテスト企業')).toBeVisible()
    
    // プレビューを閉じる
    await page.click('button.ant-modal-close')
    
    // CSV エクスポート実行
    await page.click('button:has-text("CSV形式でエクスポート")')
    
    // エクスポート進行状況確認
    await expect(page.locator('text=エクスポート中...')).toBeVisible()
    await expect(page.locator('.ant-progress')).toBeVisible()
    
    // 完了メッセージ確認
    await expect(page.locator('text=CSVファイルをダウンロードしました')).toBeVisible({ timeout: 10000 })
  })

  test('企業の手動登録と編集ワークフロー', async ({ page }) => {
    // 企業管理ページに移動
    await page.click('text=企業管理')
    
    // 新規企業追加
    await page.click('button:has-text("新規追加")')
    await expect(page.locator('text=企業登録')).toBeVisible()
    
    // 企業情報入力
    await page.fill('input[placeholder="例: 株式会社サンプル"]', '手動登録テスト企業')
    await page.fill('input[placeholder="https://example.com"]', 'https://manual-test.com')
    await page.fill('input[placeholder="東京都渋谷区1-1-1"]', '大阪府大阪市北区テスト2-2-2')
    await page.fill('input[placeholder="03-1234-5678"]', '06-0000-0000')
    await page.fill('input[placeholder="山田太郎"]', '手動登録太郎')
    await page.fill('textarea[placeholder="IT事業、コンサルティング業務など"]', '手動テスト事業、品質保証サービス')
    await page.fill('input[placeholder="2020-01-01"]', '2019-04-01')
    await page.fill('input[placeholder="1000万円"]', '5000万円')
    await page.fill('input[placeholder="https://example.com/contact"]', 'https://manual-test.com/contact')
    
    // 登録実行
    await page.click('button:has-text("登録")')
    
    // 登録完了確認
    await expect(page.locator('text=企業登録')).not.toBeVisible()
    await expect(page.locator('text=手動登録テスト企業')).toBeVisible()
    
    // 編集機能テスト
    await page.click('button:has-text("編集"):first')
    await expect(page.locator('text=企業編集')).toBeVisible()
    
    // 情報更新
    await page.fill('input[value="手動登録テスト企業"]', '手動登録テスト企業（更新版）')
    await page.fill('textarea:has-text("手動テスト事業、品質保証サービス")', '手動テスト事業、品質保証サービス、E2Eテスト支援')
    
    // 更新実行
    await page.click('button:has-text("更新")')
    
    // 更新確認
    await expect(page.locator('text=企業編集')).not.toBeVisible()
    await expect(page.locator('text=手動登録テスト企業（更新版）')).toBeVisible()
    
    // 詳細表示確認
    await page.click('text=手動登録テスト企業（更新版）')
    await expect(page.locator('h2')).toContainText('企業詳細')
    await expect(page.locator('text=https://manual-test.com')).toBeVisible()
    await expect(page.locator('text=大阪府大阪市北区テスト2-2-2')).toBeVisible()
    await expect(page.locator('text=手動登録太郎')).toBeVisible()
    
    // 削除機能テスト
    await page.click('text=企業管理')
    await page.click('button:has-text("削除"):first')
    
    // 削除確認ダイアログ
    await expect(page.locator('text=削除確認')).toBeVisible()
    await expect(page.locator('text=この企業を削除してもよろしいですか？')).toBeVisible()
    
    await page.click('button:has-text("削除")')
    
    // 削除確認
    await expect(page.locator('text=手動登録テスト企業（更新版）')).not.toBeVisible()
  })

  test('エラーハンドリングとリカバリフロー', async ({ page }) => {
    // ネットワークエラーのシミュレーション
    await page.route('**/api/companies', route => {
      route.abort()
    })
    
    // 企業管理ページに移動
    await page.click('text=企業管理')
    
    // エラー表示確認
    await expect(page.locator('text=データの取得に失敗しました')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=ページを再読み込みしてください')).toBeVisible()
    
    // 再試行ボタンの存在確認
    await expect(page.locator('button:has-text("再試行")')).toBeVisible()
    
    // ネットワーク復旧シミュレーション
    await page.unroute('**/api/companies')
    
    // 再試行実行
    await page.click('button:has-text("再試行")')
    
    // 正常表示の復旧確認
    await expect(page.locator('text=データの取得に失敗しました')).not.toBeVisible()
    await expect(page.locator('text=企業管理')).toBeVisible()
  })

  test('レスポンシブデザインとモバイル対応', async ({ page }) => {
    // モバイルビューポートに変更
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 企業管理ページでのモバイル表示確認
    await page.click('text=企業管理')
    await expect(page.locator('h2')).toContainText('企業管理')
    
    // テーブルの横スクロール確認
    await expect(page.locator('.ant-table-wrapper')).toBeVisible()
    
    // モバイルメニューの動作確認（もしあれば）
    const menuButton = page.locator('button[aria-label="menu"]')
    if (await menuButton.isVisible()) {
      await menuButton.click()
      await expect(page.locator('text=データ収集')).toBeVisible()
    }
    
    // タブレットサイズで確認
    await page.setViewportSize({ width: 768, height: 1024 })
    
    // データ収集ページでの表示確認
    await page.click('text=データ収集')
    await expect(page.locator('h2')).toContainText('データ収集')
    
    // フォームレイアウトの確認
    await expect(page.locator('input[placeholder*="IT企業,広告代理店"]')).toBeVisible()
    
    // デスクトップサイズに戻す
    await page.setViewportSize({ width: 1920, height: 1080 })
  })

  test('アクセシビリティとキーボードナビゲーション', async ({ page }) => {
    // キーボードナビゲーションテスト
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter') // データ収集リンクを想定
    
    // フォーカス管理の確認
    const activeElement = page.locator(':focus')
    await expect(activeElement).toBeVisible()
    
    // ESCキーでモーダルを閉じるテスト
    await page.click('text=企業管理')
    await page.click('button:has-text("新規追加")')
    await expect(page.locator('text=企業登録')).toBeVisible()
    
    await page.keyboard.press('Escape')
    await expect(page.locator('text=企業登録')).not.toBeVisible()
    
    // ARIA ラベルとロールの確認
    await expect(page.locator('[role="button"]')).toHaveCount({ greaterThan: 0 })
    await expect(page.locator('[aria-label]')).toHaveCount({ greaterThan: 0 })
  })

  test('データの永続化と状態管理', async ({ page }) => {
    // 企業追加
    await page.click('text=企業管理')
    await page.click('button:has-text("新規追加")')
    
    await page.fill('input[placeholder="例: 株式会社サンプル"]', '永続化テスト企業')
    await page.fill('input[placeholder="https://example.com"]', 'https://persistence-test.com')
    
    await page.click('button:has-text("登録")')
    await expect(page.locator('text=永続化テスト企業')).toBeVisible()
    
    // ページリロード
    await page.reload()
    
    // データの永続化確認
    await expect(page.locator('text=永続化テスト企業')).toBeVisible()
    
    // 別ページに移動して戻る
    await page.click('text=データ収集')
    await page.click('text=企業管理')
    
    // 状態の維持確認
    await expect(page.locator('text=永続化テスト企業')).toBeVisible()
    
    // フィルター状態の維持
    await page.click('text=東京都')
    await page.click('text=営業管理')
    await page.click('text=企業管理')
    
    // フィルター状態がリセットされることを確認（正常な動作）
    const prefectureSelect = page.locator('label:has-text("都道府県") + * .ant-select')
    await expect(prefectureSelect).toContainText('都道府県')
  })

  test('同時操作と競合状態の処理', async ({ page, context }) => {
    // 新しいページ（タブ）を開く
    const page2 = await context.newPage()
    await page2.goto('http://localhost:3000')
    
    // 両方のページで企業管理を開く
    await page.click('text=企業管理')
    await page2.click('text=企業管理')
    
    // Page1で企業追加
    await page.click('button:has-text("新規追加")')
    await page.fill('input[placeholder="例: 株式会社サンプル"]', '同時操作テスト企業1')
    await page.fill('input[placeholder="https://example.com"]', 'https://concurrent1.com')
    await page.click('button:has-text("登録")')
    
    // Page2で企業追加
    await page2.click('button:has-text("新規追加")')
    await page2.fill('input[placeholder="例: 株式会社サンプル"]', '同時操作テスト企業2')
    await page2.fill('input[placeholder="https://example.com"]', 'https://concurrent2.com')
    await page2.click('button:has-text("登録")')
    
    // 両方のページで追加された企業が表示されることを確認
    await page.click('button:has-text("更新")')
    await page2.click('button:has-text("更新")')
    
    await expect(page.locator('text=同時操作テスト企業1')).toBeVisible()
    await expect(page.locator('text=同時操作テスト企業2')).toBeVisible()
    
    await expect(page2.locator('text=同時操作テスト企業1')).toBeVisible()
    await expect(page2.locator('text=同時操作テスト企業2')).toBeVisible()
    
    await page2.close()
  })
})