import React, { useState } from 'react'
import {
  Typography,
  Table,
  Button,
  Input,
  Select,
  Space,
  Modal,
  Form,
  message,
  Popconfirm,
  Tag,
  Spin,
  Alert,
  Empty,
  Row,
  Col,
  Card,
  Statistic,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from '../hooks'
import type { Company, CompanyFilters } from '../types/api'

const { Title, Paragraph } = Typography
const { Option } = Select

const CompaniesList: React.FC = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<CompanyFilters>({})
  const [pagination, setPagination] = useState({ page: 1, page_size: 100 })
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [form] = Form.useForm()

  // API hooks
  const { data, isLoading, isError, refetch } = useCompanies(filters, pagination)
  const { mutate: createCompany, isLoading: isCreating } = useCreateCompany()
  const { mutate: updateCompany, isLoading: isUpdating } = useUpdateCompany()
  const { mutate: deleteCompany, isLoading: isDeleting } = useDeleteCompany()

  // Filter handlers
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, keyword: value || undefined }))
  }

  const handleStatusFilter = (value: string) => {
    setFilters(prev => ({ ...prev, status: value || undefined }))
  }

  const handlePrefectureFilter = (value: string) => {
    setFilters(prev => ({ ...prev, prefecture: value || undefined }))
  }

  // Modal handlers
  const handleModalOpen = (company?: Company) => {
    setEditingCompany(company || null)
    setIsModalVisible(true)
    if (company) {
      form.setFieldsValue(company)
    } else {
      form.resetFields()
    }
  }

  const handleModalClose = () => {
    setIsModalVisible(false)
    setEditingCompany(null)
    form.resetFields()
  }

  const handleSubmit = async (values: Company) => {
    try {
      if (editingCompany) {
        updateCompany({ id: editingCompany.id!, company: values })
      } else {
        createCompany(values)
      }
      handleModalClose()
    } catch (error) {
      message.error('操作に失敗しました')
    }
  }

  const handleDelete = (id: number) => {
    deleteCompany(id)
  }

  const handleExportCSV = () => {
    // CSV export logic will be implemented
    message.info('CSV出力機能は準備中です')
  }

  const handleExportExcel = () => {
    // Excel export logic will be implemented  
    message.info('Excel出力機能は準備中です')
  }

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '会社名',
      dataIndex: 'company_name',
      key: 'company_name',
      render: (text: string, record: Company) => (
        <Button
          type="link"
          onClick={() => navigate(`/companies/${record.id}`)}
          style={{ padding: 0, height: 'auto' }}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ),
    },
    {
      title: '都道府県',
      dataIndex: 'prefecture',
      key: 'prefecture',
      width: 100,
    },
    {
      title: '代表者',
      dataIndex: 'representative',
      key: 'representative',
      width: 120,
    },
    {
      title: '事業内容',
      dataIndex: 'business_content',
      key: 'business_content',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: Company) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/companies/${record.id}`)}
            size="small"
          >
            詳細
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleModalOpen(record)}
            size="small"
          >
            編集
          </Button>
          <Popconfirm
            title="削除確認"
            description="この企業を削除してもよろしいですか？"
            onConfirm={() => handleDelete(record.id!)}
            okText="削除"
            cancelText="キャンセル"
          >
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
              size="small"
            >
              削除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <Spin size="large" data-testid="loading-spinner" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="page-container">
        <div className="error-container">
          <Alert
            message="データの取得に失敗しました"
            description="ページを再読み込みしてください"
            type="error"
            showIcon
            action={
              <Button size="small" danger onClick={() => refetch()}>
                再試行
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const companies = data?.companies || []
  const total = data?.total || 0

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          企業管理
        </Title>
        <Paragraph className="page-description">
          収集した企業情報の確認・編集・管理ができます
        </Paragraph>
      </div>

      {/* 統計カード */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="登録企業数" value={total} />
          </Card>
        </Col>
      </Row>

      {/* フィルター・アクションバー */}
      <div className="action-bar">
        <div className="action-bar-left">
          <Input.Search
            placeholder="会社名で検索"
            allowClear
            style={{ width: 250 }}
            onSearch={handleSearch}
          />
          <Select
            placeholder="ステータス"
            allowClear
            style={{ width: 150 }}
            onChange={handleStatusFilter}
          >
            <Option value="未着手">未着手</Option>
            <Option value="アプローチ中">アプローチ中</Option>
            <Option value="商談中">商談中</Option>
            <Option value="成約">成約</Option>
            <Option value="見送り">見送り</Option>
          </Select>
          <Select
            placeholder="都道府県"
            allowClear
            style={{ width: 150 }}
            onChange={handlePrefectureFilter}
          >
            <Option value="東京都">東京都</Option>
            <Option value="大阪府">大阪府</Option>
            <Option value="愛知県">愛知県</Option>
            <Option value="神奈川県">神奈川県</Option>
            <Option value="福岡県">福岡県</Option>
          </Select>
        </div>
        <div className="action-bar-right">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
              更新
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExportCSV}>
              CSV出力
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExportExcel}>
              Excel出力
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleModalOpen()}
            >
              新規追加
            </Button>
          </Space>
        </div>
      </div>

      {/* テーブル */}
      {companies.length === 0 ? (
        <div className="empty-container">
          <Empty
            description={
              <div>
                <div>企業データがありません</div>
                <div style={{ marginTop: 8, color: '#8c8c8c' }}>
                  データ収集を開始して企業情報を追加しましょう
                </div>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/scraping')}>
              データ収集を開始
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="table-container">
          <Table
            columns={columns}
            dataSource={companies}
            rowKey="id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.page_size,
              total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} / ${total}件`,
              onChange: (page, pageSize) => {
                setPagination({ page, page_size: pageSize || 100 })
              },
            }}
            scroll={{ x: 'max-content' }}
          />
          <div style={{ marginTop: 16, textAlign: 'center', color: '#8c8c8c' }}>
            {total}件
          </div>
        </div>
      )}

      {/* 企業追加・編集モーダル */}
      <Modal
        title={editingCompany ? '企業編集' : '企業登録'}
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="company_name"
                label="会社名"
                rules={[{ required: true, message: '会社名を入力してください' }]}
              >
                <Input placeholder="例: 株式会社サンプル" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="url"
                label="企業サイトURL"
                rules={[
                  { required: true, message: 'URLを入力してください' },
                  { type: 'url', message: '正しいURLを入力してください' },
                ]}
              >
                <Input placeholder="https://example.com" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="住所">
            <Input placeholder="東京都渋谷区1-1-1" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="tel" label="電話番号">
                <Input placeholder="03-1234-5678" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fax" label="FAX番号">
                <Input placeholder="03-1234-5679" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="representative" label="代表者名">
                <Input placeholder="山田太郎" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="business_content" label="事業内容">
            <Input.TextArea
              rows={3}
              placeholder="IT事業、コンサルティング業務など"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="established_date" label="設立年月日">
                <Input placeholder="2020-01-01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="capital" label="資本金">
                <Input placeholder="1000万円" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="contact_url" label="問い合わせフォームURL">
            <Input placeholder="https://example.com/contact" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleModalClose}>
                キャンセル
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isCreating || isUpdating}
              >
                {editingCompany ? '更新' : '登録'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CompaniesList