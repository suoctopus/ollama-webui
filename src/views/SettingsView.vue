<template>
  <div class="settings-view">
    <!-- 设置卡片 -->
    <div class="settings-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top">
        
        <!-- 基本设置 -->
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">基本设置</h3>
            <el-button size="small" @click="resetSection('basic')">重置此项</el-button>
          </div>
          
          <el-form-item
            label="API 地址"
            prop="apiEndpoint">
            <el-input 
              v-model="form.apiEndpoint"
              placeholder="例如：http://localhost:11434" />
            <span class="setting-tip">
              Ollama API 服务器的地址，默认为 http://localhost:11434
            </span>
          </el-form-item>
        </div>

        <!-- 性能设置 -->
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">性能设置</h3>
            <el-button size="small" @click="resetSection('performance')">重置此项</el-button>
          </div>

          <el-form-item label="CPU线程数">
            <el-input-number
              v-model="form.numThread"
              :min="1"
              :max="32" />
            <span class="setting-tip">
              CPU 线程数。建议设置为您 CPU 核心数的 1-2 倍。更多的线程可能提高性能，但也会增加 CPU 负载。
            </span>
          </el-form-item>

          <el-form-item label="上下文长度">
            <el-input-number
              v-model="form.numCtx"
              :min="512"
              :max="30720"
              :step="512" />
            <span class="setting-tip">
              模型能够记住的上下文长度。建议范围：2048-4096，最大可设置为30720。
              较大的值允许更长的对话历史，但会占用更多内存。
            </span>
          </el-form-item>

          <el-form-item label="批处理大小">
            <el-input-number
              v-model="form.numBatch"
              :min="1"
              :max="512" />
            <span class="setting-tip">
              生成时的批处理大小。建议范围：128-512。较大的值可能提高生成速度，但会占用更多显存。
            </span>
          </el-form-item>

          <el-form-item label="GPU数量">
            <el-input-number
              v-model="form.numGpu"
              :min="1"
              :max="8" />
            <span class="setting-tip">
              用于模型推理的GPU数量。如果有多个GPU，可以设置大于1的值来使用多GPU。
            </span>
          </el-form-item>

          <el-form-item label="主GPU">
            <el-input-number
              v-model="form.mainGpu"
              :min="0"
              :max="7" />
            <span class="setting-tip">
              主GPU的编号，从0开始。在多GPU系统中，这个GPU将承担主要的计算任务。
            </span>
          </el-form-item>

          <el-form-item label="低显存模式">
            <el-switch v-model="form.lowVram" />
            <span class="setting-tip">
              启用后将优化显存使用，适用于显存较小的GPU。可能会略微影响性能。
            </span>
          </el-form-item>

          <el-form-item label="F16 KV Cache">
            <el-switch v-model="form.f16KV" />
            <span class="setting-tip">
              使用FP16格式的KV缓存，可以减少显存使用，但可能略微影响精度。
            </span>
          </el-form-item>

          <el-form-item label="使用mmap">
            <el-switch v-model="form.useMmap" />
            <span class="setting-tip">
              使用内存映射加载模型，可以减少内存使用，但可能影响加载速度。
            </span>
          </el-form-item>

          <el-form-item label="使用mlock">
            <el-switch v-model="form.useMlock" />
            <span class="setting-tip">
              锁定模型在内存中，防止被交换到磁盘，可以提高性能但会占用更多内存。
            </span>
          </el-form-item>

          <el-form-item label="NUMA">
            <el-switch v-model="form.numa" />
            <span class="setting-tip">
              在NUMA系统上优化内存访问，可能提高性能。
            </span>
          </el-form-item>
        </div>

        <!-- 生成参数设置 -->
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">生成参数设置</h3>
            <el-button size="small" @click="resetSection('generation')">重置此项</el-button>
          </div>

          <el-form-item label="Temperature (温度)" prop="temperature">
            <el-slider
              v-model="form.temperature"
              :min="0"
              :max="1"
              :step="0.1" />
            <span class="setting-tip">
              控制回答的创意性。较高的值会产生更有创意但可能不太准确的回答，
              较低的值会产生更保守、更确定的回答。建议范围：0.1-0.9
            </span>
          </el-form-item>

          <el-form-item label="Top P (概率截断)" prop="topP">
            <el-slider
              v-model="form.topP"
              :min="0"
              :max="1"
              :step="0.1" />
            <span class="setting-tip">
              控制回答的多样性。较高的值会产生更多样的回答，
              较低的值会使回答更加集中和确定。建议范围：0.1-0.9
            </span>
          </el-form-item>

          <el-form-item label="Top K (保留词数)" prop="topK">
            <el-input-number
              v-model="form.topK"
              :min="1"
              :max="100" />
            <span class="setting-tip">
              每次选词时考虑的候选词数量。较大的值会增加回答的多样性，
              较小的值会使回答更加确定。建议范围：20-100
            </span>
          </el-form-item>

          <el-form-item label="最大生成长度" prop="maxTokens">
            <el-input-number
              v-model="form.maxTokens"
              :min="1"
              :max="30720" />
            <span class="setting-tip">
              单次回答的最大长度（token数）。建议范围：1024-4096，最大可设置为30720。
              较大的值允许更长的回答，但会增加生成时间。
            </span>
          </el-form-item>

          <el-form-item label="重复惩罚" prop="repeatPenalty">
            <el-slider
              v-model="form.repeatPenalty"
              :min="1"
              :max="2"
              :step="0.1" />
            <span class="setting-tip">
              防止文本重复的程度。较高的值会减少重复，但可能影响文本的连贯性。
              建议范围：1.0-1.3
            </span>
          </el-form-item>

          <el-form-item label="换行惩罚">
            <el-switch v-model="form.penalizeNewline" />
            <span class="setting-tip">
              是否对换行符进行惩罚。启用后会减少不必要的换行，使文本更连贯。
            </span>
          </el-form-item>

          <el-form-item label="JSON 模式">
            <el-switch v-model="form.jsonMode" />
            <span class="setting-tip">
              启用后，模型将生成格式化的 JSON 输出。适用于需要结构化数据的场景，如 API 调用或数据处理。
            </span>
          </el-form-item>

          <el-form-item label="Raw 模式">
            <el-switch v-model="form.rawMode" />
            <span class="setting-tip">
              使用原始提示模板不是聊天格式。仅在需要完全控制提示时使用，通常不建议启用。
            </span>
          </el-form-item>

          <el-form-item label="流式响应">
            <el-switch v-model="form.streamMode" />
            <span class="setting-tip">
              启用后，模型将以流式方式返回响应，实现打字机效果。禁用后，将等待完整响应后一次性显示。
            </span>
          </el-form-item>
        </div>

        <!-- 系统提示词 -->
        <div class="settings-section">
          <div class="section-header">
            <h3 class="section-title">默认系统提示词</h3>
            <el-button size="small" @click="resetSection('prompt')">重置此项</el-button>
          </div>

          <el-form-item label="系统提示词" prop="systemPrompt">
            <el-input
              v-model="form.systemPrompt"
              type="textarea"
              :rows="4"
              placeholder="设置默认的系统提示词..." />
            <span class="setting-tip">
              默认的系统提示词，用于定义AI助手的角色和行为。
              每次新建对话时都会使用这个提示词。
            </span>
          </el-form-item>
        </div>
      </el-form>
    </div>

    <!-- 浮动按钮 -->
    <div class="floating-buttons">
      <el-button @click="resetSettings">恢复默认</el-button>
      <el-button type="primary" @click="saveSettings">保存设置</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import ollamaApi from '@/api/ollama'

// 表单引用
const formRef = ref(null)
const models = ref([])

// 取设置
const getSettings = () => {
  try {
    const settings = localStorage.getItem('settings')
    return settings ? JSON.parse(settings) : null
  } catch (error) {
    console.error('读取设置失败:', error)
    return null
  }
}

// 保存设置
const setSettings = (settings) => {
  try {
    localStorage.setItem('settings', JSON.stringify(settings))
  } catch (error) {
    console.error('保存设置失败:', error)
    ElMessage.error('保存设置失败')
  }
}

// 表单数据
const form = ref({
  apiEndpoint: 'http://localhost:11434',
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxTokens: 2048,
  repeatPenalty: 1.1,
  penalizeNewline: false,
  jsonMode: false,
  rawMode: false,
  streamMode: true,
  systemPrompt: '',
  numCtx: 2048,
  numBatch: 512,
  numGpu: 1,
  mainGpu: 0,
  numThread: 16,
  lowVram: false,
  f16KV: true,
  useMmap: true,
  useMlock: false,
  numa: false
})

// 表单验证规则
const rules = {
  apiEndpoint: [
    { required: true, message: '请输入API地址', trigger: 'blur' },
    { type: 'url', message: '请输入有效的URL地址', trigger: 'blur' }
  ],
  temperature: [
    { required: true, type: 'number', message: '请设置温度值', trigger: 'change' }
  ],
  topP: [
    { required: true, type: 'number', message: '请设置Top P值', trigger: 'change' }
  ],
  topK: [
    { required: true, type: 'number', message: '请设置Top K值', trigger: 'change' }
  ],
  maxTokens: [
    { required: true, type: 'number', message: '请设置最大生成长度', trigger: 'change' }
  ],
  repeatPenalty: [
    { required: true, type: 'number', message: '请设置重复惩罚值', trigger: 'change' }
  ]
}

// 加载模型列表
const loadModels = async () => {
  try {
    const response = await ollamaApi.listModels()
    models.value = response.data.models || []
  } catch (error) {
    console.error('加载模型列表失败:', error)
    ElMessage.error('加载模型列表失败')
  }
}

// 保存设置
const saveSettings = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      setSettings(form.value)
      ElMessage.success('设置保存成功')
    }
  })
}

// 重置设置
const resetSettings = () => {
  form.value = {
    apiEndpoint: 'http://localhost:11434',
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    maxTokens: 2048,
    repeatPenalty: 1.1,
    penalizeNewline: false,
    jsonMode: false,
    rawMode: false,
    streamMode: true,
    systemPrompt: '',
    numCtx: 2048,
    numBatch: 512,
    numGpu: 1,
    mainGpu: 0,
    numThread: 16,
    lowVram: false,
    f16KV: true,
    useMmap: true,
    useMlock: false,
    numa: false
  }
  ElMessage.success('已恢复默认值，请记得点击保存设置以保存更改')
}

// 重置指定部分的设置
const resetSection = (section) => {
  const defaultValues = {
    basic: {
      apiEndpoint: 'http://localhost:11434'
    },
    performance: {
      numCtx: 2048,
      numBatch: 512,
      numGpu: 1,
      mainGpu: 0,
      numThread: 16,
      lowVram: false,
      f16KV: true,
      useMmap: true,
      useMlock: false,
      numa: false
    },
    generation: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxTokens: 2048,
      repeatPenalty: 1.1,
      penalizeNewline: false,
      jsonMode: false,
      rawMode: false,
      streamMode: true
    },
    prompt: {
      systemPrompt: ''
    }
  }

  if (defaultValues[section]) {
    Object.assign(form.value, defaultValues[section])
    ElMessage.success('已恢复默认值，请记得点击保存设置以保存更改')
  }
}

// 初始化
onMounted(() => {
  const settings = getSettings()
  if (settings) {
    Object.assign(form.value, settings)
  }
  loadModels()
})
</script>

<style lang="scss" scoped>
.settings-view {
  padding: 20px;
  height: 100vh;
  overflow-y: auto;
  position: relative;
  padding-bottom: 150px; // 增加底部空白空间
  
  .settings-card {
    max-width: 800px;
    margin: 0 auto;
    margin-bottom: 40px; // 增加卡片底部间距
    
    :deep(.el-form) {
      .el-form-item {
        margin-bottom: 24px;
        
        &:last-child {
          margin-bottom: 0;
          padding-bottom: 20px; // 最后一个表单项增加底部间距
        }
        
        .el-form-item__label {
          padding-bottom: 8px;
          font-weight: 500;
        }
        
        .el-input-number {
          width: 180px;
        }
        
        .el-slider {
          width: 300px;
        }
        
        .el-select {
          width: 100%;
        }
      }
    }
  }

  .settings-section {
    margin-bottom: 32px; // 增加个部分之间的间距
    background: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: var(--el-box-shadow-light);
    padding: 24px;
    transition: all 0.3s ease;

    &:last-child {
      margin-bottom: 40px; // 最后一个部分增加底部间距
    }

    &:hover {
      box-shadow: var(--el-box-shadow);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--el-border-color-light);
      padding-bottom: 16px;

      .section-title {
        font-size: 16px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }

    .setting-tip {
      display: block;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
      line-height: 1.5;
    }
  }

  .floating-buttons {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 100;
    display: flex;
    gap: 12px;
    padding: 12px 24px;
    background: var(--el-bg-color);
    border-radius: 8px;
    box-shadow: var(--el-box-shadow);
    transition: all 0.3s ease;
    backdrop-filter: blur(8px);
    background-color: rgba(var(--el-bg-color-rgb), 0.9);

    &:hover {
      box-shadow: var(--el-box-shadow-dark);
    }
  }
}
</style> 