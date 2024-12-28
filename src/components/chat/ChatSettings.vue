<template>
  <el-dialog
    v-model="dialogVisible"
    title="聊天设置"
    width="800px"
    :close-on-click-modal="false"
    @update:modelValue="updateVisible">
    <div class="settings-content">
      <el-form label-position="top">
        <div class="settings-grid">
          <!-- 左侧设置 -->
          <div class="settings-column">
            <el-form-item label="系统提示词">
              <el-input
                v-model="localSettings.systemPrompt"
                type="textarea"
                :rows="3"
                placeholder="设置AI助手的角色和行为..." />
              <div class="setting-tip">
                这是每次对话开始时发送给模型的指令，用于定义模型的身份、行为方式和专业领域等。
                例如："你是一位经验丰富的程序员"。
              </div>
            </el-form-item>
            
            <el-form-item label="Temperature (温度)">
              <el-slider
                v-model="localSettings.temperature"
                :min="0"
                :max="1"
                :step="0.1" />
              <div class="setting-tip">
                控制回答的创造性。较高的值会产生更有创意但可能不太准确的回答��
                较低的值会产生更保守、更确定的回答。建议范围：0.1-0.9
              </div>
            </el-form-item>
            
            <el-form-item label="Top P (概率截断)">
              <el-slider
                v-model="localSettings.topP"
                :min="0"
                :max="1"
                :step="0.1" />
              <div class="setting-tip">
                控制回答的多样性。较高的值会产生更多样的回答，
                较低的值会使回答更加集中和确定。建议范围：0.1-0.9
              </div>
            </el-form-item>
          </div>
          
          <!-- 右侧设置 -->
          <div class="settings-column">
            <el-form-item label="Top K (保留词数)">
              <el-input-number
                v-model="localSettings.topK"
                :min="1"
                :max="100" />
              <div class="setting-tip">
                每次选词时考虑的候选词数量。较大的值会增加回答的多样性，
                较小的值会使回答更加确定建议范围：20-100
              </div>
            </el-form-item>
            
            <el-form-item label="最大生成长度">
              <el-input-number
                v-model="localSettings.maxTokens"
                :min="1"
                :max="30720" />
              <div class="setting-tip">
                单次回答的最大长度（token数）。建议范围：1024-4096，最大可设置为30720。
                较大的值允许更长的回答，但会增加生成时间。
              </div>
            </el-form-item>
            
            <el-form-item label="重复惩罚">
              <el-slider
                v-model="localSettings.repeatPenalty"
                :min="1"
                :max="2"
                :step="0.1" />
              <div class="setting-tip">
                防止文本重复的程度。较高的值会减少重复，但可能影响文本的连贯性。
                建议范围：1.0-1.3
              </div>
            </el-form-item>

            <el-form-item label="JSON 模式">
              <el-switch
                v-model="localSettings.jsonMode"
                active-text="启用"
                inactive-text="禁用" />
              <div class="setting-tip">
                启用后，模型将生成格式化的 JSON 输出。适用于需要结构化数据的场景，
                如 API 调用或数据处理。
              </div>
            </el-form-item>
          </div>
        </div>
      </el-form>
      
      <!-- 底部按钮 -->
      <div class="settings-footer">
        <el-button @click="handleReset">恢复默认</el-button>
        <el-button type="primary" @click="handleSave">保存设置</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  settings: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'update:settings', 'reset', 'save'])

const dialogVisible = ref(props.visible)
const localSettings = ref({ ...props.settings })

// 监听外部visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

// 监听外部settings变化
watch(() => props.settings, (newVal) => {
  localSettings.value = { ...newVal }
}, { deep: true })

// 更新visible
const updateVisible = (val) => {
  emit('update:visible', val)
}

// 处理重置
const handleReset = () => {
  emit('reset')
}

// 处理保存
const handleSave = () => {
  emit('update:settings', { ...localSettings.value })
  emit('save')
  emit('update:visible', false)
}
</script>

<style scoped>
.settings-content {
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  padding: 20px;
}

.settings-column .el-form-item {
  margin-bottom: 24px;
}

.settings-column .el-form-item:last-child {
  margin-bottom: 0;
}

.settings-column .el-slider {
  width: 100%;
}

.settings-column .el-input-number {
  width: 100%;
}

.setting-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  line-height: 1.5;
}

.settings-footer {
  margin-top: 0;
  padding: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: var(--el-bg-color-page);
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }
  
  .settings-column .el-form-item {
    margin-bottom: 16px;
  }
  
  .settings-footer {
    padding: 16px;
  }
}
</style> 