/**
 * DashStory SDK - Dashboard Narration Platform
 * Transform complex data dashboards into intuitive, narrated insights
 * 
 * @version 1.0.0
 * @license MIT
 */

import { PanelRegistry } from './core/PanelRegistry.js';
import { DataNormalizer } from './core/DataNormalizer.js';
import { HotkeyManager } from './core/HotkeyManager.js';
import { NetworkClient } from './core/NetworkClient.js';
import { EventBus } from './core/EventBus.js';
import { DemoBar } from './ui/DemoBar.js';

/**
 * DashStory主类 - SDK入口
 */
class DashStory {
  /**
   * @param {Object} config - 配置选项
   * @param {string} config.apiKey - API密钥
   * @param {string} [config.apiEndpoint] - API端点地址
   * @param {string} [config.hotkey] - 自定义快捷键
   * @param {string} [config.language] - 语言设置 ('zh' | 'en')
   * @param {string} [config.voiceId] - 默认语音ID
   */
  constructor(config = {}) {
    this._validateConfig(config);
    
    this.config = {
      apiEndpoint: 'https://api.dashstory.io/v1',
      hotkey: 'Ctrl+Shift+D',
      language: 'zh',
      voiceId: 'professional',
      ...config
    };

    // 核心模块初始化
    this.eventBus = new EventBus();
    this.panelRegistry = new PanelRegistry(this.eventBus);
    this.dataNormalizer = new DataNormalizer();
    this.networkClient = new NetworkClient(this.config);
    this.hotkeyManager = new HotkeyManager(this.config.hotkey, this.eventBus);
    this.demoBar = null;

    this._initialized = false;
  }

  /**
   * 初始化SDK
   * @returns {Promise<void>}
   */
  async init() {
    if (this._initialized) {
      console.warn('[DashStory] SDK already initialized');
      return;
    }

    try {
      // 验证API Key
      await this.networkClient.validateApiKey();

      // 初始化演示模式Bar
      this.demoBar = new DemoBar({
        eventBus: this.eventBus,
        panelRegistry: this.panelRegistry,
        networkClient: this.networkClient,
        config: this.config
      });

      // 绑定快捷键
      this.hotkeyManager.bind(() => {
        this.demoBar.toggle();
      });

      // 监听事件
      this._setupEventListeners();

      this._initialized = true;
      this.eventBus.emit('sdk:initialized');
      console.log('[DashStory] SDK initialized successfully');
    } catch (error) {
      console.error('[DashStory] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 注册单个Panel
   * @param {Object} panelData - Panel数据
   * @returns {string} panelId
   */
  registerPanel(panelData) {
    const normalizedData = this.dataNormalizer.normalize(panelData);
    return this.panelRegistry.register(normalizedData);
  }

  /**
   * 批量注册Panel
   * @param {Array<Object>} panels - Panel数据数组
   * @returns {Array<string>} panelIds
   */
  registerPanels(panels) {
    return panels.map(panel => this.registerPanel(panel));
  }

  /**
   * 更新Panel数据
   * @param {string} panelId - Panel ID
   * @param {Object} data - 新数据
   */
  updatePanel(panelId, data) {
    const normalizedData = this.dataNormalizer.normalize({ ...data, panelId });
    this.panelRegistry.update(panelId, normalizedData);
  }

  /**
   * 批量更新Panel数据
   * @param {Array<Object>} updates - 更新数据数组
   */
  updatePanels(updates) {
    updates.forEach(update => {
      this.updatePanel(update.panelId, update);
    });
  }

  /**
   * 移除Panel
   * @param {string} panelId - Panel ID
   */
  removePanel(panelId) {
    this.panelRegistry.remove(panelId);
  }

  /**
   * 获取所有已注册的Panel
   * @returns {Array<Object>}
   */
  getPanels() {
    return this.panelRegistry.getAll();
  }

  /**
   * 播放所有Panel解读
   * @param {Object} options - 播放选项
   * @returns {Promise<void>}
   */
  async playAll(options = {}) {
    if (!this._initialized) {
      throw new Error('[DashStory] SDK not initialized');
    }
    return this.demoBar.playAll(options);
  }

  /**
   * 播放指定Panel解读
   * @param {string} panelId - Panel ID
   * @param {Object} options - 播放选项
   * @returns {Promise<void>}
   */
  async playPanel(panelId, options = {}) {
    if (!this._initialized) {
      throw new Error('[DashStory] SDK not initialized');
    }
    return this.demoBar.playPanel(panelId, options);
  }

  /**
   * 暂停播放
   */
  pause() {
    this.demoBar?.pause();
  }

  /**
   * 继续播放
   */
  resume() {
    this.demoBar?.resume();
  }

  /**
   * 停止播放
   */
  stop() {
    this.demoBar?.stop();
  }

  /**
   * 显示演示模式Bar
   */
  showBar() {
    this.demoBar?.show();
  }

  /**
   * 隐藏演示模式Bar
   */
  hideBar() {
    this.demoBar?.hide();
  }

  /**
   * 设置语音
   * @param {string} voiceId - 语音ID
   */
  setVoice(voiceId) {
    this.config.voiceId = voiceId;
    this.demoBar?.setVoice(voiceId);
  }

  /**
   * 设置播放速度
   * @param {number} speed - 播放速度 (0.75 | 1.0 | 1.25)
   */
  setSpeed(speed) {
    this.demoBar?.setSpeed(speed);
  }

  /**
   * 监听事件
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    this.eventBus.on(event, callback);
  }

  /**
   * 移除事件监听
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    this.eventBus.off(event, callback);
  }

  /**
   * 销毁SDK实例
   */
  destroy() {
    this.hotkeyManager.unbind();
    this.demoBar?.destroy();
    this.eventBus.clear();
    this.panelRegistry.clear();
    this._initialized = false;
    console.log('[DashStory] SDK destroyed');
  }

  /**
   * 验证配置
   * @private
   */
  _validateConfig(config) {
    if (!config.apiKey) {
      throw new Error('[DashStory] apiKey is required');
    }
  }

  /**
   * 设置事件监听器
   * @private
   */
  _setupEventListeners() {
    this.eventBus.on('playback:started', (data) => {
      console.log('[DashStory] Playback started:', data.panelId);
    });

    this.eventBus.on('playback:ended', (data) => {
      console.log('[DashStory] Playback ended:', data.panelId);
    });

    this.eventBus.on('playback:error', (error) => {
      console.error('[DashStory] Playback error:', error);
    });
  }
}

// 静态方法：创建实例
DashStory.create = function(config) {
  return new DashStory(config);
};

// 版本信息
DashStory.VERSION = '1.0.0';

export default DashStory;
export { DashStory, PanelRegistry, DataNormalizer, HotkeyManager, EventBus };
