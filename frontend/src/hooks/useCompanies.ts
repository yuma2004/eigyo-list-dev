import { useQuery, useMutation, useQueryClient } from 'react-query'
import { message } from 'antd'
import { CompaniesService } from '../services'
import type {
  Company,
  CompanyFilters,
  PaginationParams,
} from '../types/api'

// React Query キー
const QUERY_KEYS = {
  companies: 'companies',
  company: (id: number) => ['company', id],
  companiesList: (filters?: CompanyFilters, pagination?: PaginationParams) => 
    ['companies', 'list', filters, pagination],
}

// 企業一覧取得フック
export const useCompanies = (
  filters?: CompanyFilters,
  pagination?: PaginationParams
) => {
  return useQuery(
    QUERY_KEYS.companiesList(filters, pagination),
    () => CompaniesService.getCompanies(filters, pagination),
    {
      staleTime: 5 * 60 * 1000, // 5分
      onError: (error: any) => {
        message.error('企業一覧の取得に失敗しました')
        console.error('Failed to fetch companies:', error)
      },
    }
  )
}

// 企業詳細取得フック
export const useCompany = (id: number) => {
  return useQuery(
    QUERY_KEYS.company(id),
    () => CompaniesService.getCompany(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5分
      onError: (error: any) => {
        message.error('企業詳細の取得に失敗しました')
        console.error('Failed to fetch company:', error)
      },
    }
  )
}

// 企業作成フック
export const useCreateCompany = () => {
  const queryClient = useQueryClient()

  return useMutation(
    (company: Company) => CompaniesService.createCompany(company),
    {
      onSuccess: (data) => {
        message.success('企業を登録しました')
        // 企業一覧のキャッシュを無効化
        queryClient.invalidateQueries(QUERY_KEYS.companies)
      },
      onError: (error: any) => {
        message.error('企業の登録に失敗しました')
        console.error('Failed to create company:', error)
      },
    }
  )
}

// 企業更新フック
export const useUpdateCompany = () => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ id, company }: { id: number; company: Partial<Company> }) =>
      CompaniesService.updateCompany(id, company),
    {
      onSuccess: (data, variables) => {
        message.success('企業情報を更新しました')
        // 関連キャッシュを無効化
        queryClient.invalidateQueries(QUERY_KEYS.company(variables.id))
        queryClient.invalidateQueries(QUERY_KEYS.companies)
      },
      onError: (error: any) => {
        message.error('企業情報の更新に失敗しました')
        console.error('Failed to update company:', error)
      },
    }
  )
}

// 企業削除フック
export const useDeleteCompany = () => {
  const queryClient = useQueryClient()

  return useMutation(
    (id: number) => CompaniesService.deleteCompany(id),
    {
      onSuccess: () => {
        message.success('企業を削除しました')
        // 企業一覧のキャッシュを無効化
        queryClient.invalidateQueries(QUERY_KEYS.companies)
      },
      onError: (error: any) => {
        message.error('企業の削除に失敗しました')
        console.error('Failed to delete company:', error)
      },
    }
  )
}

// 重複チェックフック
export const useCheckDuplicate = () => {
  return useMutation(
    (id: number) => CompaniesService.checkDuplicate(id),
    {
      onError: (error: any) => {
        message.error('重複チェックに失敗しました')
        console.error('Failed to check duplicate:', error)
      },
    }
  )
}