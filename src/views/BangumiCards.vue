<template>
  <div class="bangumi-container">
    <BangumiToolbar @add="handleAdd" @sort-by-time="handleSortByTime" />
    <el-row :gutter="16">
      <el-col 
        v-for="item in bangumiList" 
        :key="item.id" 
        :xs="24" 
        :sm="12" 
        :md="8" 
        :lg="6"
        class="bangumi-item"
      >
        <BangumiCard 
          :bangumi="item"
          @edit="handleEdit"
        />
      </el-col>
    </el-row>

    <BangumiEditDialog
      v-model="dialogVisible"
      :bangumi="currentBangumi"
      @save-success="handleSaveSuccess"
    />
    
    <!-- 添加返回顶部按钮 -->
    <el-backtop :right="30" :bottom="30" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import BangumiToolbar from '@/components/BangumiToolbar.vue'
import BangumiCard from '@/components/BangumiCard.vue'
import BangumiEditDialog from '@/components/BangumiEditDialog.vue'
import type { BangumiItem } from '@/api/types'

const bangumiList = ref<BangumiItem[]>([])
const dialogVisible = ref(false)
const currentBangumi = ref<BangumiItem | null>(null)

// 初始化加载数据
const fetchBangumiData = async () => {
  try {
    const result = await window.electronAPI.getBangumi()
    if (result.success && result.data) {
      bangumiList.value = result.data
    } else {
      console.log(`output->result`,result)
      ElMessage.error(`加载失败: ${result.error || '未知错误'}`)
    }
  } catch (error) {
    console.error('Load failed:', error)
    ElMessage.error('加载失败')
  }
}

onMounted(() => {
  fetchBangumiData()
})

const handleEdit = (bangumi: BangumiItem) => {
  currentBangumi.value = bangumi
  dialogVisible.value = true
}

const handleAdd = () => {
  currentBangumi.value = null
  dialogVisible.value = true
}

const handleSaveSuccess = () => {
  dialogVisible.value = false
  fetchBangumiData()
}

// 新增：按时间排序处理函数
const handleSortByTime = async () => {
  // 1. 前端排序逻辑 (与 Table 视图相同)
  bangumiList.value.sort((a, b) => {
    const timeLabelA = a.labels.find(l => l.label === '时间')?.value
    const timeLabelB = b.labels.find(l => l.label === '时间')?.value

    const parseDate = (dateStr: string | undefined): number => {
      if (!dateStr) return 0
      let match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (match) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3])).getTime()
      }
      match = dateStr.match(/^(\d{4})-(\d{2})$/)
      if (match) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1).getTime()
      }
      const timestamp = Date.parse(dateStr)
      if (!isNaN(timestamp)) {
        return timestamp
      }
      return 0
    }

    const timeA = parseDate(timeLabelA)
    const timeB = parseDate(timeLabelB)

    if (timeA === 0 && timeB === 0) {
      return (a.id ?? 0) - (b.id ?? 0);
    }
    if (timeA === 0) return 1
    if (timeB === 0) return -1
    return timeB - timeA // 降序
  });

  // 2. 提取排序后的 ID 列表
  const sortedIds = bangumiList.value
    .map(item => item.id)
    .filter((id): id is number => id !== undefined && id !== null);

  if (sortedIds.length !== bangumiList.value.length) {
    console.warn('部分番剧缺少 ID，无法为所有项更新排序顺序。');
  }

  // 3. 调用后端 API 更新排序
  try {
    console.log('尝试更新数据库中的排序顺序...', sortedIds);
    const result = await window.electronAPI.updateBangumiOrder(sortedIds);
    if (result.success) {
      ElMessage.success('已按时间排序并更新数据库顺序');
    } else {
      console.error('更新数据库排序失败:', result.error);
      ElMessage.error(`更新数据库排序失败: ${result.error || '未知错误'}`);
    }
  } catch (error: any) {
    console.error('调用 updateBangumiOrder 时出错:', error);
    ElMessage.error(`调用排序 API 时出错: ${error.message}`);
  }
}
</script>

<style scoped>
.bangumi-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 20px;
  box-sizing: border-box;
  overflow-x: hidden;
}

.bangumi-item {
  margin-bottom: 20px;
}

@media (min-width: 1600px) {
  .el-col {
    flex: 0 0 20%;
    max-width: 20%;
  }
}

/* 移除 el-row 的负边距 */
:deep(.el-row) {
  /* margin-left: 0 !important; */
  /* margin-right: 0 !important; */
}

/* 可选：自定义返回顶部按钮样式 */
:deep(.el-backtop) {
  /* 可以根据需要调整大小、颜色等 */
  --el-backtop-bg-color: #409EFF;
  --el-backtop-text-color: white;
  --el-backtop-hover-bg-color: #337ecc;
}
</style>