export interface BangumiItem {
  name: string
  nameCN: string
  summary: string
  cover: string
  url: string
  labels: {
    label: string
    value: string
  }[]
}

export interface ApiResponse<T = any> {
  success: boolean
  error?: string
  data?: T
}

declare global {
  interface Window {
    electronAPI: {
      getBangumi: () => Promise<ApiResponse<BangumiItem[]>>,
      downloadBangumiData: () => Promise<ApiResponse>
    }
  }
}