<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEditMode ? '编辑番剧信息' : '添加新番剧'"
    width="50%"
    :before-close="handleClose"
    @open="onDialogOpen"
  >
    <el-scrollbar height="60vh">
      <el-form :model="form" label-width="80px" ref="formRef">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name"/>
        </el-form-item>
        <el-form-item label="中文名">
          <el-input v-model="form.nameCN" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.summary" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="封面">
          <el-input v-model="form.cover" />
        </el-form-item>
        <el-form-item label="详情页">
          <el-input v-model="form.url" />
        </el-form-item>
        <el-form-item label="标签" class="labels-form-item">
          <div class="labels-container">
            <div v-for="(label, index) in form.labels" :key="index" class="label-item">
              <el-input v-model="label.label" placeholder="标签名" class="label-input label-name-input" />
              <el-input v-model="label.value" placeholder="标签值" class="label-input label-value-input" />
              <el-button type="danger" @click="removeLabel(index)" :icon="Delete" circle />
            </div>
            <el-button type="primary" @click="addLabel" class="add-label-button">添加标签</el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-scrollbar>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="isSaving">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import type { BangumiItem } from '@/api/types'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  bangumi?: BangumiItem | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save-success', bangumi: BangumiItem): void
}>()

const dialogVisible = ref(props.modelValue)
const formRef = ref<FormInstance>()
const isSaving = ref(false)

const isEditMode = computed(() => !!(props.bangumi && props.bangumi.name))

const form = ref<BangumiItem>({
  name: '',
  nameCN: '',
  summary: '',
  cover: '',
  url: '',
  labels: []
})

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const onDialogOpen = () => {
  if (props.bangumi && props.bangumi.name) {
    console.log('对话框打开：编辑模式', props.bangumi)
    form.value = JSON.parse(JSON.stringify(props.bangumi))
  } else {
    console.log('对话框打开：添加模式')
    form.value = {
      name: '',
      nameCN: '',
      summary: '',
      cover: '',
      url: '',
      labels: []
    }
    formRef.value?.clearValidate()
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleSave = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch (error) {
    console.log('表单校验失败', error)
    ElMessage.warning('请检查表单输入项')
    return
  }

  isSaving.value = true
  try {
    let result
    const formData = JSON.parse(JSON.stringify(form.value))

    if (isEditMode.value) {
      console.log('执行更新操作...', formData)
      result = await window.electronAPI.saveBangumi(formData)
    } else {
      console.log('执行添加操作...', formData)
      result = await window.electronAPI.addBangumi(formData)
      if (result.success && result.lastID) {
        formData.id = result.lastID
      }
    }

    if (result.success) {
      ElMessage.success(isEditMode.value ? '更新成功' : '添加成功')
      emit('save-success', formData)
      handleClose()
    } else {
      ElMessage.error(`${isEditMode.value ? '更新' : '添加'}失败: ${result.error || '未知错误'}`)
    }
  } catch (error: any) {
    console.error('保存操作失败:', error)
    ElMessage.error(`${isEditMode.value ? '更新' : '添加'}时出错: ${error.message}`)
  } finally {
    isSaving.value = false
  }
}

const addLabel = () => {
  if (!form.value.labels) {
    form.value.labels = []
  }
  form.value.labels.push({ label: '', value: '' })
}

const removeLabel = (index: number) => {
  if (form.value.labels) {
    form.value.labels.splice(index, 1)
  }
}
</script>

<style scoped>
.labels-form-item :deep(.el-form-item__content) {
  display: block;
}

.labels-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.label-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
}

.label-input {
  flex: 1;
  min-width: 140px;
}

.add-label-button {
  margin-bottom: 5px;
}

:deep(.el-dialog__body) {
  max-height: calc(100vh - 200px);
}
</style> 