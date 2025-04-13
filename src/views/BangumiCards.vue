<template>
  <div class="bangumi-container">
    <BangumiToolbar />
    <el-row :gutter="16">
      <el-col 
        v-for="item in bangumiList" 
        :key="item.name" 
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
    />
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
const currentBangumi = ref<BangumiItem>()

// 初始化加载数据
const loadBangumiData = async () => {
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
  loadBangumiData()
})

const handleEdit = (bangumi: BangumiItem) => {
  currentBangumi.value = bangumi
  dialogVisible.value = true
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

</style>