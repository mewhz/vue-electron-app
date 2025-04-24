<template>
  <div class="toolbar">
    <el-button type="primary" :icon="Refresh" @click="handleRefresh" :loading="isDownloading">
      刷新数据
    </el-button>
    <el-button type="primary" :icon="Switch" @click="handleSwitch">
      {{ switchButtonText }}
    </el-button>
    <el-button type="success" :icon="Download" @click="handleExportJson" :loading="isExporting">
      导出 JSON
    </el-button>
    <el-button type="warning" :icon="Plus" @click="handleAdd">
      添加番剧
    </el-button>
    <el-button type="info" :icon="Sort" @click="handleSortByTime">
      按时间排序
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
import { Refresh, Switch, Download, Plus, Sort } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const isDownloading = ref(false)
const downloadProgress = ref(0)
const isExporting = ref(false)

// 定义 emit，以便通知父组件触发添加和排序操作
const emit = defineEmits(['add', 'sort-by-time'])

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

// 新增：导出 JSON 文件处理函数
const handleExportJson = async () => {
  isExporting.value = true;
  try {
    const result = await window.electronAPI.exportBangumiJson();
    if (result.success) {
      ElMessage.success('导出 JSON 文件成功');
    } else if (result.cancelled) {
      ElMessage.info('导出操作已取消');
    } else {
      ElMessage.error(`导出 JSON 文件失败: ${result.error || '未知错误'}`);
    }
  } catch (error: any) {
    console.error('导出 JSON 时出错:', error);
    ElMessage.error(`导出 JSON 时出错: ${error.message}`);
  } finally {
    isExporting.value = false;
  }
};

// 新增：添加按钮处理函数
const handleAdd = () => {
  console.log('添加番剧按钮被点击');
  // 通知父组件触发添加操作
  emit('add');
  // 具体的添加逻辑（如打开对话框）应该由父组件监听 @add 事件并处理
};

// 按时间排序
const handleSortByTime = () => {
  emit('sort-by-time')
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
  flex-wrap: wrap;
}

.download-progress {
  flex: 1;
  max-width: 200px;
  margin-left: auto;
}
</style> 