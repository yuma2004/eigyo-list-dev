import { useQuery, useMutation, useQueryClient } from 'react-query'
import { message } from 'antd'
import { ScrapingService } from '../services'
import type { ScrapingConfig } from '../types/api'

// React Query キー
const QUERY_KEYS = {
  scrapingStatus: 'scraping-status',
  scrapingHistory: 'scraping-history',
  scrapingConfig: 'scraping-config',
}

// スクレイピング状況取得フック
export const useScrapingStatus = (refetchInterval = 3000) => {
  return useQuery(
    QUERY_KEYS.scrapingStatus,
    () => ScrapingService.getScrapingStatus(),
    {
      refetchInterval,
      onError: (error: any) => {
        console.error('Failed to fetch scraping status:', error)
      },
    }
  )
}

// スクレイピング履歴取得フック
export const useScrapingHistory = (limit = 10, offset = 0) => {
  return useQuery(
    [QUERY_KEYS.scrapingHistory, limit, offset],
    () => ScrapingService.getScrapingHistory(limit, offset),
    {
      staleTime: 2 * 60 * 1000, // 2分
      onError: (error: any) => {
        message.error('スクレイピング履歴の取得に失敗しました')
        console.error('Failed to fetch scraping history:', error)
      },
    }
  )
}

// スクレイピング設定取得フック
export const useScrapingConfig = () => {
  return useQuery(
    QUERY_KEYS.scrapingConfig,
    () => ScrapingService.getScrapingConfig(),
    {
      staleTime: 10 * 60 * 1000, // 10分
      onError: (error: any) => {
        message.error('スクレイピング設定の取得に失敗しました')
        console.error('Failed to fetch scraping config:', error)
      },
    }
  )
}

// スクレイピング開始フック
export const useStartScraping = () => {
  const queryClient = useQueryClient()

  return useMutation(
    (config: ScrapingConfig) => ScrapingService.startScraping(config),
    {
      onSuccess: () => {
        message.success('スクレイピングを開始しました')
        // ステータスのキャッシュを無効化して即座に更新
        queryClient.invalidateQueries(QUERY_KEYS.scrapingStatus)
      },
      onError: (error: any) => {
        message.error('スクレイピングの開始に失敗しました')
        console.error('Failed to start scraping:', error)
      },
    }
  )
}

// スクレイピング停止フック
export const useStopScraping = () => {
  const queryClient = useQueryClient()

  return useMutation(
    () => ScrapingService.stopScraping(),
    {
      onSuccess: () => {
        message.success('スクレイピングを停止しました')
        // ステータスのキャッシュを無効化
        queryClient.invalidateQueries(QUERY_KEYS.scrapingStatus)
      },
      onError: (error: any) => {
        message.error('スクレイピングの停止に失敗しました')
        console.error('Failed to stop scraping:', error)
      },
    }
  )
}

// スクレイピング設定更新フック
export const useUpdateScrapingConfig = () => {
  const queryClient = useQueryClient()

  return useMutation(
    (config: Record<string, any>) => ScrapingService.updateScrapingConfig(config),
    {
      onSuccess: () => {
        message.success('スクレイピング設定を更新しました')
        // 設定のキャッシュを無効化
        queryClient.invalidateQueries(QUERY_KEYS.scrapingConfig)
      },
      onError: (error: any) => {
        message.error('スクレイピング設定の更新に失敗しました')
        console.error('Failed to update scraping config:', error)
      },
    }
  )
}