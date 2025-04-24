<template>
    <div class="bangumi-container">
        <BangumiToolbar @sort-by-time="handleSortByTime" />
        <el-table :data="bangumiList" style="width: 100%" stripe border>
            <!-- 中文标题列 -->
            <el-table-column label="中文标题" min-width="150">
                <template #default="{ row }">
                    <span class="name-cn">{{ row.nameCN || row.name }}</span>
                </template>
            </el-table-column>

            <!-- 日文标题列 -->
            <el-table-column label="原标题" min-width="150">
                <template #default="{ row }">
                    <el-popover placement="right" trigger="hover" popper-class="cover-popover">
                        <template #reference>
                            <span class="name">{{ row.name }}</span>
                        </template>
                        <el-image :src="row.cover" fit="cover" style="width: 300px; height: 450px" />
                    </el-popover>
                </template>
            </el-table-column>

            <!-- 简介列 -->
            <el-table-column label="简介" min-width="300" show-overflow-tooltip>
                <template #default="{ row }">
                    <span class="summary">{{ row.summary }}</span>
                </template>
            </el-table-column>

            <!-- 集数列 -->
            <el-table-column label="集数" width="80" align="center">
                <template #default="{ row }">
                    <span class="episode">
                        {{row.labels.find((l: any) => l.label.includes('话'))?.label || '-'}}
                    </span>
                </template>
            </el-table-column>

            <!-- 评分列 -->
            <el-table-column label="评分" width="80" align="center">
                <template #default="{ row }">
                    <span class="rating">
                        {{row.labels.find((l: any) => l.label === '评分')?.value || '-'}}
                    </span>
                </template>
            </el-table-column>

            <!-- 排名列 -->
            <el-table-column label="排名" width="80" align="center">
                <template #default="{ row }">
                    <span class="rank">
                        {{row.labels.find((l: any) => l.label === '排名')?.value || '-'}}
                    </span>
                </template>
            </el-table-column>

            <!-- 放送时间列 -->
            <el-table-column label="放送时间" width="100" align="center">
                <template #default="{ row }">
                    <span class="air-date">
                        {{row.labels.find((l: any) => l.label === '时间')?.value || '-'}}
                    </span>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import BangumiToolbar from '@/components/BangumiToolbar.vue'
import type { BangumiItem } from '@/api/types'

const bangumiList = ref<BangumiItem[]>([])

// 获取番剧数据
const fetchBangumiData = async () => {
    try {
        const result = await window.electronAPI.getBangumi()
        if (result.success && result.data) {
            bangumiList.value = result.data
        } else {
            ElMessage.error('获取数据失败')
        }
    } catch (error) {
        ElMessage.error('获取数据出错：' + error)
    } finally {
    }
}

// 按时间排序处理函数
const handleSortByTime = async () => {
  // 1. 前端排序逻辑 (保持不变)
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
      // 如果都没有有效时间，则按 ID 升序排列（或其他稳定排序）
      return (a.id ?? 0) - (b.id ?? 0);
    }
    if (timeA === 0) return 1
    if (timeB === 0) return -1
    return timeB - timeA // 降序
  });

  // 2. 提取排序后的 ID 列表
  // 确保 ID 存在且为数字
  const sortedIds = bangumiList.value
    .map(item => item.id)
    .filter((id): id is number => id !== undefined && id !== null);

  if (sortedIds.length !== bangumiList.value.length) {
    console.warn('部分番剧缺少 ID，无法为所有项更新排序顺序。');
    // 可以选择仍然尝试更新包含有效 ID 的项，或者提示错误
    // 这里我们继续尝试更新
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
      // 可选：如果后端更新失败，是否回滚前端排序？
      // 目前不回滚，前端仍然显示排序后的结果
    }
  } catch (error: any) {
    console.error('调用 updateBangumiOrder 时出错:', error);
    ElMessage.error(`调用排序 API 时出错: ${error.message}`);
  }
}

onMounted(() => {
    fetchBangumiData()
})
</script>

<style>
/* 全局样式 */

.el-popper.is-light.el-popover.cover-popover {
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
}

.el-popper.is-light.el-popover.cover-popover .el-popover__arrow {
    display: none !important;
}

.el-popper.is-light.el-popover.cover-popover .el-image {
    width: 300px !important;
    height: 450px !important;
    display: block !important;
}
</style>

<style scoped>
.bangumi-container {
    padding: 20px;
}

.name {
    font-weight: bold;
    font-size: 0.9em;
    cursor: pointer;
}

.name-cn {
    color: #333;
    font-size: 0.9em;
}

.summary {
    color: #666;
    font-size: 0.9em;
    line-height: 1.4;
}

:deep(.el-dialog__body) {
    padding: 20px;
}

.episode {
    color: #409EFF;
    /* 蓝色，代表集数 */
    font-weight: 500;
}

.rating {
    color: #E6A23C;
    /* 橙色，代表评分 */
    font-weight: 500;
}

.rank {
    color: #67C23A;
    /* 绿色，代表排名 */
    font-weight: 500;
}

.air-date {
    color: #F56C6C;
    /* 红色，代表时间 */
    font-weight: 500;
}

.name-wrapper {
    position: relative;
    cursor: pointer;
    display: inline-block;
    width: 100%;
}

.cover-preview {
    position: fixed;
    z-index: 9999;
    background: white;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding: 5px;
    pointer-events: none;
    transform: translateY(20px);
    /* 将预览框向下移动一点，避免被表格行遮挡 */
}

/* 确保表格行不会遮挡预览 */
:deep(.el-table__row) {
    position: static;
}

:deep(.el-table__body-wrapper) {
    position: static;
}
</style>