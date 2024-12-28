<template>
  <div class="chat-container" ref="messagesContainer">
    <div class="chat-messages">
      <template v-if="isEmpty">
        <div class="empty-state">
          <el-empty description="开始一段新的对话吧" />
        </div>
      </template>
      <template v-else>
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="['message', message.role]">
          <div class="message-content" v-html="formatMessage(message.content)" />
          <div v-if="message.images?.length" class="message-images">
            <el-image
              v-for="(img, imgIndex) in message.images"
              :key="imgIndex"
              :src="img"
              :preview-src-list="message.images"
              fit="contain"
              class="message-image" />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'

const props = defineProps({
  messages: {
    type: Array,
    required: true
  },
  isEmpty: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['scroll-to-bottom'])

const messagesContainer = ref(null)

defineExpose({
  messagesContainer
});
// 监听消息变化，自动滚动到底部
watch(() => props.messages, () => {
  emit('scroll-to-bottom')
}, { deep: true })

// 格式化消息内容
const formatMessage = (content) => {
  return marked(content)
}

// 配置代码高亮
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  }
})
</script>

<style scoped>
.chat-container {
  flex: 1;
  flex-direction: column;
  overflow-y: auto;
  padding: 20px 20px 20px 0;
  margin: 0 auto;
  width: 100%;
  height: calc(100vh - 180px);
  margin-bottom: 300px;

}

/* 自定义滚动条 */
.chat-container::-webkit-scrollbar {
    width: 8px; /* 滚动条的宽度 */
    transition: opacity 0.3s; /* 添加过渡效果 */
}


.chat-container::-webkit-scrollbar-track {
    background: #f1f1f1; /* 滚动条轨道的背景 */
}

.chat-container::-webkit-scrollbar-thumb {
    background: rgba(136, 136, 136, 0.5); /* 调淡的滚动条颜色 */
    border-radius: 6px; /* 滚动条的圆角 */
}

.chat-container::-webkit-scrollbar-thumb:hover {
    background: rgba(136, 136, 136, 0.8); /* 鼠标悬停时的滚动条颜色 */
}

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-left: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.message {
  max-width: 85%;
  display: flex;
  flex-direction: column;
  animation: message-fade-in 0.3s ease;
}

@keyframes message-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  margin-left: auto;
  align-items: flex-end;
}

.message.user .message-content {
  background-color: var(--el-color-primary-light-9);
  border-radius: 16px 16px 0 16px;
}

.message.assistant {
  margin-right: auto;
  position: relative;
  padding-left: 48px;
}

.message.assistant::before {
  content: '';
  position: absolute;
  left: 0;
  top: 4px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--el-color-primary-light-5);
  background-image: url('@/assets/ai-avatar.svg');
  background-size: 36px;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message.assistant .message-content {
  background-color: var(--el-bg-color);
  border-radius: 16px 16px 16px 0;
}

.message-content {
  padding: 16px 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  width: fit-content;
  max-width: 100%;
  word-break: break-word;
}

.message-content :deep(p) {
  margin: 0 0 0.8em;
  line-height: 1.8;
  letter-spacing: 0.02em;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-content :deep(p:last-child) {
  margin-bottom: 0;
}

.message-content :deep(ol) {
  margin: 0.8em 0;
  padding-left: 1.2em;
  list-style-position: inside;
}

.message-content :deep(ol li) {
  margin-bottom: 0.5em;
  padding-left: 0.5em;
}

.message-content :deep(ol li:last-child) {
  margin-bottom: 0;
}

.message-content :deep(pre) {
  margin: 12px 0;
  padding: 16px;
  background-color: var(--el-fill-color-light);
  border-radius: 8px;
  overflow-x: auto;
  max-width: calc(100vw - 400px);
  line-height: 1.6;
}

.message-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.message-content :deep(code) {
  background-color: var(--el-fill-color-light);
  padding: 2px 4px;
  border-radius: 4px;
  font-family: Monaco, Consolas, 'Courier New', monospace;
}

.message-images {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.message-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
}

@media (max-width: 768px) {
  .chat-container {
    padding: 10px 10px 10px 0;
    height: calc(100vh - 200px);
    margin-bottom: 180px;
  }

  .chat-messages {
    padding-left: 10px;
  }

  .message {
    max-width: 95%;
  }

  .message-content :deep(pre) {
    max-width: calc(100vw - 40px);
  }

  .message-image {
    max-width: 150px;
    max-height: 150px;
  }
}
</style> 