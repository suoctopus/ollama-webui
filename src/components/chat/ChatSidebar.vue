<template>
  <div :class="['chat-sidebar', { 'sidebar-hidden': !showSidebar }]">
    <div class="sidebar-header">
      <h3>对话列表</h3>
      <el-button type="primary" @click="$emit('create-chat')">新建对话</el-button>
    </div>
    
    <div class="chat-list">
      <div
        v-for="chat in chats"
        :key="chat.id"
        :class="['chat-item', { active: currentChatId === chat.id }]"
        @click="$emit('switch-chat', chat.id)">
        <div class="chat-info">
          <div class="chat-name" v-if="!chat.isEditing">{{ chat.name }}</div>
          <el-input
            v-else
            v-model="chat.newName"
            @blur="$emit('finish-rename', chat)"
            @keyup.enter="$emit('finish-rename', chat)"
            ref="renameInput"
            size="small"
          />
          <div class="chat-time">{{ formatTime(chat.updateTime) }}</div>
        </div>
        <div class="chat-actions">
          <el-tooltip 
            content="重命名" 
            placement="top"
            :show-after="500"
            :hide-after="200">
            <el-button
              class="action-btn"
              circle
              text
              @click.stop="$emit('start-rename', chat)">
              <el-icon><Edit /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip 
            content="删除" 
            placement="top"
            :show-after="500"
            :hide-after="200">
            <el-button
              class="action-btn"
              circle
              text
              @click.stop="$emit('delete-chat', chat.id)">
              <el-icon><Delete /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
    </div>
    
    <div class="sidebar-footer">
      <el-button 
        type="primary" 
        text 
        class="manage-btn" 
        @click="$emit('show-manage')">
        <el-icon><Management /></el-icon>
        管理对话记录
      </el-button>
    </div>

    <div class="sidebar-toggle" @click="$emit('toggle-sidebar')">
      <el-icon><ArrowLeft :class="{ 'rotated': !showSidebar }" /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { Edit, Delete, ArrowLeft, Management } from '@element-plus/icons-vue'

defineProps({
  chats: {
    type: Array,
    required: true
  },
  currentChatId: {
    type: String,
    default: null
  },
  showSidebar: {
    type: Boolean,
    default: true
  }
})

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}
</script>

<style scoped>
.chat-sidebar {
  position: fixed;
  left: 0;
  top: 60px;
  bottom: 0;
  width: 300px;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  z-index: 100;
}

.sidebar-hidden {
  transform: translateX(-300px);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.chat-item:hover {
  background-color: var(--el-fill-color-light);
}

.chat-item.active {
  background-color: var(--el-color-primary-light-9);
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-name {
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.chat-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s;
}

.chat-item:hover .chat-actions {
  opacity: 1;
}

.sidebar-footer {
  padding: 10px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.manage-btn {
  width: 100%;
  justify-content: center;
}

.manage-btn .el-icon {
  margin-right: 4px;
}

.sidebar-toggle {
  position: absolute;
  right: -24px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 60px;
  background: var(--el-color-primary);
  border: 1px solid var(--el-border-color);
  border-left: none;
  border-radius: 0 4px 4px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: background-color 0.3s;
}

.sidebar-toggle:hover {
  background-color: var(--el-color-primary-light-3);
}

.sidebar-toggle .el-icon {
  transition: transform 0.3s;
}

.sidebar-toggle .rotated {
  transform: rotate(180deg);
}

@media (max-width: 768px) {
  .chat-sidebar {
    width: 100%;
    max-width: 300px;
  }
}
</style> 