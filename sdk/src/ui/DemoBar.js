/**
 * DemoBar - 演示模式控制栏
 * 提供语音选择、播放控制、状态显示
 */
export class DemoBar {
  /**
   * @param {Object} options - 配置选项
   */
  constructor(options) {
    this._eventBus = options.eventBus;
    this._panelRegistry = options.panelRegistry;
    this._networkClient = options.networkClient;
    this._config = options.config;

    // 状态
    this._state = 'hidden'; // hidden | visible | playing | paused
    this._currentPanelIndex = -1;
    this._audioElement = null;
    this._playbackSpeed = 1.0;
    this._selectedVoice = options.config.voiceId || 'professional';
    this._playQueue = [];

    // DOM元素
    this._container = null;
    this._elements = {};

    // 初始化
    this._create();
    this._bindEvents();
  }

  /**
   * 状态机定义
   */
  static STATES = {
    HIDDEN: 'hidden',
    VISIBLE: 'visible',
    PLAYING: 'playing',
    PAUSED: 'paused'
  };

  /**
   * 可用语音选项
   */
  static VOICES = [
    { id: 'professional', name: '专业风格', nameEn: 'Professional' },
    { id: 'friendly', name: '友好风格', nameEn: 'Friendly' }
  ];

  /**
   * 播放速度选项
   */
  static SPEEDS = [0.75, 1.0, 1.25];

  /**
   * 创建DOM结构
   * @private
   */
  _create() {
    // 创建容器
    this._container = document.createElement('div');
    this._container.id = 'dashstory-demo-bar';
    this._container.className = 'dashstory-bar dashstory-bar--hidden';
    this._container.innerHTML = this._getTemplate();

    // 注入样式
    this._injectStyles();

    // 添加到页面
    document.body.appendChild(this._container);

    // 缓存元素引用
    this._cacheElements();
  }

  /**
   * 获取模板
   * @private
   */
  _getTemplate() {
    const isZh = this._config.language === 'zh';
    
    return `
      <div class="dashstory-bar__header">
        <div class="dashstory-bar__logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <span>DashStory</span>
        </div>
        <button class="dashstory-bar__close" data-action="close" title="${isZh ? '关闭' : 'Close'}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="dashstory-bar__controls">
        <div class="dashstory-bar__row">
          <div class="dashstory-bar__group">
            <label>${isZh ? '语音' : 'Voice'}</label>
            <select class="dashstory-bar__select" data-control="voice">
              ${DemoBar.VOICES.map(v => `
                <option value="${v.id}" ${v.id === this._selectedVoice ? 'selected' : ''}>
                  ${isZh ? v.name : v.nameEn}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="dashstory-bar__group">
            <label>${isZh ? 'Panel' : 'Panel'}</label>
            <select class="dashstory-bar__select" data-control="panel">
              <option value="all">${isZh ? '全部播放' : 'Play All'}</option>
            </select>
          </div>

          <div class="dashstory-bar__group">
            <label>${isZh ? '速度' : 'Speed'}</label>
            <select class="dashstory-bar__select" data-control="speed">
              ${DemoBar.SPEEDS.map(s => `
                <option value="${s}" ${s === 1.0 ? 'selected' : ''}>${s}x</option>
              `).join('')}
            </select>
          </div>
        </div>

        <div class="dashstory-bar__row dashstory-bar__row--buttons">
          <button class="dashstory-bar__btn dashstory-bar__btn--primary" data-action="play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span>${isZh ? '播放' : 'Play'}</span>
          </button>

          <button class="dashstory-bar__btn" data-action="pause" style="display:none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
            <span>${isZh ? '暂停' : 'Pause'}</span>
          </button>

          <button class="dashstory-bar__btn" data-action="resume" style="display:none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <span>${isZh ? '继续' : 'Resume'}</span>
          </button>

          <button class="dashstory-bar__btn dashstory-bar__btn--danger" data-action="stop" style="display:none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h12v12H6z"/>
            </svg>
            <span>${isZh ? '停止' : 'Stop'}</span>
          </button>
        </div>
      </div>

      <div class="dashstory-bar__status" style="display:none">
        <div class="dashstory-bar__progress">
          <div class="dashstory-bar__progress-bar"></div>
        </div>
        <div class="dashstory-bar__status-text">
          <span data-status="panel"></span>
          <span data-status="time"></span>
        </div>
      </div>

      <div class="dashstory-bar__error" style="display:none">
        <span data-error="message"></span>
        <button class="dashstory-bar__btn dashstory-bar__btn--small" data-action="retry">
          ${isZh ? '重试' : 'Retry'}
        </button>
      </div>
    `;
  }

  /**
   * 注入样式
   * @private
   */
  _injectStyles() {
    if (document.getElementById('dashstory-styles')) return;

    const style = document.createElement('style');
    style.id = 'dashstory-styles';
    style.textContent = `
      .dashstory-bar {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 360px;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 999999;
        transition: transform 0.3s ease, opacity 0.3s ease;
        overflow: hidden;
      }

      .dashstory-bar--hidden {
        transform: translateY(100%) translateX(50%);
        opacity: 0;
        pointer-events: none;
      }

      .dashstory-bar--minimized {
        width: auto;
      }

      .dashstory-bar__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .dashstory-bar__logo {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
      }

      .dashstory-bar__close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .dashstory-bar__close:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .dashstory-bar__controls {
        padding: 16px;
      }

      .dashstory-bar__row {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
      }

      .dashstory-bar__row--buttons {
        margin-bottom: 0;
        justify-content: center;
      }

      .dashstory-bar__group {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .dashstory-bar__group label {
        font-size: 12px;
        color: #6b7280;
        font-weight: 500;
      }

      .dashstory-bar__select {
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #f9fafb;
        font-size: 13px;
        cursor: pointer;
        transition: border-color 0.2s;
      }

      .dashstory-bar__select:hover {
        border-color: #667eea;
      }

      .dashstory-bar__select:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      .dashstory-bar__btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        background: #f3f4f6;
        color: #374151;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
      }

      .dashstory-bar__btn:hover {
        background: #e5e7eb;
      }

      .dashstory-bar__btn--primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .dashstory-bar__btn--primary:hover {
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        transform: translateY(-1px);
      }

      .dashstory-bar__btn--danger {
        background: #fee2e2;
        color: #dc2626;
      }

      .dashstory-bar__btn--danger:hover {
        background: #fecaca;
      }

      .dashstory-bar__btn--small {
        padding: 6px 12px;
        font-size: 12px;
      }

      .dashstory-bar__btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .dashstory-bar__status {
        padding: 12px 16px;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
      }

      .dashstory-bar__progress {
        height: 4px;
        background: #e5e7eb;
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .dashstory-bar__progress-bar {
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        width: 0%;
        transition: width 0.3s ease;
      }

      .dashstory-bar__status-text {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #6b7280;
      }

      .dashstory-bar__error {
        padding: 12px 16px;
        background: #fef2f2;
        border-top: 1px solid #fecaca;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #dc2626;
        font-size: 13px;
      }

      @media (max-width: 480px) {
        .dashstory-bar {
          width: calc(100% - 32px);
          right: 16px;
          bottom: 16px;
        }
      }

      @keyframes dashstory-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .dashstory-bar--loading .dashstory-bar__btn--primary {
        animation: dashstory-pulse 1.5s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 缓存元素引用
   * @private
   */
  _cacheElements() {
    this._elements = {
      voiceSelect: this._container.querySelector('[data-control="voice"]'),
      panelSelect: this._container.querySelector('[data-control="panel"]'),
      speedSelect: this._container.querySelector('[data-control="speed"]'),
      playBtn: this._container.querySelector('[data-action="play"]'),
      pauseBtn: this._container.querySelector('[data-action="pause"]'),
      resumeBtn: this._container.querySelector('[data-action="resume"]'),
      stopBtn: this._container.querySelector('[data-action="stop"]'),
      closeBtn: this._container.querySelector('[data-action="close"]'),
      retryBtn: this._container.querySelector('[data-action="retry"]'),
      statusSection: this._container.querySelector('.dashstory-bar__status'),
      errorSection: this._container.querySelector('.dashstory-bar__error'),
      progressBar: this._container.querySelector('.dashstory-bar__progress-bar'),
      statusPanel: this._container.querySelector('[data-status="panel"]'),
      statusTime: this._container.querySelector('[data-status="time"]'),
      errorMessage: this._container.querySelector('[data-error="message"]')
    };
  }

  /**
   * 绑定事件
   * @private
   */
  _bindEvents() {
    // 语音选择
    this._elements.voiceSelect.addEventListener('change', (e) => {
      this._selectedVoice = e.target.value;
      this._eventBus.emit('voice:changed', { voiceId: this._selectedVoice });
    });

    // 速度选择
    this._elements.speedSelect.addEventListener('change', (e) => {
      this._playbackSpeed = parseFloat(e.target.value);
      if (this._audioElement) {
        this._audioElement.playbackRate = this._playbackSpeed;
      }
      this._eventBus.emit('speed:changed', { speed: this._playbackSpeed });
    });

    // 播放按钮
    this._elements.playBtn.addEventListener('click', () => this._handlePlay());
    this._elements.pauseBtn.addEventListener('click', () => this.pause());
    this._elements.resumeBtn.addEventListener('click', () => this.resume());
    this._elements.stopBtn.addEventListener('click', () => this.stop());
    this._elements.closeBtn.addEventListener('click', () => this.hide());
    this._elements.retryBtn.addEventListener('click', () => this._handlePlay());

    // 监听Panel注册变化
    this._eventBus.on('panel:registered', () => this._updatePanelSelect());
    this._eventBus.on('panel:removed', () => this._updatePanelSelect());
    this._eventBus.on('panel:cleared', () => this._updatePanelSelect());
  }

  /**
   * 更新Panel下拉框
   * @private
   */
  _updatePanelSelect() {
    const panels = this._panelRegistry.getAll();
    const isZh = this._config.language === 'zh';
    
    let options = `<option value="all">${isZh ? '全部播放' : 'Play All'}</option>`;
    panels.forEach(panel => {
      options += `<option value="${panel.panelId}">${panel.title}</option>`;
    });
    
    this._elements.panelSelect.innerHTML = options;
  }

  /**
   * 处理播放
   * @private
   */
  async _handlePlay() {
    const selectedPanel = this._elements.panelSelect.value;
    
    if (selectedPanel === 'all') {
      await this.playAll();
    } else {
      await this.playPanel(selectedPanel);
    }
  }

  /**
   * 播放所有Panel
   */
  async playAll(options = {}) {
    const panels = this._panelRegistry.export();
    if (panels.length === 0) {
      this._showError(this._config.language === 'zh' ? '没有可播放的Panel' : 'No panels to play');
      return;
    }

    this._playQueue = [...panels];
    this._currentPanelIndex = 0;
    await this._playNext(options);
  }

  /**
   * 播放指定Panel
   */
  async playPanel(panelId, options = {}) {
    const panel = this._panelRegistry.get(panelId);
    if (!panel) {
      this._showError(this._config.language === 'zh' ? 'Panel不存在' : 'Panel not found');
      return;
    }

    this._playQueue = [panel];
    this._currentPanelIndex = 0;
    await this._playNext(options);
  }

  /**
   * 播放下一个
   * @private
   */
  async _playNext(options = {}) {
    if (this._currentPanelIndex >= this._playQueue.length) {
      this._onPlaybackComplete();
      return;
    }

    const panel = this._playQueue[this._currentPanelIndex];
    this._setState(DemoBar.STATES.PLAYING);
    this._updateStatus(panel);
    this._hideError();

    try {
      // 请求生成语音
      const response = await this._networkClient.requestNarration({
        voiceId: this._selectedVoice,
        panels: [panel],
        playMode: 'single',
        language: this._config.language,
        ...options
      });

      // 播放音频
      await this._playAudio(response.audioUrl, panel);
      
      // 播放下一个
      this._currentPanelIndex++;
      await this._playNext(options);

    } catch (error) {
      console.error('[DemoBar] Playback error:', error);
      this._showError(error.message || (this._config.language === 'zh' ? '播放失败' : 'Playback failed'));
      this._eventBus.emit('playback:error', { error, panel });
    }
  }

  /**
   * 播放音频
   * @private
   */
  _playAudio(audioUrl, panel) {
    return new Promise((resolve, reject) => {
      if (this._audioElement) {
        this._audioElement.pause();
        this._audioElement = null;
      }

      this._audioElement = new Audio(audioUrl);
      this._audioElement.playbackRate = this._playbackSpeed;

      this._audioElement.addEventListener('loadedmetadata', () => {
        this._eventBus.emit('playback:started', { panelId: panel.panelId, duration: this._audioElement.duration });
      });

      this._audioElement.addEventListener('timeupdate', () => {
        this._updateProgress();
      });

      this._audioElement.addEventListener('ended', () => {
        this._eventBus.emit('playback:ended', { panelId: panel.panelId });
        resolve();
      });

      this._audioElement.addEventListener('error', (e) => {
        reject(new Error('Audio playback failed'));
      });

      this._audioElement.play().catch(reject);
    });
  }

  /**
   * 暂停
   */
  pause() {
    if (this._audioElement && this._state === DemoBar.STATES.PLAYING) {
      this._audioElement.pause();
      this._setState(DemoBar.STATES.PAUSED);
      this._eventBus.emit('playback:paused');
    }
  }

  /**
   * 继续
   */
  resume() {
    if (this._audioElement && this._state === DemoBar.STATES.PAUSED) {
      this._audioElement.play();
      this._setState(DemoBar.STATES.PLAYING);
      this._eventBus.emit('playback:resumed');
    }
  }

  /**
   * 停止
   */
  stop() {
    if (this._audioElement) {
      this._audioElement.pause();
      this._audioElement.currentTime = 0;
      this._audioElement = null;
    }
    this._playQueue = [];
    this._currentPanelIndex = -1;
    this._setState(DemoBar.STATES.VISIBLE);
    this._eventBus.emit('playback:stopped');
  }

  /**
   * 播放完成
   * @private
   */
  _onPlaybackComplete() {
    this._audioElement = null;
    this._playQueue = [];
    this._currentPanelIndex = -1;
    this._setState(DemoBar.STATES.VISIBLE);
    this._eventBus.emit('playback:complete');
  }

  /**
   * 设置状态
   * @private
   */
  _setState(state) {
    this._state = state;
    
    // 更新UI
    const isPlaying = state === DemoBar.STATES.PLAYING;
    const isPaused = state === DemoBar.STATES.PAUSED;
    const isVisible = state === DemoBar.STATES.VISIBLE;
    const isHidden = state === DemoBar.STATES.HIDDEN;

    this._elements.playBtn.style.display = isVisible ? 'flex' : 'none';
    this._elements.pauseBtn.style.display = isPlaying ? 'flex' : 'none';
    this._elements.resumeBtn.style.display = isPaused ? 'flex' : 'none';
    this._elements.stopBtn.style.display = (isPlaying || isPaused) ? 'flex' : 'none';
    this._elements.statusSection.style.display = (isPlaying || isPaused) ? 'block' : 'none';

    this._container.classList.toggle('dashstory-bar--hidden', isHidden);

    this._eventBus.emit('state:changed', { state });
  }

  /**
   * 更新状态显示
   * @private
   */
  _updateStatus(panel) {
    const isZh = this._config.language === 'zh';
    this._elements.statusPanel.textContent = `${isZh ? '正在播放' : 'Playing'}: ${panel.title}`;
    this._elements.statusTime.textContent = '--:--';
  }

  /**
   * 更新进度
   * @private
   */
  _updateProgress() {
    if (!this._audioElement) return;

    const { currentTime, duration } = this._audioElement;
    const progress = (currentTime / duration) * 100;
    
    this._elements.progressBar.style.width = `${progress}%`;
    this._elements.statusTime.textContent = `${this._formatTime(currentTime)} / ${this._formatTime(duration)}`;
  }

  /**
   * 格式化时间
   * @private
   */
  _formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 显示错误
   * @private
   */
  _showError(message) {
    this._elements.errorMessage.textContent = message;
    this._elements.errorSection.style.display = 'flex';
    this._setState(DemoBar.STATES.VISIBLE);
  }

  /**
   * 隐藏错误
   * @private
   */
  _hideError() {
    this._elements.errorSection.style.display = 'none';
  }

  /**
   * 显示Bar
   */
  show() {
    this._setState(DemoBar.STATES.VISIBLE);
    this._updatePanelSelect();
  }

  /**
   * 隐藏Bar
   */
  hide() {
    this.stop();
    this._setState(DemoBar.STATES.HIDDEN);
  }

  /**
   * 切换显示状态
   */
  toggle() {
    if (this._state === DemoBar.STATES.HIDDEN) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * 设置语音
   */
  setVoice(voiceId) {
    this._selectedVoice = voiceId;
    this._elements.voiceSelect.value = voiceId;
  }

  /**
   * 设置速度
   */
  setSpeed(speed) {
    this._playbackSpeed = speed;
    this._elements.speedSelect.value = speed.toString();
    if (this._audioElement) {
      this._audioElement.playbackRate = speed;
    }
  }

  /**
   * 销毁
   */
  destroy() {
    this.stop();
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._container = null;
    this._elements = {};
  }
}

export default DemoBar;
