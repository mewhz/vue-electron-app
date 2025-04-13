<template>
  <el-dialog
    v-model="dialogVisible"
    title="编辑番剧信息"
    width="50%"
    :before-close="handleClose"
  >
    <el-scrollbar height="60vh">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.summary" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="封面">
          <el-input v-model="form.cover" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="form.url" />
        </el-form-item>
        <el-form-item label="标签" class="labels-container">
          <div v-for="(label, index) in form.labels" :key="index" class="label-item">
            <el-input v-model="label.label" placeholder="标签名" class="label-input" />
            <el-input v-model="label.value" placeholder="标签值" class="label-input" />
            <el-button type="danger" @click="removeLabel(index)">删除</el-button>
          </div>
          <el-button type="primary" @click="addLabel">添加标签</el-button>
        </el-form-item>
      </el-form>
    </el-scrollbar>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BangumiItem } from '@/api/types'

const props = defineProps<{
  modelValue: boolean
  bangumi?: BangumiItem
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', bangumi: BangumiItem): void
}>()

const dialogVisible = ref(props.modelValue)
const form = ref<BangumiItem>({
  name: '',
  summary: '',
  cover: '',
  url: '',
  labels: []
})

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(() => props.bangumi, (val) => {
  if (val) {
    form.value = JSON.parse(JSON.stringify(val))
  }
}, { immediate: true })

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const handleClose = () => {
  dialogVisible.value = false
}

const handleSave = () => {
  emit('save', form.value)
  handleClose()
}

const addLabel = () => {
  form.value.labels.push({ label: '', value: '' })
}

const removeLabel = (index: number) => {
  form.value.labels.splice(index, 1)
}
</script>

<style scoped>
.label-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.label-input {
  width: calc(50% - 50px);
  min-width: 120px;
}

.labels-container {
  max-height: 300px;
  overflow-y: auto;
}

:deep(.el-dialog__body) {
  max-height: calc(100vh - 200px);
}
</style> 