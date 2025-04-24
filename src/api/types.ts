export interface BangumiItem {
  name: string
  nameCN?: string
  summary: string
  cover: string
  url: string
  labels: {
    label: string
    value: string
  }[]
  id?: number
}

export interface ApiResponse<T = any> {
  success: boolean
  error?: string
  data?: T
  cancelled?: boolean
  lastID?: number
}

declare global {
  interface Window {
    electronAPI: {
      getBangumi: () => Promise<ApiResponse<BangumiItem[]>>,
      downloadBangumiData: () => Promise<ApiResponse>,
      saveBangumi: (data: BangumiItem) => Promise<ApiResponse>,
      addBangumi: (data: BangumiItem) => Promise<ApiResponse>,
      updateBangumiOrder: (sortedIds: number[]) => Promise<ApiResponse>,
      onDownloadProgress: (callback: (progress: number) => void) => void,
      removeDownloadProgress: () => void,
      exportBangumiJson: () => Promise<ApiResponse>,
      getConfigFilePath: () => Promise<ApiResponse<{ path: string }>>
    }
  }
}