<template>
  <div class="models-view">
    <!-- 说明卡片 -->
    <el-card class="info-card mb-4">
      <template #header>
        <div class="card-header">
          <span class="title">模型管理</span>
        </div>
      </template>
      <div class="info-content">
        <p>在这里您可以管理所有的 Ollama 模型，包括拉取新模型和管理已安装的模型。您可以设置模型的永久驻留和自动卸载时间，也可以使用全局设置中的配置。</p>
      </div>
    </el-card>

    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <el-button type="primary" @click="showPullDialog = true">
        <el-icon><Download /></el-icon>拉取模型
      </el-button>
      
      <div class="right-controls">
        <el-switch
          v-model="autoRefresh"
          active-text="自动刷新"
          inactive-text="手动刷新"
          class="refresh-switch"
        />
        <el-button @click="fetchModels" :loading="loading">
          <el-icon><Refresh /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 模型列表 -->
    <div class="model-grid">
      <el-card v-for="model in models" :key="model.name" class="model-card">
        <template #header>
          <div class="card-header">
            <div class="model-name">
              <span class="name-text">{{ model.name }}</span>
              <el-tag 
                v-if="isModelRunning(model.name)" 
                type="warning" 
                size="small"
              >运行中</el-tag>
            </div>
            <div class="header-actions">
              <el-dropdown trigger="click">
                <el-button type="primary" text>
                  <el-icon><More /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="showModelInfo(model)">
                      查看详情
                    </el-dropdown-item>
                    <el-dropdown-item 
                      divided 
                      type="danger" 
                      @click="deleteModel(model)"
                    >删除模型</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>

        <div class="model-info">
          <div class="info-row">
            <span class="label">大小：</span>
            <span class="value">{{ formatSize(model.size) }}</span>
          </div>
          <div class="info-row">
            <span class="label">修改时间：</span>
            <span class="value">{{ formatDate(model.modified_at) }}</span>
          </div>
          <div class="info-row">
            <span class="label">参数量：</span>
            <span class="value">{{ model.details?.parameter_size || '未知' }}</span>
          </div>
          <div class="info-row">
            <span class="label">量化：</span>
            <span class="value">{{ model.details?.quantization_level || '未知' }}</span>
          </div>
          <div v-if="isModelRunning(model.name)" class="info-row">
            <span class="label">过期时间：</span>
            <span class="value">{{ getModelExpireTime(model.name) }}</span>
          </div>
        </div>

        <div class="model-actions">
          <template v-if="isModelRunning(model.name)">
            <div v-if="loadingStates[model.name]" class="loading-state">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>正在卸载模型...</span>
            </div>
            <template v-else>
              <div class="model-settings">
                <div class="setting-row">
                  <el-switch
                    v-model="modelSettings[model.name].isPermanent"
                    active-text="永久驻留"
                    @change="(val) => toggleModelPermanent(model, val)"
                  />
                </div>
                <div v-if="!modelSettings[model.name].isPermanent" class="setting-row">
                  <span class="setting-label">自动卸载时间（分钟）：</span>
                  <el-input-number 
                    v-model="modelSettings[model.name].keepAlive"
                    :min="1"
                    :max="1440"
                    @change="updateModelKeepAlive(model)"
                    size="small"
                  />
                </div>
              </div>
              <el-button 
                type="warning" 
                @click="unloadModel(model)"
              >
                卸载模型
              </el-button>
            </template>
          </template>
          <template v-else>
            <div v-if="loadingStates[model.name]" class="loading-state">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>正在加载模型...</span>
            </div>
            <div v-else>
              <div class="model-settings">
                <div class="setting-row">
                  <el-switch
                    v-model="modelSettings[model.name].isPermanent"
                    active-text="永久驻留"
                    @change="(val) => toggleModelPermanent(model, val)"
                  />
                </div>
                <div v-if="!modelSettings[model.name].isPermanent" class="setting-row">
                  <span class="setting-label">自动卸载时间（分钟）：</span>
                  <el-input-number 
                    v-model="modelSettings[model.name].keepAlive"
                    :min="1"
                    :max="1440"
                    @change="updateModelKeepAlive(model)"
                    size="small"
                  />
                </div>
              </div>
              <el-button 
                type="primary" 
                @click="loadModel(model)"
              >
                加载模型
              </el-button>
            </div>
          </template>
        </div>
      </el-card>
    </div>

    <!-- 拉取模型对话框 -->
    <el-dialog
      v-model="showPullDialog"
      title="拉取模型"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="pull-info">
        <p>如何拉取模型：</p>
        <ul>
          <li>直接输入模型名称，例如：<code>llama2</code>、<code>mistral</code>、<code>codellama</code></li>
          <li>添加标签选择特定版本，例如：<code>llama2:13b</code>、<code>mistral:7b</code></li>
          <li>使用 latest 标签获取最新版本：<code>llama2:latest</code></li>
          <li>使用量化版本减少内存占用：<code>llama2:7b-q4_k_m</code></li>
        </ul>
        <p class="tip">提示：<br>首次拉取可能需要较长时间，请耐心等待。<br>下载完成后需要点击"完成"按钮关闭窗口。</p>
      </div>

      <el-form
        ref="pullFormRef"
        :model="pullForm"
        :rules="pullRules"
        label-width="100px"
      >
        <el-form-item label="模型名称" prop="name">
          <el-input v-model="pullForm.name" placeholder="例如：llama2:latest" />
        </el-form-item>
      </el-form>

      <div v-if="pulling || pullComplete" class="pull-progress">
        <div class="progress-info">
          <div class="info-item">
            <span class="label">总大小：</span>
            <span class="value">{{ pullTotalSize ? formatSize(pullTotalSize) : '计算中...' }}</span>
          </div>
          <div class="info-item">
            <span class="label">已下载：</span>
            <span class="value">{{ formatSize(pullCurrentSize) }}</span>
          </div>
          <div class="info-item">
            <span class="label">下载速度：</span>
            <span class="value">{{ pullSpeed && !pullComplete && pullCurrentSize > 0 ? formatSize(pullSpeed) + '/s' : '-' }}</span>
          </div>
        </div>
        
        <el-progress 
          :percentage="pullProgress" 
          :status="pullStatus"
          :format="(percentage) => percentage ? `${percentage}%` : '准备中...'"
        />
        
        <div class="pull-logs">
          <div 
            v-for="(log, index) in pullLogs" 
            :key="index"
            :class="['log-item', log.type]"
          >
            {{ log.message }}
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showPullDialog = false" :disabled="pulling">取消</el-button>
          <el-button 
            type="primary" 
            @click="pulling ? handlePullComplete() : pullModel()" 
            :loading="pulling && !pullComplete"
          >{{ pulling ? (pullComplete ? '完成' : '拉取中') : '拉取' }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 模型详情对话框 -->
    <el-dialog
      v-model="showInfoDialog"
      title="模型详情"
      width="800px"
      class="info-dialog"
    >
      <template v-if="modelInfo">
        <el-tabs>
          <el-tab-pane label="基本信息">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="模型格式">
                {{ modelInfo.details?.format || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="模型家族">
                {{ modelInfo.details?.family || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="参数量">
                {{ modelInfo.details?.parameter_size || '未知' }}
              </el-descriptions-item>
              <el-descriptions-item label="量化等级">
                {{ modelInfo.details?.quantization_level || '未知' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          
          <el-tab-pane label="Modelfile">
            <pre><code>{{ modelInfo.modelfile }}</code></pre>
          </el-tab-pane>
          
          <el-tab-pane label="模板">
            <pre><code>{{ modelInfo.template }}</code></pre>
          </el-tab-pane>
          
          <el-tab-pane label="参数">
            <pre><code>{{ modelInfo.parameters }}</code></pre>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ollamaApi from '@/api/ollama-api'

// 数据
const models = ref([])
const runningModels = ref([])
const loading = ref(false)
const autoRefresh = ref(true)
let refreshTimer = null

// 模型设置
const modelSettings = ref({})

// 拉取模型相关
const showPullDialog = ref(false)
const pulling = ref(false)
const pullProgress = ref(0)
const pullStatus = ref('')
const pullSpeed = ref(0)
const pullTotalSize = ref(0)
const pullCurrentSize = ref(0)
const pullFormRef = ref(null)
const pullForm = ref({
  name: ''
})
const pullRules = {
  name: [
    { required: true, message: '请输入模型名称', trigger: 'blur' }
  ]
}

// 模型详情相关
const showInfoDialog = ref(false)
const modelInfo = ref(null)

// 格式化文件大小
const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

// 获取模型过期时间
const getModelExpireTime = (modelName) => {
  const runningModel = runningModels.value.find(m => m.name === modelName)
  if (!runningModel) return '未知'
  
  // 检查永久驻留状态
  const settings = modelSettings.value[modelName]
  if (settings?.isPermanent) {
    return '永不过期'
  }
  
  // 格式化过期时间
  const expiresAt = new Date(runningModel.expires_at)
  if (isNaN(expiresAt.getTime())) {
    return '未知'
  }
  
  // 如果过期时间小于当前时间，显示已过期
  if (expiresAt < new Date()) {
    return '已过期'
  }
  
  return formatDate(expiresAt)
}

// 获取模型列表
const fetchModels = async () => {
  loading.value = true
  try {
    const [modelsResponse, runningResponse] = await Promise.all([
      ollamaApi.listModels(),
      ollamaApi.listRunningModels()
    ])
    models.value = modelsResponse.models || []
    runningModels.value = runningResponse.models || []
    
    // 初始化模型设置
    models.value.forEach(model => {
      if (!modelSettings.value[model.name]) {
        modelSettings.value[model.name] = {
          isPermanent: false,
          keepAlive: 5,
          useCustomSettings: false
        }
      }
    })
  } catch (error) {
    ElMessage.error('获取模型列表失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 删除模型
const deleteModel = (model) => {
  ElMessageBox.confirm(
    `确定要删除模型 ${model.name} 吗？`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await ollamaApi.deleteModel(model.name)
      if (response.status === 200) {
        ElMessage.success('删除成功')
        fetchModels()
      }
    } catch (error) {
      ElMessage.error('删除失败：' + error.message)
    }
  })
}

// 拉取模型
const pullLogs = ref([])
const pullComplete = ref(false)

// 处理拉取完成
const handlePullComplete = () => {
  showPullDialog.value = false
  pulling.value = false
  pullComplete.value = false
  pullProgress.value = 0
  pullSpeed.value = 0
  pullTotalSize.value = 0
  pullCurrentSize.value = 0
  pullStatus.value = ''
  pullLogs.value = []
  pullForm.value.name = ''
  // 重新获取模型列表
  fetchModels()
}

const pullModel = async () => {
  if (!pullFormRef.value) return

  await pullFormRef.value.validate(async (valid) => {
    if (valid) {
      pulling.value = true
      pullComplete.value = false
      pullProgress.value = 0
      pullSpeed.value = 0
      pullTotalSize.value = 0
      pullCurrentSize.value = 0
      pullStatus.value = ''
      pullLogs.value = []

      let lastTime = Date.now()
      let lastCompleted = 0
      let speedUpdateTimer = null

      try {
        const response = await ollamaApi.pullModel(pullForm.value.name, false)
        if (!response.body) {
          throw new Error('没有收到有效的响应体')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() // 保留未完整的行

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const data = JSON.parse(line)

              // 更新状态和进度
              if (data.status === 'pulling manifest') {
                pullLogs.value.push({
                  type: 'info',
                  message: '正在拉取模型清单...'
                })
              } else if (data.status === 'downloading' || data.status.startsWith('pulling')) {
                // 更新总大小
                if (data.total) {
                  pullTotalSize.value = data.total
                }

                // 更新已下载大小和进度
                if (data.completed) {
                  pullCurrentSize.value = data.completed

                  // 使用节流更新下载速度
                  if (!speedUpdateTimer) {
                    speedUpdateTimer = setTimeout(() => {
                      const now = Date.now()
                      const timeDiff = now - lastTime
                      const completedDiff = data.completed - lastCompleted
                      if (timeDiff > 0) {
                        pullSpeed.value = completedDiff / (timeDiff / 1000)
                      }
                      lastTime = now
                      lastCompleted = data.completed
                      speedUpdateTimer = null
                    }, 1000) // 每秒更新一次速度
                  }

                  // 更新进度
                  if (pullTotalSize.value > 0) {
                    pullProgress.value = Math.round((data.completed / pullTotalSize.value) * 100)
                  }
                }

                // 如果是新的数据块，添加日志
                if (data.digest && data.digest !== currentDigest) {
                  currentDigest = data.digest
                  pullLogs.value.push({
                    type: 'info',
                    message: `开始下载 ${data.digest}`
                  })
                }
              } else if (data.status === 'verifying sha256 digest') {
                pullLogs.value.push({
                  type: 'info',
                  message: '正在验证文件完整性...'
                })
              } else if (data.status === 'writing manifest') {
                pullLogs.value.push({
                  type: 'info',
                  message: '正在写入清单...'
                })
              } else if (data.status === 'removing any unused layers') {
                pullLogs.value.push({
                  type: 'info',
                  message: '正在清理未使用的层...'
                })
              } else if (data.status === 'success') {
                pullStatus.value = 'success'
                pullProgress.value = 100
                pullComplete.value = true
                pulling.value = true // 保持为true，让按钮显示"完成"
                pullLogs.value.push({
                  type: 'success',
                  message: '拉取完成！您可以点击完成按钮关闭窗口。'
                })
                fetchModels()
                ElMessage.success('模型拉取成功')
                return
              }

              // 自动滚动到底部
              nextTick(() => {
                const logsContainer = document.querySelector('.pull-logs')
                if (logsContainer) {
                  logsContainer.scrollTop = logsContainer.scrollHeight
                }
              })
            } catch (e) {
              // 忽略不完整的 JSON 数据
              if (line.length > 0) {
                console.error('解析行失败:', e)
              }
            }
          }
        }

        // 处理可能剩余的缓冲区
        if (buffer.trim()) {
          try {
            const data = JSON.parse(buffer)
            if (data.status === 'success') {
              pullStatus.value = 'success'
              pullProgress.value = 100
              pullComplete.value = true
              pulling.value = true // 保持为true，让按钮显示"完成"
              pullLogs.value.push({
                type: 'success',
                message: '拉取完成！您可以点击完成按钮关闭窗口。'
              })
              fetchModels()
              ElMessage.success('模型拉取成功')
            }
          } catch (e) {
            console.error('解析缓冲区失败:', e)
          }
        }
      } catch (error) {
        pullStatus.value = 'exception'
        pullComplete.value = true
        pulling.value = false
        ElMessage.error('模型拉取失败：' + error.message)
        pullLogs.value.push({
          type: 'error',
          message: `拉取失败: ${error.message}`
        })
      } finally {
        if (speedUpdateTimer) {
          clearTimeout(speedUpdateTimer)
          speedUpdateTimer = null
        }
      }
    }
  })
}

// 查看模型信息
const showModelInfo = async (model) => {
  showInfoDialog.value = true
  
  try {
    const response = await ollamaApi.getModelInfo(model.name)
    modelInfo.value = response
  } catch (error) {
    ElMessage.error('获取模型信息失败：' + error.message)
  }
}

// 检查模型是否在运行
const isModelRunning = (modelName) => {
  // 如果模型正在加载中，不显示运行状态
  if (loadingStates.value[modelName]) {
    return false
  }
  
  const runningModel = runningModels.value.find(model => model.name === modelName)
  if (!runningModel) {
    return false
  }
  
  // 如果不是永久驻留且已过期，也返回false
  const settings = modelSettings.value[modelName]
  if (!settings?.isPermanent) {
    const expiresAt = new Date(runningModel.expires_at)
    if (isNaN(expiresAt.getTime()) || expiresAt < new Date()) {
      return false
    }
  }
  
  return true
}

// 加载模型
const loadingStates = ref({})

const loadModel = async (model) => {
  // 检查是否有其他正在运行的模型
  const runningModel = models.value.find(m => isModelRunning(m.name))
  if (runningModel) {
    ElMessageBox.confirm(
      `当前已有模型"${runningModel.name}"正在运行，��要先卸载它才能加载新模型。是否继续？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(async () => {
      try {
        await unloadModel(runningModel)
        await performLoadModel(model)
      } catch (error) {
        console.error('加载模型失败:', error)
        ElMessage.error('加载模型失败')
      }
    }).catch(() => {
      // 用户取消操作
    })
  } else {
    await performLoadModel(model)
  }
}

// 实际执行加载模型的方法
const performLoadModel = async (model) => {
  try {
    const settings = modelSettings.value[model.name]
    const keepAlive = settings?.isPermanent ? -1 : `${settings?.keepAlive || 5}m`
    
    // 显示加载提示
    const loadingMessage = ElMessage({
      message: '正在加载模型...',
      duration: 0,
      showClose: true,
      type: 'info'
    })
    
    // 设置加载状态
    loadingStates.value[model.name] = true
    
    // 发送加载请求
    const response = await ollamaApi.loadModel(model.name, keepAlive)
    if (response) {
      loadingMessage.close()
      ElMessage.success('模型加载成功')
      fetchModels()
    }
  } catch (error) {
    console.error('加载模型失败:', error)
    ElMessage.error('加载模型失败')
  } finally {
    // 最后再取消加载状态
    loadingStates.value[model.name] = false
  }
}

// 卸载模型
const unloadModel = async (model) => {
  if (loadingStates.value[model.name]) return
  
  try {
    loadingStates.value[model.name] = true
    const unloadingMessage = ElMessage({
      message: '正在卸载模型...',
      duration: 0,
      showClose: true,
      type: 'info'
    })
    // 先发送请求
    const unloadPromise = ollamaApi.unloadModel(model.name)
    
    
    await unloadPromise
    // 等待一段时间确保模型完全卸载
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 刷新模型列表
    await fetchModels()
    
    // 关闭之前的提示，显示成功提示
    unloadingMessage.close()
    ElMessage.success('模型卸载成功')
  } catch (error) {
    ElMessage.error('卸载模型失败：' + error.message)
  } finally {
    loadingStates.value[model.name] = false
  }
}

// 切换模型永久驻留状态
const toggleModelPermanent = async (model, isPermanent) => {
  try {
    // 更新设置
    if (!modelSettings.value[model.name]) {
      modelSettings.value[model.name] = {
        isPermanent: false,
        keepAlive: 5,
        useCustomSettings: true
      }
    }
    modelSettings.value[model.name].isPermanent = isPermanent
    modelSettings.value[model.name].useCustomSettings = true
    
    // 保存设置
    saveModelSettings()
    
    // 如果模型正在运行，应用设置
    if (isModelRunning(model.name)) {
      if (isPermanent) {
        await ollamaApi.setModelPermanent(model.name)
        ElMessage.success('已设置模型为永久驻留')
      } else {
        const keepAlive = modelSettings.value[model.name]?.keepAlive || 5
        await ollamaApi.loadModel(model.name, `${keepAlive}m`)
        ElMessage.success('已取消模型永久驻留')
      }
      fetchModels()
    } else {
      ElMessage.success(isPermanent ? '已设置加载时永久驻留' : '已设置加载时自动卸载')
    }
  } catch (error) {
    modelSettings.value[model.name].isPermanent = !isPermanent
    saveModelSettings()
    ElMessage.error(isPermanent ? '设置永久驻留失败' : '取消永久驻留失败')
  }
}

// 更新模型自动卸载时间
const updateModelKeepAlive = async (model) => {
  try {
    if (!modelSettings.value[model.name]) {
      modelSettings.value[model.name] = {
        isPermanent: false,
        keepAlive: 5,
        useCustomSettings: true
      }
    }
    modelSettings.value[model.name].useCustomSettings = true
    const keepAlive = modelSettings.value[model.name]?.keepAlive || 5
    
    // 保存设置
    saveModelSettings()
    
    // 如果模型正在运行，应用设置
    if (isModelRunning(model.name)) {
      await ollamaApi.loadModel(model.name, `${keepAlive}m`)
      ElMessage.success('已更新自动卸载时间')
      fetchModels()
    } else {
      ElMessage.success('已保存自动卸载时间设置')
    }
  } catch (error) {
    ElMessage.error('更新自动卸载时间失败')
  }
}

// 动刷新
const startAutoRefresh = () => {
  if (refreshTimer) return
  refreshTimer = setInterval(fetchModels, 5000)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 监听自动刷新开关
watch(autoRefresh, (newValue) => {
  if (newValue) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

// 初始化
onMounted(() => {
  
  // 从 localStorage 加载模型设置
  try {
    const savedSettings = localStorage.getItem('modelSettings')
    if (savedSettings) {
      modelSettings.value = JSON.parse(savedSettings)
    }
  } catch (error) {
    console.error('Failed to load model settings:', error)
  }
  
  fetchModels()
  if (autoRefresh.value) {
    startAutoRefresh()
  }
})

// 清理
onUnmounted(() => {
  stopAutoRefresh()
})


// 保存模型设置到 localStorage
const saveModelSettings = () => {
  localStorage.setItem('modelSettings', JSON.stringify(modelSettings.value))
}
</script>

<style lang="scss" scoped>
.models-view {
  padding: 24px;
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
  
  .info-card {
    margin-bottom: 24px;
    
    .title {
      font-size: 18px;
      font-weight: 500;
    }
    
    .info-content {
      font-size: 14px;
      line-height: 1.6;
      
      h4 {
        margin: 16px 0 8px;
        font-size: 15px;
      }
      
      ul {
        margin: 8px 0;
        padding-left: 20px;
        
        li {
          margin-bottom: 4px;
        }
      }
      
      .tip {
        color: var(--el-text-color-secondary);
        font-style: italic;
        margin-top: 8px;
      }
      
      code {
        background: var(--el-bg-color);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Fira Code', monospace;
      }
    }
  }
  
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .right-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .refresh-switch {
        margin-right: 12px;
      }
    }
  }
  
  .model-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
    
    .model-card {
      border-radius: 8px;
      transition: all 0.3s ease;
      height: fit-content;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .model-name {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
          
          .name-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            flex: 1;
          }
          
          .el-tag {
            flex-shrink: 0;
          }
        }
      }
      
      .model-info {
        padding: 16px 0;
        
        .info-row {
          display: flex;
          margin-bottom: 8px;
          font-size: 14px;
          
          .label {
            color: var(--el-text-color-secondary);
            width: 80px;
          }
          
          .value {
            color: var(--el-text-color-primary);
            flex: 1;
          }
        }
      }
      
      .model-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-top: 16px;
        border-top: 1px solid var(--el-border-color-lighter);
        
        .model-settings {
          display: flex;
          flex-direction: column;
          gap: 12px;
          
          .setting-row {
            display: flex;
            align-items: center;
            gap: 12px;
            
            .setting-label {
              font-size: 14px;
              color: var(--el-text-color-regular);
              white-space: nowrap;
            }
          }
        }
        
        .action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
      }
    }
  }
}

.pull-info {
  margin-bottom: 24px;
  font-size: 14px;
  line-height: 1.6;
  
  ul {
    margin: 8px 0;
    padding-left: 20px;
    
    li {
      margin-bottom: 4px;
    }
  }
  
  .tip {
    color: var(--el-text-color-secondary);
    font-style: italic;
    margin-top: 8px;
  }
  
  code {
    background: var(--el-bg-color);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
  }
}

.keep-alive-setting {
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  
  span {
    font-size: 14px;
    white-space: nowrap;
  }
}

.info-dialog {
  :deep(.el-dialog__body) {
    padding: 24px;
  }
  
  .el-descriptions {
    margin-bottom: 24px;
  }
  
  pre {
    background: var(--el-bg-color-page);
    padding: 16px;
    border-radius: 4px;
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    overflow-x: auto;
    
    code {
      font-family: 'Fira Code', monospace;
      white-space: pre-wrap;
    }
  }
}

// 暗色主题适配
:deep(.dark) {
  .model-card {
    background: var(--el-bg-color);
  }
  
  pre {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-darker);
  
  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    padding: 8px;
    background: var(--el-bg-color-page);
    border-radius: 4px;
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .label {
        color: var(--el-text-color-secondary);
        font-size: 13px;
      }
      
      .value {
        font-family: 'Fira Code', monospace;
        font-size: 13px;
      }
    }
  }
  }
}

.pull-progress {
  margin-top: 20px;
  
  .pull-logs {
    margin-top: 16px;
    height: 300px;
    overflow-y: auto;
    background: var(--el-bg-color-page);
    border-radius: 4px;
    padding: 12px;
    font-family: 'Fira Code', monospace;
    font-size: 13px;
    
    .log-item {
      padding: 4px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
      white-space: pre-wrap;
      word-break: break-all;
      
      &:last-child {
        border-bottom: none;
      }
      
      &.debug {
        color: var(--el-text-color-secondary);
        font-size: 12px;
      
      &.success {
        color: var(--el-color-success);
      }
      }
      
      &.error {
        color: var(--el-color-danger);
      }
    }
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  color: var(--el-text-color-secondary);
  
  .el-icon {
    font-size: 18px;
  }
}
</style> 