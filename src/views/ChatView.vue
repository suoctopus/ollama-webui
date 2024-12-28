<template>
  <div class="chat-view">
    <!-- 对话管理侧边栏 -->
    <ChatSidebar
      :chats="filteredChats"
      :current-chat-id="currentChatId"
      :show-sidebar="showSidebar"
      @create-chat="createNewChat"
      @switch-chat="switchChat"
      @delete-chat="deleteChat"
      @toggle-sidebar="toggleSidebar"
      @start-rename="startRename"
      @finish-rename="finishRename"
      @show-manage="showManageDialog = true"
    />

    <!-- 对话管理对话框 -->
    <ChatManageDialog
      v-model:visible="showManageDialog"
      :chats="filteredManageChats"
      :selected-chats="selectedManageChats"
      @selection-change="handleSelectionChange"
      @delete="deleteChat"
      @delete-selected="deleteSelectedChats"
      @switch-chat="switchChatAndCloseDialog"
    />

    <!-- 聊天主界面 -->
    <div :class="['chat-main', { 'main-expanded': !showSidebar }]">
      <div class="messages-container">
        <!-- 聊天设置 -->
        <ChatSettings
          v-model:visible="showSettings"
          v-model:settings="chatSettings"
          @reset="resetChatSettings"
          @save="saveChatSettings"
        />

        <!-- 聊天内容 -->
        <ChatMessages
          ref="messagesContainer"
          :messages="messages"
          :is-empty="messages.length === 0"
          @scroll-to-bottom="scrollToBottom"
        />

        <!-- 聊天输入区域 -->
        <ChatInput
          v-model:message="currentMessage"
          v-model:images="currentImages"
          :is-generating="isGenerating"
          :show-settings="showSettings"
          :show-sidebar="showSidebar"
          @send="sendMessage"
          @stop-generation="stopGeneration"
          @toggle-settings="showSettings = !showSettings"
          @upload-image="handleImageUpload"
          @remove-image="removeImage"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch, inject, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import * as ollamaApi from '@/api/ollama-api'
import { v4 as uuidv4 } from 'uuid'

// 导入拆分的组件
import ChatSidebar from '../components/chat/ChatSidebar.vue'
import ChatManageDialog from '../components/chat/ChatManageDialog.vue'
import ChatSettings from '../components/chat/ChatSettings.vue'
import ChatMessages from '../components/chat/ChatMessages.vue'
import ChatInput from '../components/chat/ChatInput.vue'

// 配置marked
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  }
})

// 状态
const messages = ref([])
const currentMessage = ref('')
const currentImages = ref([])
const isGenerating = ref(false)
const showSettings = ref(false)
const messagesContainer = ref(null)
const uploadRef = ref(null)
const searchQuery = ref('')
const currentChatId = ref(null)

// 聊天设置
const chatSettings = ref({
  systemPrompt: '',
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 2048,
  repeatPenalty: 1.1,
  jsonMode: false
})

// 获全局消息方法
const addMessage = inject('addMessage')

// 对话列表
const chats = ref([])

// 过后的对话列表
const filteredChats = computed(() => {
  const sortedChats = chats.value.sort((a, b) => {
    // 按更新时间排序
    return b.updateTime - a.updateTime
  })
  
  if (!searchQuery.value) return sortedChats
  const query = searchQuery.value.toLowerCase()
  return sortedChats.filter(chat => chat.name.toLowerCase().includes(query))
})

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

// 创建新对话
const createNewChat = () => {
  const newChat = {
    id: uuidv4(),
    name: `对话 ${chats.value.length + 1}`,
    createTime: Date.now(),
    updateTime: Date.now(),
    messages: [],
    pinned: false,
    isEditing: false
  }
  chats.value.push(newChat)
  saveChats()
  switchChat(newChat.id)
}

// 切换对话
const switchChat = (chatId) => {
  currentChatId.value = chatId
  const chat = chats.value.find(c => c.id === chatId)
  if (chat) {
    messages.value = chat.messages
    scrollToBottom()
  }
}

// 保存对话列表
const saveChats = () => {
  localStorage.setItem('chats', JSON.stringify(chats.value))
}

// 保存当前对话
const saveCurrentChat = () => {
  if (!currentChatId.value) return
  const chatIndex = chats.value.findIndex(c => c.id === currentChatId.value)
  if (chatIndex !== -1) {
    chats.value[chatIndex].messages = messages.value
    chats.value[chatIndex].updateTime = Date.now()
    saveChats()
  }
}

// 格式化消息内容
const formatMessage = (content) => {
  return marked(content)
}

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value.messagesContainer) {
    messagesContainer.value.messagesContainer.scrollTop = messagesContainer.value.messagesContainer.scrollHeight
  }
}

// 发送消息
const sendMessage = async () => {
  if ((!currentMessage.value.trim() && !currentImages.value.length) || isGenerating.value) return
  
  // 检查是否有正在运行的模型
  try {
    const runningModels = await ollamaApi.listRunningModels()
    const runningModel = runningModels.models?.[0]
    
    if (!runningModel) {
      addMessage({
        type: 'error',
        title: '发送失败',
        description: '请先在模型管理页面加载模型'
      })
      return
    }
    
    // 使用正在运行的模型
    const modelToUse = runningModel.name
    //console.log('Using running model:', modelToUse)
    
    // 发送消息
    isGenerating.value = true
    const userMessage = {
      role: 'user',
      content: currentMessage.value.trim()
    }
    
    if (currentImages.value.length) {
      userMessage.images = [...currentImages.value]
    }
    
    messages.value.push(userMessage)
    currentMessage.value = ''
    currentImages.value = []
    await scrollToBottom()
    saveCurrentChat()
    
    try {
      const response = await ollamaApi.chat(
        modelToUse,
        [
          { role: 'system', content: chatSettings.value.systemPrompt },
          ...messages.value
        ],
        {
          temperature: chatSettings.value.temperature,
          top_p: chatSettings.value.topP,
          top_k: chatSettings.value.topK,
          max_tokens: chatSettings.value.maxTokens,
          repeat_penalty: chatSettings.value.repeatPenalty,
          json_mode: chatSettings.value.jsonMode
        }
      )
      
      const reader = response.body.getReader()
      let assistantMessage = {
        role: 'assistant',
        content: ''
      }
      messages.value.push(assistantMessage)
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (!line.trim()) continue
          
          try {
            const data = JSON.parse(line)
            if (data.message?.content) {
              assistantMessage.content += data.message.content
              messages.value = [...messages.value]
              saveCurrentChat()
            }
          } catch (e) {
            console.error('Failed to parse chunk:', e)
          }
        }
      }
      
      await scrollToBottom()
    } catch (error) {
      if (error.name === 'AbortError') {
        addMessage({
          type: 'warning',
          title: '已停止生成',
          description: '生成过程已被用户中断'
        })
      } else {
        addMessage({
          type: 'error',
          title: '生成回复失败',
          description: error.message
        })
      }
    }
  } catch (error) {
    console.error('Failed to check running models:', error)
    addMessage({
      type: 'error',
      title: '发送失败',
      description: '检查模型状态失败，请稍后重试'
    })
  } finally {
    isGenerating.value = false
  }
}

// 停止生成
const stopGeneration = () => {
  ollamaApi.stopGeneration()
  isGenerating.value = false
  addMessage({
    type: 'success',
    title: '已停止生成',
    description: '生成过程已成功停止'
  })
}

// 处理图片上传
const handleImageUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    currentImages.value.push(e.target.result)
  }
  reader.readAsDataURL(file.raw)
  uploadRef.value.clearFiles()
}

// 移除图片
const removeImage = (index) => {
  currentImages.value.splice(index, 1)
}

// 监听设置变化
watch(chatSettings, (newSettings) => {
  localStorage.setItem('chatSettings', JSON.stringify(newSettings))
}, { deep: true })

// 默认设置
const defaultChatSettings = {
  systemPrompt: '',
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 2048,
  repeatPenalty: 1.1,
  jsonMode: false
}

// 保存聊天设置
const saveChatSettings = () => {
  localStorage.setItem('chatSettings', JSON.stringify(chatSettings.value))
  // 同步到全局设置
  const globalSettings = JSON.parse(localStorage.getItem('settings') || '{}')
  const newSettings = {
    ...globalSettings,
    systemPrompt: chatSettings.value.systemPrompt,
    temperature: chatSettings.value.temperature,
    topP: chatSettings.value.topP,
    topK: chatSettings.value.topK,
    maxTokens: chatSettings.value.maxTokens,
    repeatPenalty: chatSettings.value.repeatPenalty,
    jsonMode: chatSettings.value.jsonMode
  }
  localStorage.setItem('settings', JSON.stringify(newSettings))
  ElMessage.success('设置已保存')
  showSettings.value = false
}

// 重置聊天设置
const resetChatSettings = () => {
  chatSettings.value = { ...defaultChatSettings }
  ElMessage.success('已恢复默认值，请记得点击保存设置以保存更改')
}

// 监听全设置变化
watch(() => localStorage.getItem('settings'), (newSettings) => {
  if (newSettings) {
    const settings = JSON.parse(newSettings)
    chatSettings.value = {
      systemPrompt: settings.systemPrompt || defaultChatSettings.systemPrompt,
      temperature: settings.temperature || defaultChatSettings.temperature,
      topP: settings.topP || defaultChatSettings.topP,
      topK: settings.topK || defaultChatSettings.topK,
      maxTokens: settings.maxTokens || defaultChatSettings.maxTokens,
      repeatPenalty: settings.repeatPenalty || defaultChatSettings.repeatPenalty,
      jsonMode: settings.jsonMode || defaultChatSettings.jsonMode
    }
  }
})

// 初始化
onMounted(() => {
  // 加载对话列表
  try {
    const savedChats = localStorage.getItem('chats')
    if (savedChats) {
      chats.value = JSON.parse(savedChats).map(chat => ({
        ...chat,
        isEditing: false
      }))
    }
  } catch (error) {
    console.error('Failed to load chats:', error)
    chats.value = []
  }
  
  // 如果没有对话，建新对话
  if (chats.value.length === 0) {
    createNewChat()
  } else {
    // 加载最的对话
    const latestChat = chats.value.reduce((latest, current) => 
      current.updateTime > latest.updateTime ? current : latest,
      chats.value[0]
    )
    switchChat(latestChat.id)
  }
  
  // 加载设置
  try {
    const settings = JSON.parse(localStorage.getItem('settings') || '{}')
    chatSettings.value = {
      ...defaultChatSettings,
      ...settings
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
    chatSettings.value = { ...defaultChatSettings }
  }
})

// 边栏状态
const showSidebar = ref(true)

// 切换侧边��
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value
}

// 更新选中的对话
const updateSelectedChats = () => {
  selectedChats.value = chats.value.filter(chat => chat.selected).map(chat => chat.id)
}

// 删除选中的对话
const deleteSelectedChats = async () => {
  if (selectedManageChats.value.length === 0) return
  
  const idsToDelete = selectedManageChats.value.map(chat => chat.id)
  chats.value = chats.value.filter(chat => !idsToDelete.includes(chat.id))
  saveChats()
  
  // 如果删除的包含当前对话，切换到其他对话
  if (idsToDelete.includes(currentChatId.value)) {
    if (chats.value.length > 0) {
      switchChat(chats.value[0].id)
    } else {
      currentChatId.value = null
      messages.value = []
    }
  }
  
  selectedManageChats.value = []
  showManageDialog.value = false
  
  addMessage({
    type: 'success',
    title: '批量删除成功',
    description: '选中的对话已被删除'
  })
}

// 删除单个对话
const deleteChat = async (chatId) => {
  const index = chats.value.findIndex(c => c.id === chatId)
  if (index !== -1) {
    chats.value.splice(index, 1)
    saveChats()
    
    // 如果删除的是当前对话，切换到其他对话
    if (currentChatId.value === chatId) {
      if (chats.value.length > 0) {
        switchChat(chats.value[0].id)
      } else {
        currentChatId.value = null
        messages.value = []
      }
    }
    
    addMessage({
      type: 'success',
      title: '删除成功',
      description: '对话已被删除'
    })
  }
}

// 对话管理状态
const showManageDialog = ref(false)
const showRenameDialog = ref(false)
const manageSearchQuery = ref('')
const selectedManageChats = ref([])
const newChatName = ref('')
const chatToRename = ref(null)

// 过滤后的管理对话列表
const filteredManageChats = computed(() => {
  if (!manageSearchQuery.value) return chats.value
  const query = manageSearchQuery.value.toLowerCase()
  return chats.value.filter(chat => chat.name.toLowerCase().includes(query))
})

// 处理表格选择变化
const handleSelectionChange = (selection) => {
  selectedManageChats.value = selection
}

// 切换对话并关闭管理对话框
const switchChatAndCloseDialog = (chatId) => {
  switchChat(chatId)
  showManageDialog.value = false
}

// 重命名对话
const renameChat = (chat) => {
  chatToRename.value = chat
  newChatName.value = chat.name
  showRenameDialog.value = true
}

// 确认重命名
const confirmRename = () => {
  if (!newChatName.value.trim()) {
    ElMessage.warning('对话名称不能为空')
    return
  }
  
  const chat = chats.value.find(c => c.id === chatToRename.value.id)
  if (chat) {
    chat.name = newChatName.value.trim()
    saveChats()
    showRenameDialog.value = false
    ElMessage.success('重命名成功')
  }
}

// 切换置顶状态
const togglePin = (chat) => {
  chat.isPinned = !chat.isPinned
}

// 开始重命名对话
const startRename = (chat) => {
  chat.isEditing = true
  chat.newName = chat.name
  nextTick(() => {
    if (chat.isEditing) {
      const input = document.querySelector('.chat-item.active .el-input__inner')
      if (input) {
        input.focus()
      }
    }
  })
}

// 完成重命名
const finishRename = (chat) => {
  if (!chat.newName || !chat.newName.trim()) {
    chat.newName = chat.name
  }
  
  // 限制名称长度为30个字符
  chat.newName = chat.newName.trim().substring(0, 30)
  
  if (chat.newName !== chat.name) {
    chat.name = chat.newName
    chat.updateTime = Date.now()
    saveChats()
  }
  chat.isEditing = false
}
</script>

<style scoped>
.chat-view {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
  margin-left: 300px;
  height: 100%;
  overflow: hidden;
}

.main-expanded {
  margin-left: 0;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px); /* 减去顶部导航栏的高度 */
  position: relative;
}

@media (max-width: 768px) {
  .chat-main {
    margin-left: 0;
  }
  
  .chat-sidebar {
    position: fixed;
    z-index: 1000;
    width: 100%;
    max-width: 300px;
  }
  
  .sidebar-hidden {
    transform: translateX(-100%);
  }
}
</style> 