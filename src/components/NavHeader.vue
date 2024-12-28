<template>
  <header class="nav-header">
    <div class="logo">
      <img src="../assets/logo.svg" alt="Logo" class="logo-img">
      <span class="logo-text">Ollama WebUI</span>
    </div>
    <el-menu
      mode="horizontal"
      router
      :default-active="$route.path"
      class="nav-menu">
      <el-menu-item index="/chat">
        <el-icon><ChatRound /></el-icon>
        <span>聊天</span>
      </el-menu-item>
      <el-menu-item index="/models">
        <el-icon><Box /></el-icon>
        <span>模型管理</span>
      </el-menu-item>
      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <span>设置</span>
      </el-menu-item>
    </el-menu>
  </header>
</template>

<script setup>
import { ChatRound, Box, Connection, Setting } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.nav-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);

  .logo {
    display: flex;
    align-items: center;
    margin-right: 40px;
    cursor: pointer;
    
    .logo-img {
      width: 32px;
      height: 32px;
      margin-right: 8px;
    }
    
    .logo-text {
      font-size: 18px;
      font-weight: bold;
      color: var(--el-text-color-primary);
      white-space: nowrap;
    }
  }

  .nav-menu {
    flex: 1;
    border-bottom: none;
    justify-content: flex-start;
    
    :deep(.el-menu-item) {
      display: flex;
      align-items: center;
      padding: 0 20px;
      height: 60px;
      
      .el-icon {
        margin-right: 4px;
        font-size: 18px;
      }
      
      span {
        font-size: 14px;
      }
      
      &.is-active {
        font-weight: bold;
      }
    }
  }
}
</style> 