import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  timeout: 30000 // 30秒超时
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 从 localStorage 获取 API 地址
    const settings = JSON.parse(localStorage.getItem('settings') || '{}')
    config.baseURL = settings.apiEndpoint || 'http://localhost:11434'
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// API 接口
export default {
  // 获取模型列表
  listModels() {
    return api.get('/api/tags')
  },

  // 获取运行中的模型列表
  listRunningModels() {
    return api.get('/api/ps')
  },

  // 加载模型（通过空的generate请求）
  loadModel(name, keepAlive = '5') {
    return api.post('/api/generate', {
      model: name,
      prompt: '',
      keep_alive: keepAlive
    }, {
      timeout: 60000 // 增加超时时间到60秒
    })
  },

  // 卸载模型（通过设置keep_alive为0）
  unloadModel(name) {
    return api.post('/api/generate', {
      model: name,
      prompt: '',
      keep_alive: '0'
    }, {
      timeout: 60000 // 增加超时时间到60秒
    })
  },

  // 复制模型
  copyModel(source, destination) {
    return api.post('/api/copy', {
      source,
      destination
    })
  },

  // 删除模型
  deleteModel(name) {
    return api.delete('/api/delete', {
      data: { name }
    })
  },

  // 拉取模型
  pullModel(name, insecure = false, onProgress) {
    return api.post('/api/pull', {
      name,
      insecure,
      stream: true
    }, {
      responseType: 'text',
      transformResponse: [data => data], // 保持原始文本数据
      timeout: 0, // 禁用超时
      onDownloadProgress: onProgress // 传入进度回调
    })
  },

  // 创建模型
  createModel(name, modelfile) {
    return api.post('/api/create', {
      name,
      modelfile
    })
  },

  // 获取模型信息
  getModelInfo(name) {
    return api.post('/api/show', {
      name
    })
  },

  // 设置模型永久驻留
  setModelPermanent(name) {
    return api.post('/api/generate', {
      model: name,
      prompt: '',
      keep_alive: -1
    })
  },

  // 取消模型永久驻留
  unsetModelPermanent(name) {
    return api.post('/api/generate', {
      model: name,
      prompt: '',
      keep_alive: '0'
    })
  },

  // 生成回答
  generate(params) {
    return api.post('/api/generate', {
      ...params,
      stream: true
    })
  },

  // 聊天对话
  chat(params) {
    return api.post('/api/chat', {
      ...params,
      stream: true
    })
  }
} 