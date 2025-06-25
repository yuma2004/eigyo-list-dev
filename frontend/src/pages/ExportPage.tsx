import React, { useState } from 'react'
import {
  Typography,
  Card,
  Form,
  Select,
  DatePicker,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Alert,
  Spin,
  Modal,
  Progress,
  message,
} from 'antd'
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  EyeOutlined,
  HistoryOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useQuery } from 'react-query'
import ExportService from '../services/exportService'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { RangePicker } = DatePicker

const ExportPage: React.FC = () => {
  const [form] = Form.useForm()
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [exportCount, setExportCount] = useState(0)

  // エクスポート統計データ取得
  const { data: statsData, isLoading: statsLoading, isError: statsError } = useQuery(
    'export-stats',
    () => ExportService.getExportStats(),
    {
      onSuccess: (data) => {
        setExportCount(data.total_companies)
        form.setFieldsValue({
          include_sales_status: true,
        })
      },
    }
  )

  // フォーム値変更時の処理
  const handleFormChange = () => {
    const values = form.getFieldsValue()
    let count = statsData?.total_companies || 0

    // フィルター適用による件数調整
    if (values.status && statsData?.status_summary) {
      count = statsData.status_summary[values.status] || 0
    }
    if (values.prefecture && statsData?.prefecture_summary) {
      count = Math.min(count, statsData.prefecture_summary[values.prefecture] || 0)
    }

    setExportCount(count)
  }

  // CSVエクスポート
  const handleExportCSV = async () => {
    try {
      setIsExporting(true)
      setExportProgress(0)

      const values = form.getFieldsValue()
      const filters = {
        status: values.status,
        prefecture: values.prefecture,
        industry: values.industry,
        include_sales_status: values.include_sales_status,
        date_from: values.date_range?.[0]?.format('YYYY-MM-DD'),
        date_to: values.date_range?.[1]?.format('YYYY-MM-DD'),
      }

      // プログレス更新のシミュレーション
      const interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      await ExportService.downloadCSV(filters)
      
      clearInterval(interval)
      setExportProgress(100)
      message.success('CSVファイルをダウンロードしました')
    } catch (error) {
      message.error('エクスポートに失敗しました')
    } finally {
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
      }, 1000)
    }
  }

  // Excelエクスポート
  const handleExportExcel = async () => {
    try {
      setIsExporting(true)
      setExportProgress(0)

      const values = form.getFieldsValue()
      const filters = {
        status: values.status,
        prefecture: values.prefecture,
        industry: values.industry,
        include_sales_status: values.include_sales_status,
        date_from: values.date_range?.[0]?.format('YYYY-MM-DD'),
        date_to: values.date_range?.[1]?.format('YYYY-MM-DD'),
      }

      // プログレス更新のシミュレーション
      const interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      await ExportService.downloadExcel(filters)
      
      clearInterval(interval)
      setExportProgress(100)
      message.success('Excelファイルをダウンロードしました')
    } catch (error) {
      message.error('エクスポートに失敗しました')
    } finally {
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
      }, 1000)
    }
  }

  // テンプレートダウンロード
  const handleDownloadTemplate = async () => {
    try {
      await ExportService.downloadTemplate()
      message.success('テンプレートをダウンロードしました')
    } catch (error) {
      message.error('テンプレートのダウンロードに失敗しました')
    }
  }

  // プレビュー表示
  const handlePreview = () => {
    // モックデータでプレビュー表示
    const mockData = [
      {
        id: 1,
        company_name: 'サンプル株式会社',
        url: 'https://sample.com',
        prefecture: '東京都',
        status: 'アプローチ中',
      },
      {
        id: 2,
        company_name: 'テスト企業',
        url: 'https://test.com',
        prefecture: '大阪府',
        status: '商談中',
      },
    ]
    setPreviewData(mockData)
    setPreviewVisible(true)
  }

  // フィルターリセット
  const handleReset = () => {
    form.resetFields()
    form.setFieldsValue({ include_sales_status: true })
    setExportCount(statsData?.total_companies || 0)
  }

  // プレビュー用テーブル列
  const previewColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '会社名', dataIndex: 'company_name', key: 'company_name' },
    { title: 'URL', dataIndex: 'url', key: 'url' },
    { title: '都道府県', dataIndex: 'prefecture', key: 'prefecture' },
    { 
      title: 'ステータス', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => <Tag>{status}</Tag>
    },
  ]

  if (statsLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <Spin size="large" data-testid="loading-spinner" />
        </div>
      </div>
    )
  }

  if (statsError) {
    return (
      <div className="page-container">
        <div className="error-container">
          <Alert
            message="統計情報の取得に失敗しました"
            description="ページを再読み込みしてください"
            type="error"
            showIcon
            action={
              <Button type="primary" onClick={() => window.location.reload()}>
                再読み込み
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          エクスポート
        </Title>
        <Paragraph className="page-description">
          企業リストをCSVやExcel形式でエクスポートできます
        </Paragraph>
      </div>

      {/* エクスポート進行中 */}
      {isExporting && (
        <Card style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <Text>エクスポート中...</Text>
            <Progress percent={exportProgress} style={{ marginTop: 8 }} />
          </div>
        </Card>
      )}

      {/* 統計情報 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="登録企業数"
              value={statsData?.total_companies || 0}
              suffix="件"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="エクスポート対象"
              value={exportCount}
              suffix="件"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="アプローチ中"
              value={statsData?.status_summary?.['アプローチ中'] || 0}
              suffix="件"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最終更新"
              value={statsData?.last_updated ? dayjs(statsData.last_updated).format('MM/DD') : '-'}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* エクスポート設定 */}
        <Col span={16}>
          <Card title="エクスポート設定" style={{ marginBottom: 24 }}>
            <Form
              form={form}
              layout="vertical"
              onValuesChange={handleFormChange}
            >
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="status" label="営業ステータス">
                    <Select placeholder="すべて" allowClear>
                      <Option value="未着手">未着手</Option>
                      <Option value="アプローチ中">アプローチ中</Option>
                      <Option value="商談中">商談中</Option>
                      <Option value="成約">成約</Option>
                      <Option value="見送り">見送り</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="prefecture" label="都道府県">
                    <Select placeholder="すべて" allowClear>
                      <Option value="東京都">東京都</Option>
                      <Option value="大阪府">大阪府</Option>
                      <Option value="愛知県">愛知県</Option>
                      <Option value="神奈川県">神奈川県</Option>
                      <Option value="福岡県">福岡県</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="industry" label="業界">
                    <Select placeholder="すべて" allowClear>
                      <Option value="IT">IT</Option>
                      <Option value="広告">広告</Option>
                      <Option value="コンサル">コンサルティング</Option>
                      <Option value="製造業">製造業</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="date_range" label="作成日期間">
                    <RangePicker
                      style={{ width: '100%' }}
                      placeholder={['作成日（開始）', '作成日（終了）']}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="include_sales_status"
                    label="営業ステータスを含める"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button onClick={handleReset}>
                    リセット
                  </Button>
                  <Button icon={<EyeOutlined />} onClick={handlePreview}>
                    プレビュー
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          {/* エクスポート実行 */}
          <Card title="エクスポート実行">
            <Row gutter={16}>
              <Col span={8}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <FileTextOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>CSV形式</Text>
                    <div>
                      <Text type="secondary">表計算ソフトで利用可能</Text>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportCSV}
                    loading={isExporting}
                    block
                  >
                    CSV形式でエクスポート
                  </Button>
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <FileExcelOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>Excel形式</Text>
                    <div>
                      <Text type="secondary">書式設定済み</Text>
                    </div>
                  </div>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleExportExcel}
                    loading={isExporting}
                    block
                  >
                    Excel形式でエクスポート
                  </Button>
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  hoverable
                  style={{ textAlign: 'center' }}
                  bodyStyle={{ padding: '24px 16px' }}
                >
                  <FilePdfOutlined style={{ fontSize: 48, color: '#fa8c16', marginBottom: 16 }} />
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>テンプレート</Text>
                    <div>
                      <Text type="secondary">インポート用</Text>
                    </div>
                  </div>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadTemplate}
                    block
                  >
                    テンプレートをダウンロード
                  </Button>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* サイドバー */}
        <Col span={8}>
          {/* ステータス別統計 */}
          <Card title="ステータス別統計" style={{ marginBottom: 24 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(statsData?.status_summary || {}).map(([status, count]) => (
                <div key={status} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>{status}</Text>
                  <Text strong>{count as number}件</Text>
                </div>
              ))}
            </Space>
          </Card>

          {/* エクスポート履歴 */}
          <Card
            title={
              <Space>
                <HistoryOutlined />
                エクスポート履歴
              </Space>
            }
            extra={<Button icon={<ReloadOutlined />} size="small" />}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <Text>CSV エクスポート</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs().subtract(1, 'hour').format('HH:mm')}
                    </Text>
                  </div>
                </div>
                <Tag color="success">完了</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <Text>Excel エクスポート</Text>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs().subtract(2, 'hour').format('HH:mm')}
                    </Text>
                  </div>
                </div>
                <Tag color="success">完了</Tag>
              </div>
              <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
                過去24時間の履歴
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* プレビューモーダル */}
      <Modal
        title="エクスポートプレビュー"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        <Table
          columns={previewColumns}
          dataSource={previewData}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          size="small"
        />
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary">
            実際のエクスポートでは {exportCount} 件のデータが出力されます
          </Text>
        </div>
      </Modal>
    </div>
  )
}

export default ExportPage