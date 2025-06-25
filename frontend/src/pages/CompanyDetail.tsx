import React, { useState } from 'react'
import {
  Typography,
  Card,
  Descriptions,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  Spin,
  Alert,
  Tag,
  Timeline,
  DatePicker,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  LinkOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useCompany, useUpdateCompany } from '../hooks/useCompanies'
import { useSalesStatus, useUpdateSalesStatus } from '../hooks/useSales'
import type { Company, SalesStatus } from '../types/api'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { TextArea } = Input

const CompanyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isSalesModalVisible, setIsSalesModalVisible] = useState(false)
  const [companyForm] = Form.useForm()
  const [salesForm] = Form.useForm()

  // API hooks
  const {
    data: companyData,
    isLoading: companyLoading,
    isError: companyError,
    error: companyErrorData,
  } = useCompany(parseInt(id || '0'))

  const {
    data: salesData,
    isLoading: salesLoading,
    isError: salesError,
  } = useSalesStatus(parseInt(id || '0'))

  const { mutate: updateCompany, isLoading: isUpdatingCompany } = useUpdateCompany()
  const { mutate: updateSalesStatus, isLoading: isUpdatingSales } = useUpdateSalesStatus()

  // Handlers
  const handleBack = () => {
    navigate('/companies')
  }

  const handleEditCompany = () => {
    if (companyData?.company) {
      companyForm.setFieldsValue(companyData.company)
      setIsEditModalVisible(true)
    }
  }

  const handleEditSales = () => {
    if (salesData?.status) {
      salesForm.setFieldsValue({
        ...salesData.status,
        last_contact_date: salesData.status.last_contact_date 
          ? dayjs(salesData.status.last_contact_date) 
          : null,
      })
      setIsSalesModalVisible(true)
    }
  }

  const handleCompanySubmit = (values: Company) => {
    updateCompany(
      { id: parseInt(id || '0'), company: values },
      {
        onSuccess: () => {
          setIsEditModalVisible(false)
        },
      }
    )
  }

  const handleSalesSubmit = (values: any) => {
    const salesData = {
      ...values,
      last_contact_date: values.last_contact_date 
        ? values.last_contact_date.format('YYYY-MM-DD')
        : undefined,
    }

    updateSalesStatus(
      { companyId: parseInt(id || '0'), statusData: salesData },
      {
        onSuccess: () => {
          setIsSalesModalVisible(false)
        },
      }
    )
  }

  if (companyLoading || salesLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <Spin size="large" data-testid="loading-spinner" />
        </div>
      </div>
    )
  }

  if (companyError) {
    const isNotFound = (companyErrorData as any)?.response?.status === 404
    return (
      <div className="page-container">
        <div className="error-container">
          <Alert
            message={isNotFound ? '企業が見つかりません' : 'データの取得に失敗しました'}
            description={
              isNotFound 
                ? '指定された企業は存在しないか、削除されています'
                : 'ページを再読み込みしてください'
            }
            type="error"
            showIcon
            action={
              <Space>
                <Button onClick={handleBack}>
                  企業一覧に戻る
                </Button>
                {!isNotFound && (
                  <Button type="primary" onClick={() => window.location.reload()}>
                    再読み込み
                  </Button>
                )}
              </Space>
            }
          />
        </div>
      </div>
    )
  }

  const company = companyData?.company
  const salesStatus = salesData?.status

  if (!company) {
    return (
      <div className="page-container">
        <div className="error-container">
          <Alert
            message="企業が見つかりません"
            type="error"
            showIcon
          />
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      '未着手': 'default',
      'アプローチ中': 'processing',
      '商談中': 'warning',
      '成約': 'success',
      '見送り': 'error',
    }
    return colors[status] || 'default'
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginRight: 16 }}
          >
            戻る
          </Button>
          <div>
            <Title level={2} className="page-title" style={{ margin: 0 }}>
              企業詳細
            </Title>
            <Paragraph className="page-description" style={{ margin: 0 }}>
              企業の詳細情報と営業履歴を確認できます
            </Paragraph>
          </div>
        </div>
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={handleEditCompany}
          >
            企業情報編集
          </Button>
          <Button
            type="primary"
            onClick={handleEditSales}
          >
            ステータス更新
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* 企業基本情報 */}
        <Col span={24}>
          <Card title="企業基本情報" style={{ marginBottom: 24 }}>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="会社名" span={2}>
                <Text strong style={{ fontSize: 16 }}>
                  {company.company_name}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="企業サイト" span={2}>
                <a
                  href={company.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <LinkOutlined style={{ marginRight: 8 }} />
                  {company.url}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="住所" span={2}>
                {company.address || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="電話番号">
                {company.tel ? (
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneOutlined style={{ marginRight: 8 }} />
                    {company.tel}
                  </span>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="FAX番号">
                {company.fax || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="代表者名">
                {company.representative || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="設立年月日">
                {company.established_date || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="資本金" span={2}>
                {company.capital || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="事業内容" span={2}>
                {company.business_content || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="問い合わせフォーム" span={2}>
                {company.contact_url ? (
                  <a
                    href={company.contact_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MailOutlined style={{ marginRight: 8 }} />
                    問い合わせフォーム
                  </a>
                ) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 営業ステータス */}
        <Col span={24}>
          <Card title="営業ステータス">
            {salesStatus ? (
              <Descriptions column={2} bordered>
                <Descriptions.Item label="ステータス">
                  <Tag color={getStatusColor(salesStatus.status)}>
                    {salesStatus.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="担当者">
                  {salesStatus.contact_person || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="最終コンタクト日">
                  {salesStatus.last_contact_date ? (
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarOutlined style={{ marginRight: 8 }} />
                      {dayjs(salesStatus.last_contact_date).format('YYYY年MM月DD日')}
                    </span>
                  ) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="次回アクション">
                  {salesStatus.next_action || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="メモ" span={2}>
                  {salesStatus.memo || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="最終更新日時" span={2}>
                  {salesStatus.updated_at 
                    ? dayjs(salesStatus.updated_at).format('YYYY年MM月DD日 HH:mm')
                    : '-'}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Alert
                message="営業ステータスが登録されていません"
                description="ステータス更新ボタンから営業情報を登録してください"
                type="info"
                showIcon
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 企業編集モーダル */}
      <Modal
        title="企業情報を編集"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={companyForm}
          layout="vertical"
          onFinish={handleCompanySubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="company_name"
                label="会社名"
                rules={[{ required: true, message: '会社名を入力してください' }]}
              >
                <Input />
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
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="住所">
            <Input />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="tel" label="電話番号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fax" label="FAX番号">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="representative" label="代表者名">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="business_content" label="事業内容">
            <TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="established_date" label="設立年月日">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="capital" label="資本金">
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="contact_url" label="問い合わせフォームURL">
            <Input />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsEditModalVisible(false)}>
                キャンセル
              </Button>
              <Button type="primary" htmlType="submit" loading={isUpdatingCompany}>
                更新
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 営業ステータス更新モーダル */}
      <Modal
        title="営業ステータスを更新"
        open={isSalesModalVisible}
        onCancel={() => setIsSalesModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={salesForm}
          layout="vertical"
          onFinish={handleSalesSubmit}
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
              <Button onClick={() => setIsSalesModalVisible(false)}>
                キャンセル
              </Button>
              <Button type="primary" htmlType="submit" loading={isUpdatingSales}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CompanyDetail