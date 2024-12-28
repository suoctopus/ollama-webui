<template>
  <div class="chat-input-container" :class="{ 'sidebar-hidden': !showSidebar }">
    <div class="chat-input-card">
      <div class="toolbar">
        <div class="toolbar-left">
          <el-button
            text
            :class="{ active: showSettings }"
            @click="$emit('toggle-settings')">
            <el-icon><Setting /></el-icon>
            <span>设置</span>
          </el-button>
          <el-upload
            ref="uploadRef"
            :show-file-list="false"
            :auto-upload="false"
            accept="image/*"
            @change="handleImageUpload">
            <el-button text>
              <el-icon><Picture /></el-icon>
              <span>图片</span>
            </el-button>
          </el-upload>
        </div>
      </div>
      
      <div class="input-area">
        <el-input
          v-model="inputMessage"
          type="textarea"
          :rows="3"
          :maxlength="2000"
          show-word-limit
          :disabled="isGenerating"
          placeholder="输入消息，Shift + Enter 换行，Enter 发送"
          resize="none"
          @keyup.enter.exact.prevent="handleSend"
          @keyup.enter.shift.prevent="inputMessage += '\n'"
          @input="updateMessage" />
          
        <div class="input-actions">
          <el-button
            v-if="isGenerating"
            type="danger"
            @click="$emit('stop-generation')">
            停止生成
          </el-button>
          <el-button
            type="primary"
            :loading="isGenerating"
            :disabled="!inputMessage.trim() && !images.length"
            @click="handleSend">
            发送
          </el-button>
        </div>
      </div>

      <div v-if="images.length" class="image-previews">
        <div
          v-for="(img, index) in images"
          :key="index"
          class="image-preview">
          <el-image
            :src="img"
            fit="cover"
            class="preview-image" />
          <el-button
            class="remove-image"
            circle
            text
            @click="handleRemoveImage(index)">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Setting, Picture, Close } from '@element-plus/icons-vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  images: {
    type: Array,
    required: true
  },
  isGenerating: {
    type: Boolean,
    required: true
  },
  showSettings: {
    type: Boolean,
    required: true
  },
  showSidebar: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits([
  'update:message',
  'update:images',
  'send',
  'stop-generation',
  'toggle-settings',
  'upload-image',
  'remove-image'
])

const inputMessage = ref(props.message)

// 监听外部消息变化
watch(() => props.message, (newVal) => {
  inputMessage.value = newVal
})

// 更新消息
const updateMessage = () => {
  emit('update:message', inputMessage.value)
}

// 处理发送消息
const handleSend = () => {
  if (!inputMessage.value.trim() && !props.images.length) return
  emit('send')
}

// 处理图片上传
const handleImageUpload = (file) => {
  emit('upload-image', file)
}

// 处理移除图片
const handleRemoveImage = (index) => {
  emit('remove-image', index)
}
</script>

<style scoped>
.chat-input-container {
  position: fixed;
  bottom: 20px;
  left: 320px;
  right: 20px;
  z-index: 10;
  transition: all 0.3s ease;
}

.chat-input-container.sidebar-hidden {
  left: 20px;
}

.chat-input-card {
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid var(--el-border-color-lighter);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.toolbar {
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-left .el-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-left .el-button.active {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.input-area {
  padding: 16px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}

.image-previews {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 16px;
}

.image-preview {
  position: relative;
  width: 80px;
  height: 80px;
}

.preview-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  padding: 2px;
}

.remove-image .el-icon {
  font-size: 16px;
}

:deep(.el-textarea__inner) {
  resize: none;
  min-height: 80px !important;
}

@media (max-width: 768px) {
  .chat-input-container {
    left: 10px;
    right: 10px;
    bottom: 10px;
  }
  
  .chat-input-container.sidebar-hidden {
    left: 10px;
  }
  
  .input-area {
    padding: 12px;
  }
  
  .toolbar {
    padding: 8px 12px;
  }
  
  .image-previews {
    padding: 0 12px 12px;
  }
}

/* 当侧边栏隐藏时，输入框占据全宽 */
:deep(.main-expanded) .chat-input-container {
  left: 0;
}
</style> 