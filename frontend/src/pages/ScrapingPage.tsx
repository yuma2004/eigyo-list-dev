import React, { useState, useEffect } from 'react'
import {
  Typography,
  Card,
  Form,
  Input,
  Select,
  Button,
  Progress,
  Alert,
  Space,
  Table,
  Tag,
  Row,
  Col,
  Statistic,
  Divider,
  InputNumber,
  Switch,
  message,
  Spin,
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import {
  useScrapingStatus,
  useScrapingHistory,
  useScrapingConfig,
  useStartScraping,
  useStopScraping,
  useUpdateScrapingConfig,
} from '../hooks/useScraping'
import type { ScrapingConfig } from '../types/api'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const ScrapingPage: React.FC = () => {
  const [form] = Form.useForm()
  const [configForm] = Form.useForm()
  const [showConfig, setShowConfig] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // API hooks
  const { data: statusData, isLoading: statusLoading } = useScrapingStatus(
    // 実行中の場合は3秒間隔で更新
    statusData?.status === 'running' ? 3000 : 30000
  )
  const { data: historyData, isLoading: historyLoading } = useScrapingHistory(10, 0)
  const { data: configData, isLoading: configLoading } = useScrapingConfig()
  
  const { mutate: startScraping, isLoading: isStarting } = useStartScraping()
  const { mutate: stopScraping, isLoading: isStopping } = useStopScraping()
  const { mutate: updateConfig, isLoading: isUpdatingConfig } = useUpdateScrapingConfig()

  // 設定フォーム初期化
  useEffect(() => {
    if (configData?.config) {
      configForm.setFieldsValue(configData.config)
    }
  }, [configData, configForm])

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true)
      
      // バリデーション
      if (!values.keywords || values.keywords.trim() === '') {
        message.error('検索キーワードを入力してください')
        return
      }

      const config: ScrapingConfig = {
        keywords: values.keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
        target_sites: values.target_sites || ['job_sites'],
        max_pages: values.max_pages || 10,
        prefecture: values.prefecture,
        industry: values.industry,
      }

      startScraping(config)
    } catch (error) {
      message.error('スクレイピングの開始に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStop = () => {
    stopScraping()
  }

  const handleConfigSave = (values: any) => {
    updateConfig(values)
  }

  const isRunning = statusData?.status === 'running'
  const isIdle = statusData?.status === 'idle'

  // テーブル列定義
  const historyColumns = [
    {
      title: '実行日時',
      dataIndex: 'execution_date',
      key: 'execution_date',
      render: (date: string) => new Date(date).toLocaleString('ja-JP'),
    },
    {
      title: 'キーワード',
      dataIndex: 'keyword',
      key: 'keyword',
    },
    {
      title: '収集件数',
      dataIndex: 'collected_count',
      key: 'collected_count',
      align: 'center' as const,
    },
    {
      title: '成功件数',
      dataIndex: 'success_count',
      key: 'success_count',
      align: 'center' as const,
    },
    {
      title: 'エラー件数',
      dataIndex: 'error_count',
      key: 'error_count',
      align: 'center' as const,
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === '成功' ? 'success' : 'error'}>
          {status}
        </Tag>
      ),
    },
  ]

  if (statusLoading && !statusData) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <Spin size="large" data-testid="loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          データ収集
        </Title>
        <Paragraph className="page-description">
          Webスクレイピングによる企業情報の自動収集を実行できます
        </Paragraph>
      </div>

      {/* ステータス表示 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="実行状況"
              value={isRunning ? '実行中' : isIdle ? '待機中' : statusData?.status || '不明'}
              valueStyle={{ 
                color: isRunning ? '#52c41a' : isIdle ? '#1890ff' : '#8c8c8c' 
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="収集済み"
              value={statusData?.collected || 0}
              suffix={statusData?.total ? `/ ${statusData.total}` : ''}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="進捗"
              value={statusData?.progress || 0}
              suffix="%"
              valueStyle={{ color: statusData?.progress === 100 ? '#52c41a' : '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="残り時間"
              value={statusData?.estimated_remaining ? `${Math.floor(statusData.estimated_remaining / 60)}分` : '-'}
            />
          </Card>
        </Col>
      </Row>

      {/* 進捗バー */}
      {isRunning && (
        <Card style={{ marginBottom: 24 }}>
          <div className="progress-container">
            <div className="progress-info">
              <Text>進捗状況</Text>
              <Text>{statusData?.progress || 0}%</Text>
            </div>
            <Progress 
              percent={statusData?.progress || 0} 
              status={statusData?.progress === 100 ? 'success' : 'active'}
            />
            {statusData?.current_url && (
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">処理中: {statusData.current_url}</Text>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 収集設定フォーム */}
      <Card 
        title="収集設定" 
        extra={
          <Space>
            <Button 
              icon={<SettingOutlined />} 
              onClick={() => setShowConfig(!showConfig)}
            >
              詳細設定
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={isRunning}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="keywords"
                label="検索キーワード"
                rules={[{ required: true, message: '検索キーワードを入力してください' }]}
              >
                <Input
                  placeholder="IT企業,広告代理店 (カンマ区切りで複数指定)"
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="prefecture" label="対象都道府県">
                <Select placeholder="選択してください" allowClear>
                  <Option value="東京都">東京都</Option>
                  <Option value="大阪府">大阪府</Option>
                  <Option value="愛知県">愛知県</Option>
                  <Option value="神奈川県">神奈川県</Option>
                  <Option value="福岡県">福岡県</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="industry" label="対象業界">
                <Select placeholder="選択してください" allowClear>
                  <Option value="IT">IT</Option>
                  <Option value="広告">広告</Option>
                  <Option value="コンサル">コンサルティング</Option>
                  <Option value="製造業">製造業</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item 
                name="max_pages" 
                label="最大ページ数"
                initialValue={10}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item 
                name="target_sites" 
                label="対象サイト"
                initialValue={['job_sites']}
              >
                <Select mode="multiple" placeholder="選択してください">
                  <Option value="job_sites">求人サイト</Option>
                  <Option value="press_sites">プレスリリースサイト</Option>
                  <Option value="company_sites">企業サイト</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              {isIdle ? (
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<PlayCircleOutlined />}
                  loading={isStarting || isSubmitting}
                  size="large"
                >
                  収集開始
                </Button>
              ) : (
                <Button
                  danger
                  onClick={handleStop}
                  icon={<PauseCircleOutlined />}
                  loading={isStopping}
                  size="large"
                >
                  収集停止
                </Button>
              )}
              <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
                更新
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* 詳細設定 */}
        {showConfig && (
          <>
            <Divider />
            <Card title="詳細設定" size="small">
              <Form
                form={configForm}
                layout="vertical"
                onFinish={handleConfigSave}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="interval"
                      label="アクセス間隔 (秒)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="timeout"
                      label="タイムアウト (秒)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={10} max={120} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="max_pages_per_site"
                      label="サイト別最大ページ数"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={10} max={1000} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isUpdatingConfig}
                  >
                    設定保存
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </>
        )}
      </Card>

      {/* 実行履歴 */}
      <Card 
        title={
          <Space>
            <HistoryOutlined />
            実行履歴
          </Space>
        }
      >
        <Table
          columns={historyColumns}
          dataSource={historyData?.history || []}
          rowKey="id"
          loading={historyLoading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: '実行履歴がありません',
          }}
        />
      </Card>
    </div>
  )
}

export default ScrapingPage