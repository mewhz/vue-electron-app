<template>
  <el-card 
    class="bangumi-card" 
    :body-style="{ padding: '0px' }"
    @click="handleEdit"
  >
    <el-image 
      :src="bangumi.cover" 
      :alt="bangumi.name"
      class="bangumi-image"
      fit="cover"
      loading="lazy"
      referrerpolicy="no-referrer"
    >
      <template #error>
        <div class="image-error">
          <el-icon><Picture /></el-icon>
        </div>
      </template>
    </el-image>
    
    <div class="bangumi-content">
      <el-tooltip
        :content="bangumi.name"
        placement="top"
        :show-after="500"
      >
        <h3 class="title">{{ bangumi.name }}</h3>
      </el-tooltip>
      <el-tooltip
        :content="bangumi.nameCN || bangumi.name"
        placement="top"
        :show-after="500"
      >
        <h3 class="title">{{ bangumi.nameCN || bangumi.name }}</h3>
      </el-tooltip>
      <el-tooltip 
        :content="bangumi.summary" 
        placement="bottom" 
        :show-after="500"
      >
        <p class="summary">{{ bangumi.summary }}</p>
      </el-tooltip>
      
      <div class="labels">
        <el-tag 
          v-for="label in bangumi.labels" 
          :key="label.label"
          size="small"
          class="label"
        >
          <span v-if="label.value">
            {{ label.label }}: {{ label.value }}
          </span>
          <span v-else>
            {{ label.label }}
          </span>
        </el-tag>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { Picture } from '@element-plus/icons-vue'
import type { BangumiItem } from '@/api/types'

const props = defineProps<{
  bangumi: BangumiItem
}>()

const emit = defineEmits<{
  (e: 'edit', bangumi: BangumiItem): void
}>()

const handleEdit = () => {
  emit('edit', props.bangumi)
}
</script>

<style scoped>
.bangumi-card {
  cursor: pointer;
  height: 100%;
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.bangumi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.bangumi-image {
  width: 100%;
  height: 0;
  padding-bottom: 140%; /* 调整为 10:14 的宽高比，更适合海报 */
  position: relative;
  background-color: #f5f7fa;
}

.bangumi-image :deep(img) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.image-error {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #909399;
}

.bangumi-content {
  padding: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.title {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.summary {
  font-size: 13px;
  color: #606266;
  margin: 8px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.labels {
  display: flex;
  gap: 6px;
}

.actions {
  margin-top: 12px;
  text-align: right;
}
</style> 