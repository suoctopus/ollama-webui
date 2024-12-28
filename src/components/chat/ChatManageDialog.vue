<template>
  <el-dialog
    v-model="dialogVisible"
    title="管理对话记录"
    width="800px"
    :close-on-click-modal="false"
    @update:modelValue="updateVisible">
    <div class="manage-dialog-content">
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索对话..."
          prefix-icon="Search" />
      </div>
      
      <div class="chat-manage-list">
        <el-table
          :data="filteredChats"
          style="width: 100%"
          height="400px"
          @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" />
          <el-table-column label="对话名称" min-width="200">
            <template #default="{ row }">
              <div
                class="chat-name-cell"
                @click="$emit('switch-chat', row.id)">
                {{ row.name }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column width="90">
            <template #default="{ row }">
              <el-button
                type="danger"
                circle
                @click="$emit('delete', row.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button
          type="danger"
          :disabled="selectedChats.length === 0"
          @click="$emit('delete-selected')">
          删除所选 ({{ selectedChats.length }})
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Delete, Search } from '@element-plus/icons-vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  chats: {
    type: Array,
    required: true
  },
  selectedChats: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'selection-change', 'delete', 'delete-selected', 'switch-chat'])

const dialogVisible = ref(props.visible)
const searchQuery = ref('')

// 监听外部visible变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

// 更新visible
const updateVisible = (val) => {
  emit('update:visible', val)
}

// 过滤后的对话列表
const filteredChats = computed(() => {
  if (!searchQuery.value) return props.chats
  const query = searchQuery.value.toLowerCase()
  return props.chats.filter(chat => chat.name.toLowerCase().includes(query))
})

// 处理选择变化
const handleSelectionChange = (selection) => {
  emit('selection-change', selection)
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}
</script>

<style scoped>
.manage-dialog-content {
  min-height: 500px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-box {
  margin-bottom: 16px;
}

.chat-manage-list {
  flex: 1;
  overflow: hidden;
}

.chat-name-cell {
  cursor: pointer;
  color: var(--el-color-primary);
}

.chat-name-cell:hover {
  text-decoration: underline;
}

.dialog-footer {
  display: flex;
  justify-content: flex-start;
  padding: 16px 0;
}

:deep(.el-dialog__body) {
  padding-bottom: 0;
}

:deep(.el-dialog__footer) {
  padding-top: 0;
}

@media (max-width: 768px) {
  .manage-dialog-content {
    min-height: 400px;
  }
  
  .search-box {
    margin-bottom: 12px;
  }
}
</style> 