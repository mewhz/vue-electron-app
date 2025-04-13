<template>
  <div class="toolbar">
    <el-button type="primary" :icon="Refresh" @click="handleRefresh">
      刷新数据
    </el-button>
    <el-button type="primary" :icon="Switch" @click="handleSwitch">
      {{ switchButtonText }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Refresh, Switch } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 计算当前路径对应的切换按钮文本和目标路径
const { switchButtonText, targetPath } = computed(() => {
  const isTable = route.path.includes('/table')
  return {
    switchButtonText: isTable ? '切换到卡片视图' : '切换到表格视图',
    targetPath: isTable ? '/bangumi/card' : '/bangumi/table'
  }
}).value

// 刷新数据
const handleRefresh = () => {
  // window.electronAPI.getBangumi()
  window.electronAPI.downloadBangumiData();
}

// 切换视图
const handleSwitch = () => {
  router.push(targetPath)
}
</script>

<style scoped>
.toolbar {
  margin-bottom: 20px;
}
</style> 