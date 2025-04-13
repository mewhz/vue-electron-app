<template>
    <div class="bangumi-container">
        <BangumiToolbar />
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
import { Refresh } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import BangumiToolbar from '@/components/BangumiToolbar.vue'
import type { BangumiItem } from '@/api/types'

const router = useRouter()
const bangumiList = ref<BangumiItem[]>([])

// 切换视图
const switchView = () => {
  router.push('/bangumi/card')
}

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