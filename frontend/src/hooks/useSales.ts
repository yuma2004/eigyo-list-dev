import { useQuery, useMutation, useQueryClient } from 'react-query'
import { message } from 'antd'
import { SalesService, type SalesStatusUpdateRequest } from '../services/salesService'

// React Query キー
const QUERY_KEYS = {
  salesStatus: (companyId: number) => ['sales-status', companyId],
  salesStatuses: 'sales-statuses',
  salesDashboard: 'sales-dashboard',
  upcomingFollowUps: 'upcoming-follow-ups',
  conversionAnalytics: (period: string) => ['conversion-analytics', period],
}

// 営業ステータス取得フック
export const useSalesStatus = (companyId: number) => {
  return useQuery(
    QUERY_KEYS.salesStatus(companyId),
    () => SalesService.getSalesStatus(companyId),
    {
      enabled: !!companyId,
      staleTime: 5 * 60 * 1000, // 5分
      onError: (error: any) => {
        message.error('営業ステータスの取得に失敗しました')
        console.error('Failed to fetch sales status:', error)
      },
    }
  )
}

// 営業ステータス一覧取得フック
export const useSalesStatuses = (
  filters?: {
    status?: string
    contact_person?: string
  },
  pagination?: {
    limit?: number
    offset?: number
  }
) => {
  return useQuery(
    [QUERY_KEYS.salesStatuses, filters, pagination],
    () => SalesService.getSalesStatuses(filters, pagination),
    {
      staleTime: 5 * 60 * 1000, // 5分
      onError: (error: any) => {
        message.error('営業ステータス一覧の取得に失敗しました')
        console.error('Failed to fetch sales statuses:', error)
      },
    }
  )
}

// 営業ダッシュボード取得フック
export const useSalesDashboard = () => {
  return useQuery(
    QUERY_KEYS.salesDashboard,
    () => SalesService.getSalesDashboard(),
    {
      staleTime: 2 * 60 * 1000, // 2分
      onError: (error: any) => {
        message.error('営業ダッシュボードの取得に失敗しました')
        console.error('Failed to fetch sales dashboard:', error)
      },
    }
  )
}

// 今後のフォローアップ予定取得フック
export const useUpcomingFollowUps = (days = 7) => {
  return useQuery(
    [QUERY_KEYS.upcomingFollowUps, days],
    () => SalesService.getUpcomingFollowUps(days),
    {
      staleTime: 5 * 60 * 1000, // 5分
      onError: (error: any) => {
        message.error('フォローアップ予定の取得に失敗しました')
        console.error('Failed to fetch upcoming follow-ups:', error)
      },
    }
  )
}

// 成約率分析取得フック
export const useConversionAnalytics = (period: 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
  return useQuery(
    QUERY_KEYS.conversionAnalytics(period),
    () => SalesService.getConversionAnalytics(period),
    {
      staleTime: 10 * 60 * 1000, // 10分
      onError: (error: any) => {
        message.error('成約率分析の取得に失敗しました')
        console.error('Failed to fetch conversion analytics:', error)
      },
    }
  )
}

// 営業ステータス更新フック
export const useUpdateSalesStatus = () => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ companyId, statusData }: { companyId: number; statusData: SalesStatusUpdateRequest }) =>
      SalesService.updateSalesStatus(companyId, statusData),
    {
      onSuccess: (data, variables) => {
        message.success('営業ステータスを更新しました')
        // 関連キャッシュを無効化
        queryClient.invalidateQueries(QUERY_KEYS.salesStatus(variables.companyId))
        queryClient.invalidateQueries(QUERY_KEYS.salesStatuses)
        queryClient.invalidateQueries(QUERY_KEYS.salesDashboard)
      },
      onError: (error: any) => {
        message.error('営業ステータスの更新に失敗しました')
        console.error('Failed to update sales status:', error)
      },
    }
  )
}

// フォローアップ予定設定フック
export const useScheduleFollowUp = () => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ companyId, followUpData }: { companyId: number; followUpData: Record<string, any> }) =>
      SalesService.scheduleFollowUp(companyId, followUpData),
    {
      onSuccess: (data, variables) => {
        message.success('フォローアップ予定を設定しました')
        // 関連キャッシュを無効化
        queryClient.invalidateQueries(QUERY_KEYS.salesStatus(variables.companyId))
        queryClient.invalidateQueries(QUERY_KEYS.upcomingFollowUps)
      },
      onError: (error: any) => {
        message.error('フォローアップ予定の設定に失敗しました')
        console.error('Failed to schedule follow-up:', error)
      },
    }
  )
}