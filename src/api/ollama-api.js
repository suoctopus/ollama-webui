// 创建 OllamaAPI 类
class OllamaAPI {
  constructor(apiEndpoint) {
    this.updateBaseURL(apiEndpoint)
    this.controller = null
  }

  // 更新 baseURL
  updateBaseURL(apiEndpoint) {
    this.baseURL = apiEndpoint || 'http://localhost:11434'
  }

  // 发起请求的方法
  async request(endpoint, method = 'GET', data = null, options = {}) {
    //this.updateBaseURL()
    const url = `${this.baseURL}/api/${endpoint}`
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    }

    if (data) {
      fetchOptions.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, fetchOptions)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('API 请求失败：模型未找到或未安装，请先在模型管理页面安装模型')
        }
        const errorText = await response.text().catch(() => response.statusText)
        throw new Error(`API 请求失败：${errorText || response.statusText}`)
      }
      return response
    } catch (error) {
      throw error
    }
  }

  // 获取模型列表
  async listModels() {
    const response = await this.request('tags')
    return response.json()
  }

  // 获取运行中的模型列表
  async listRunningModels() {
    const response = await this.request('ps')
    return response.json()
  }

  // 加载模型
  async loadModel(name, keepAlive = '5') {
    return this.request('generate', 'POST', {
      model: name,
      prompt: '',
      keep_alive: keepAlive
    }, {
      timeout: 60000 // 增加超时时间到60秒
    })
  }

  // 卸载模型
  async unloadModel(name) {
    return this.request('generate', 'POST', {
      model: name,
      prompt: '',
      keep_alive: '0'
    }, {
      timeout: 60000 // 增加超时时间到60秒
    })
  }


  // 删除模型
  async deleteModel(name) {
    return this.request('delete', 'DELETE', { name })
  }

  // 拉取模型
  async pullModel(name, insecure = false) {
    this.controller = new AbortController()
    const signal = this.controller.signal
    return this.request('pull', 'POST', {
      name,
      insecure
    }, { signal })
  }

  // 获取模型信息
  async getModelInfo(name) {
    const response = await this.request('show', 'POST', {
      name
    })
    return response.json()
  }

  // 设置模型永久驻留
  async setModelPermanent(name) {
    return this.request('generate', 'POST', {
      model: name,
      prompt: '',
      keep_alive: -1
    })
  }

  // 取消模型永久驻留
  async unsetModelPermanent(name) {
    return this.request('generate', 'POST', {
      model: name,
      prompt: '',
      keep_alive: '0'
    })
  }


  // 聊天对话
  async chat(model, messages, options = {}) {
    // 使用 AbortController 来支持取消请求
    this.controller = new AbortController()
    const signal = this.controller.signal
    return this.request('chat', 'POST', {
      model,
      messages,
      stream: true,
      ...options
    }, { signal })
  }

  // 停止生成
  stopGeneration() {
    if (this.controller) {
      this.controller.abort()
      this.controller = null
    }
  }
}

// 创建单例实例
const ollamaApi = new OllamaAPI()

// 导出实例方法
export default ollamaApi
export const updateBaseURL = (apiEndpoint) => ollamaApi.updateBaseURL(apiEndpoint) // 暴露 updateBaseURL 方法
export const listModels = () => ollamaApi.listModels()
export const listRunningModels = () => ollamaApi.listRunningModels()
export const loadModel = (name, keepAlive) => ollamaApi.loadModel(name, keepAlive)
export const unloadModel = (name) => ollamaApi.unloadModel(name)
export const deleteModel = (name) => ollamaApi.deleteModel(name)
export const pullModel = (name, insecure, onProgress) => ollamaApi.pullModel(name, insecure, onProgress)
export const getModelInfo = (name) => ollamaApi.getModelInfo(name)
export const setModelPermanent = (name) => ollamaApi.setModelPermanent(name)
export const unsetModelPermanent = (name) => ollamaApi.unsetModelPermanent(name)
export const chat = (model, messages, options) => ollamaApi.chat(model, messages, options)
export const stopGeneration = () => ollamaApi.stopGeneration() 