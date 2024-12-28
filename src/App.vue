<template>
  <el-config-provider>
    <div class="app">
      <nav-header />
      <div class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
      <!-- 全局错误提示容器 -->
      <div class="global-message-container">
        <el-alert
          v-for="(message, index) in messages"
          :key="index"
          :title="message.title"
          :type="message.type"
          :description="message.description"
          show-icon
          :closable="true"
          @close="removeMessage(index)"
          class="message-item" />
      </div>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, provide } from 'vue'
import { ElConfigProvider } from 'element-plus'
import NavHeader from './components/NavHeader.vue'

const messages = ref([])

// 添加消息
const addMessage = (message) => {
  messages.value.push({
    ...message,
    timestamp: Date.now()
  })
  
  // 3秒后自动移除
  setTimeout(() => {
    const index = messages.value.findIndex(m => m.timestamp === message.timestamp)
    if (index !== -1) {
      messages.value.splice(index, 1)
    }
  }, 3000)
}

// 移除消息
const removeMessage = (index) => {
  messages.value.splice(index, 1)
}

// 提供全局消息方法
provide('addMessage', addMessage)
</script>

<style lang="scss">
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
}

#app {
  height: 100%;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow: hidden;
  height: calc(100vh - 60px); // 减去导航栏高度
}

.global-message-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  width: 400px;
  pointer-events: none;
  
  .message-item {
    margin-bottom: 10px;
    pointer-events: auto;
  }
}

// 路由过渡动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 