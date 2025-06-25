import React, { useState } from 'react'
import {
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  Input,
  Button,
  Modal,
  Form,
  DatePicker,
  Space,
  Tag,
  Timeline,
  Alert,
  Spin,
  Progress,
  Divider,
} from 'antd'
import {
  TrophyOutlined,
  UserOutlined,
  CalendarOutlined,
  BarChartOutlined,
  EditOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  useSalesDashboard,
  useSalesStatuses,
  useUpcomingFollowUps,
  useConversionAnalytics,
  useUpdateSalesStatus,
  useScheduleFollowUp,
} from '../hooks/useSales'
import type { SalesStatusUpdateRequest } from '../services/salesService'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const SalesManagement: React.FC = () => {
  const navigate = useNavigate()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingStatus, setEditingStatus] = useState<any>(null)
  const [filters, setFilters] = useState<{ status?: string; contact_person?: string }>({})
  const [form] = Form.useForm()

  // API hooks
  const { data: dashboardData, isLoading: dashboardLoading, isError: dashboardError } = useSalesDashboard()
  const { data: statusesData, isLoading: statusesLoading, isError: statusesError } = useSalesStatuses(filters)
  const { data: followUpsData, isLoading: followUpsLoading, isError: followUpsError } = useUpcomingFollowUps(7)
  const { data: analyticsData, isLoading: analyticsLoading } = useConversionAnalytics('monthly')

  const { mutate: updateStatus, isLoading: isUpdating } = useUpdateSalesStatus()
  const { mutate: scheduleFollowUp, isLoading: isScheduling } = useScheduleFollowUp()

  // Handlers
  const handleEditStatus = (statusItem: any) => {
    setEditingStatus(statusItem)
    form.setFieldsValue({
      ...statusItem.status,
      last_contact_date: statusItem.status.last_contact_date
        ? dayjs(statusItem.status.last_contact_date)
        : null,
    })
    setIsModalVisible(true)
  }

  const handleModalClose = () => {
    setIsModalVisible(false)
    setEditingStatus(null)
    form.resetFields()
  }

  const handleSubmit = (values: any) => {
    const statusData: SalesStatusUpdateRequest = {
      ...values,
      last_contact_date: values.last_contact_date
        ? values.last_contact_date.format('YYYY-MM-DD')
        : undefined,
    }

    updateStatus(
      { companyId: editingStatus.status.company_id, statusData },
      {
        onSuccess: () => {
          handleModalClose()
        },
      }
    )
  }

  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, status: value || undefined }))
  }

  const handlePersonFilter = (value: string) => {
    setFilters(prev => ({ ...prev, contact_person: value || undefined }))
  }

  // Loading状態
  if (dashboardLoading || statusesLoading || followUpsLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <Spin size="large" data-testid="loading-spinner" />
        </div>
      </div>
    )
  }

  // エラー状態
  if (dashboardError || statusesError || followUpsError) {
    return (
      <div className="page-container">
        <div className="error-container">
          <Alert
            message="データの取得に失敗しました"
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

  const dashboard = dashboardData || { summary: {}, total_companies: 0, recent_updates: [], conversion_rate: 0 }
  const statuses = statusesData || []
  const followUps = followUpsData?.follow_ups || []

  // テーブル列定義
  const columns = [
    {
      title: '企業ID',
      dataIndex: ['status', 'company_id'],
      key: 'company_id',
      width: 80,
    },
    {
      title: 'ステータス',
      dataIndex: ['status', 'status'],
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          '未着手': 'default',
          'アプローチ中': 'processing',
          '商談中': 'warning',
          '成約': 'success',
          '見送り': 'error',
        }
        return <Tag color={colors[status] || 'default'}>{status}</Tag>
      },
    },
    {
      title: '担当者',
      dataIndex: ['status', 'contact_person'],
      key: 'contact_person',
      render: (person: string) => person || '-',
    },
    {
      title: '最終コンタクト日',
      dataIndex: ['status', 'last_contact_date'],
      key: 'last_contact_date',
      render: (date: string) => date ? dayjs(date).format('YYYY/MM/DD') : '-',
    },
    {
      title: 'メモ',
      dataIndex: ['status', 'memo'],
      key: 'memo',
      ellipsis: true,
      render: (memo: string) => memo || '-',
    },
    {
      title: '次回アクション',
      dataIndex: ['status', 'next_action'],
      key: 'next_action',
      ellipsis: true,
      render: (action: string) => action || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditStatus(record)}
          >
            更新
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => navigate(`/companies/${record.status.company_id}`)}
          >
            詳細
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          営業管理
        </Title>
        <Paragraph className="page-description">
          営業ステータスの管理とダッシュボードで進捗を確認できます
        </Paragraph>
      </div>

      {/* ダッシュボード統計 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="総企業数"
              value={dashboard.total_companies}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="未着手"
              value={dashboard.summary['未着手'] || 0}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="アプローチ中"
              value={dashboard.summary['アプローチ中'] || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="商談中"
              value={dashboard.summary['商談中'] || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="成約"
              value={dashboard.summary['成約'] || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="成約率"
              value={dashboard.conversion_rate}
              precision={1}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        {/* 最近の更新 */}
        <Col span={12}>
          <Card title="最近の更新" extra={<a href="/companies">すべて見る</a>}>
            <Timeline>
              {dashboard.recent_updates.map((update: any, index: number) => (
                <Timeline.Item key={index}>
                  <div>
                    <Text strong>{update.company_name}</Text>
                    <div>
                      <Tag color="blue">{update.status}</Tag>
                      <Text type="secondary">{update.contact_person}</Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(update.updated_at).format('MM/DD HH:mm')}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
              {dashboard.recent_updates.length === 0 && (
                <Timeline.Item>
                  <Text type="secondary">更新履歴がありません</Text>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </Col>

        {/* 今後の予定 */}
        <Col span={12}>
          <Card title="今後の予定" extra={<CalendarOutlined />}>
            <Timeline>
              {followUps.map((followUp: any, index: number) => (
                <Timeline.Item key={index}>
                  <div>
                    <Text strong>{followUp.company_name}</Text>
                    <div>
                      <Text>{followUp.next_action}</Text>
                    </div>
                    <div>
                      <Text type="secondary">{followUp.contact_person}</Text>
                      <Text type="secondary" style={{ marginLeft: 8 }}>
                        {dayjs(followUp.scheduled_date).format('MM/DD')}
                      </Text>
                    </div>
                  </div>
                </Timeline.Item>
              ))}
              {followUps.length === 0 && (
                <Timeline.Item>
                  <Text type="secondary">予定がありません</Text>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* 成約率推移 */}
      {analyticsData && (
        <Card title="成約率推移" style={{ marginBottom: 24 }}>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Progress
              type="dashboard"
              percent={analyticsData.analytics.conversion_rate}
              format={(percent) => `${percent}%`}
            />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                総アプローチ数: {analyticsData.analytics.total_approached} | 
                成約数: {analyticsData.analytics.total_converted}
              </Text>
            </div>
          </div>
        </Card>
      )}

      {/* フィルター */}
      <Card title="営業ステータス一覧" style={{ marginBottom: 24 }}>
        <div className="action-bar" style={{ marginBottom: 16 }}>
          <div className="action-bar-left">
            <Space>
              <Select
                placeholder="すべて"
                allowClear
                style={{ width: 150 }}
                onChange={handleStatusFilter}
                defaultValue=""
              >
                <Option value="">すべて</Option>
                <Option value="未着手">未着手</Option>
                <Option value="アプローチ中">アプローチ中</Option>
                <Option value="商談中">商談中</Option>
                <Option value="成約">成約</Option>
                <Option value="見送り">見送り</Option>
              </Select>
              <Input
                placeholder="担当者名で検索"
                allowClear
                style={{ width: 200 }}
                onChange={(e) => handlePersonFilter(e.target.value)}
                prefix={<SearchOutlined />}
              />
            </Space>
          </div>
          <div className="action-bar-right">
            <Button icon={<ReloadOutlined />} onClick={() => window.location.reload()}>
              更新
            </Button>
          </div>
        </div>

        {/* テーブル */}
        <Table
          columns={columns}
          dataSource={statuses}
          rowKey={(record) => record.status.company_id}
          loading={statusesLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}件`,
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* ステータス更新モーダル */}
      <Modal
        title="ステータス更新"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="status"
            label="営業ステータス"
            rules={[{ required: true, message: 'ステータスを選択してください' }]}
          >
            <Select>
              <Option value="未着手">未着手</Option>
              <Option value="アプローチ中">アプローチ中</Option>
              <Option value="商談中">商談中</Option>
              <Option value="成約">成約</Option>
              <Option value="見送り">見送り</Option>
            </Select>
          </Form.Item>

          <Form.Item name="contact_person" label="担当者名">
            <Input placeholder="担当者名を入力" />
          </Form.Item>

          <Form.Item name="last_contact_date" label="最終コンタクト日">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="next_action" label="次回アクション">
            <Input placeholder="次回予定しているアクション" />
          </Form.Item>

          <Form.Item name="memo" label="メモ">
            <TextArea rows={4} placeholder="営業活動に関するメモ" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleModalClose}>
                キャンセル
              </Button>
              <Button type="primary" htmlType="submit" loading={isUpdating}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SalesManagement