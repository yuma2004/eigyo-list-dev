import React from 'react'
import { Card, Row, Col, Statistic, Typography, Empty } from 'antd'
import {
  DatabaseOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons'

const { Title, Paragraph } = Typography

const Dashboard: React.FC = () => {
  // TODO: 実際のAPIからデータを取得
  const stats = {
    totalCompanies: 0,
    activeScrapings: 0,
    completedDeals: 0,
    conversionRate: 0,
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          ダッシュボード
        </Title>
        <Paragraph className="page-description">
          営業リスト作成ツールの概要と進捗状況を確認できます
        </Paragraph>
      </div>

      {/* 統計カード */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="登録企業数"
              value={stats.totalCompanies}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="実行中収集"
              value={stats.activeScrapings}
              prefix={<RocketOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="成約件数"
              value={stats.completedDeals}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="成約率"
              value={stats.conversionRate}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* メインコンテンツ */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="最近の活動"
            extra={<a href="/companies">すべて見る</a>}
            style={{ height: 400 }}
          >
            <Empty
              description="データがありません"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="営業進捗"
            extra={<a href="/sales">詳細を見る</a>}
            style={{ height: 400 }}
          >
            <Empty
              description="データがありません"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        </Col>
      </Row>

      {/* クイックアクション */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="クイックアクション">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card
                  hoverable
                  onClick={() => window.location.href = '/scraping'}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <RocketOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                  <div>データ収集開始</div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card
                  hoverable
                  onClick={() => window.location.href = '/companies'}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <DatabaseOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                  <div>企業リスト</div>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card
                  hoverable
                  onClick={() => window.location.href = '/export'}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <CheckCircleOutlined style={{ fontSize: 32, color: '#fa8c16', marginBottom: 8 }} />
                  <div>データ出力</div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard