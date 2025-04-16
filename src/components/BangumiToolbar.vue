<template>
  <div class="toolbar">
    <el-button type="primary" :icon="Refresh" @click="handleRefresh" :loading="isDownloading">
      刷新数据
    </el-button>
    <el-button type="primary" :icon="Switch" @click="handleSwitch">
      {{ switchButtonText }}
    </el-button>
    <el-progress 
      v-if="isDownloading"
      :percentage="downloadProgress"
      :format="format"
      class="download-progress"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Refresh, Switch } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const isDownloading = ref(false)
const downloadProgress = ref(0)

// 计算当前路径对应的切换按钮文本和目标路径
const { switchButtonText, targetPath } = computed(() => {
  const isTable = route.path.includes('/table')
  return {
    switchButtonText: isTable ? '切换到卡片视图' : '切换到表格视图',
    targetPath: isTable ? '/bangumi/card' : '/bangumi/table'
  }
}).value

// 进度条格式化
const format = (percentage: number) => `${percentage}%`

// 刷新数据
const handleRefresh = async () => {
  try {
    isDownloading.value = true
    downloadProgress.value = 0
    
    // 设置进度监听
    window.electronAPI.onDownloadProgress((progress) => {
      downloadProgress.value = progress
    })
    
    const result = await window.electronAPI.downloadBangumiData();

    if (result.success) {
      ElMessage({
        message: '更新成功, 稍后自动刷新',
        type: 'success',
        duration: 2000
      })

      setTimeout(() => {
        location.reload();
      }, 2000);
    } else {
      ElMessage.error('更新数据出错：' + result.error)
    }
  } catch (error) {
    ElMessage.error('下载出错')
    console.error('Download error:', error)
  } finally {
    isDownloading.value = false
    // 移除进度监听
    window.electronAPI.removeDownloadProgress()
  }
}

// 切换视图
const handleSwitch = () => {
  router.push(targetPath)
}

// 组件卸载时清理监听器
onUnmounted(() => {
  window.electronAPI.removeDownloadProgress()
})
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.download-progress {
  flex: 1;
  max-width: 200px;
}
</style> 