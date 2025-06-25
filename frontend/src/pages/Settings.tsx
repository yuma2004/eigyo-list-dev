import React from 'react'
import { Typography, Empty } from 'antd'

const { Title, Paragraph } = Typography

const Settings: React.FC = () => {
  return (
    <div className="page-container">
      <div className="page-header">
        <Title level={2} className="page-title">
          設定
        </Title>
        <Paragraph className="page-description">
          アプリケーションの各種設定を管理できます
        </Paragraph>
      </div>

      <Empty
        description="Phase 6 で実装予定"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    </div>
  )
}

export default Settings