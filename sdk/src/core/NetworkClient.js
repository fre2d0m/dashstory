/**
 * NetworkClient - 网络请求客户端
 * 处理与后端API的通信
 */
export class NetworkClient {
  /**
   * @param {Object} config - SDK配置
   */
  constructor(config) {
    this._apiKey = config.apiKey;
    this._apiEndpoint = config.apiEndpoint;
    this._timeout = config.timeout || 30000;
    this._retryCount = config.retryCount || 3;
    this._retryDelay = config.retryDelay || 1000;
  }

  /**
   * 验证API Key
   * @returns {Promise<boolean>}
   */
  async validateApiKey() {
    try {
      const response = await this._request('GET', '/auth/validate');
      return response.valid === true;
    } catch (error) {
      if (error.status === 401) {
        throw new Error('[NetworkClient] Invalid API key');
      }
      throw error;
    }
  }

  /**
   * 批量上报Panel数据
   * @param {Array<Object>} panels - Panel数据数组
   * @returns {Promise<Object>}
   */
  async uploadPanels(panels) {
    return this._request('POST', '/panels/batch', { panels });
  }

  /**
   * 请求生成解读语音
   * @param {Object} options - 请求选项
   * @param {string} options.voiceId - 语音ID
   * @param {Array<Object>} options.panels - Panel数据
   * @param {string} options.playMode - 播放模式 ('all' | 'single')
   * @returns {Promise<Object>}
   */
  async requestNarration(options) {
    return this._request('POST', '/narration/play', {
      voiceId: options.voiceId,
      panels: options.panels,
      playMode: options.playMode || 'all',
      language: options.language || 'zh'
    });
  }

  /**
   * 查询解读状态
   * @param {string} jobId - 任务ID
   * @returns {Promise<Object>}
   */
  async getNarrationStatus(jobId) {
    return this._request('GET', `/narration/status/${jobId}`);
  }

  /**
   * 获取可用语音列表
   * @returns {Promise<Array>}
   */
  async getVoices() {
    return this._request('GET', '/voices');
  }

  /**
   * 发送遥测数据
   * @param {Object} telemetry - 遥测数据
   * @returns {Promise<void>}
   */
  async sendTelemetry(telemetry) {
    try {
      await this._request('POST', '/telemetry', telemetry);
    } catch (error) {
      // 遥测失败不抛出错误
      console.warn('[NetworkClient] Telemetry failed:', error);
    }
  }

  /**
   * 发起HTTP请求
   * @private
   */
  async _request(method, path, body = null) {
    const url = `${this._apiEndpoint}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this._apiKey}`,
      'X-SDK-Version': '1.0.0'
    };

    const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    };

    let lastError;
    for (let attempt = 0; attempt < this._retryCount; attempt++) {
      try {
        const response = await this._fetchWithTimeout(url, options);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(errorData.message || `HTTP ${response.status}`);
          error.status = response.status;
          error.code = errorData.code;
          throw error;
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        
        // 不重试的错误
        if (error.status === 401 || error.status === 403 || error.status === 422) {
          throw error;
        }

        // 限流时等待更长时间
        if (error.status === 429) {
          await this._delay(this._retryDelay * (attempt + 2));
          continue;
        }

        if (attempt < this._retryCount - 1) {
          await this._delay(this._retryDelay * (attempt + 1));
        }
      }
    }

    throw lastError;
  }

  /**
   * 带超时的fetch
   * @private
   */
  async _fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this._timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('[NetworkClient] Request timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * 延迟函数
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 更新API Key
   * @param {string} apiKey - 新API Key
   */
  setApiKey(apiKey) {
    this._apiKey = apiKey;
  }

  /**
   * 更新API端点
   * @param {string} endpoint - 新端点
   */
  setEndpoint(endpoint) {
    this._apiEndpoint = endpoint;
  }
}

export default NetworkClient;
