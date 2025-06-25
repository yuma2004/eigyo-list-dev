import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from 'antd'

import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import CompaniesList from './pages/CompaniesList'
import CompanyDetail from './pages/CompanyDetail'
import ScrapingPage from './pages/ScrapingPage'
import SalesManagement from './pages/SalesManagement'
import ExportPage from './pages/ExportPage'
import Settings from './pages/Settings'

const { Content } = Layout

function App() {
  return (
    <AppLayout>
      <Content style={{ minHeight: 'calc(100vh - 64px)' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<CompaniesList />} />
          <Route path="/companies/:id" element={<CompanyDetail />} />
          <Route path="/scraping" element={<ScrapingPage />} />
          <Route path="/sales" element={<SalesManagement />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Content>
    </AppLayout>
  )
}

export default App