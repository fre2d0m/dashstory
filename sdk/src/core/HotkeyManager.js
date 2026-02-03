/**
 * HotkeyManager - 快捷键管理器
 * 快捷键绑定、冲突检测
 */
export class HotkeyManager {
  /**
   * @param {string} hotkey - 快捷键配置 (如 'Ctrl+Shift+D')
   * @param {EventBus} eventBus - 事件总线
   */
  constructor(hotkey, eventBus) {
    this._hotkey = this._parseHotkey(hotkey);
    this._eventBus = eventBus;
    this._callback = null;
    this._boundHandler = this._handleKeydown.bind(this);
    this._isActive = false;
  }

  /**
   * 常见快捷键冲突映射
   * @private
   */
  static COMMON_CONFLICTS = {
    'ctrl+shift+d': ['Chrome DevTools Bookmark'],
    'ctrl+shift+i': ['Chrome DevTools'],
    'ctrl+shift+j': ['Chrome DevTools Console'],
    'ctrl+p': ['Print'],
    'ctrl+s': ['Save'],
    'ctrl+f': ['Find'],
  };

  /**
   * 解析快捷键字符串
   * @private
   */
  _parseHotkey(hotkeyStr) {
    const parts = hotkeyStr.toLowerCase().split('+').map(p => p.trim());
    
    return {
      ctrl: parts.includes('ctrl') || parts.includes('control'),
      alt: parts.includes('alt'),
      shift: parts.includes('shift'),
      meta: parts.includes('meta') || parts.includes('cmd') || parts.includes('command'),
      key: parts.find(p => !['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command'].includes(p)) || ''
    };
  }

  /**
   * 绑定快捷键
   * @param {Function} callback - 触发回调
   */
  bind(callback) {
    if (this._isActive) {
      this.unbind();
    }

    this._callback = callback;
    document.addEventListener('keydown', this._boundHandler);
    this._isActive = true;

    // 检测冲突
    const conflicts = this._checkConflicts();
    if (conflicts.length > 0) {
      console.warn(`[HotkeyManager] Potential conflicts: ${conflicts.join(', ')}`);
      this._eventBus.emit('hotkey:conflict', { hotkey: this._hotkeyToString(), conflicts });
    }

    this._eventBus.emit('hotkey:bound', { hotkey: this._hotkeyToString() });
  }

  /**
   * 解绑快捷键
   */
  unbind() {
    if (this._isActive) {
      document.removeEventListener('keydown', this._boundHandler);
      this._isActive = false;
      this._callback = null;
      this._eventBus.emit('hotkey:unbound');
    }
  }

  /**
   * 更新快捷键
   * @param {string} newHotkey - 新快捷键
   */
  update(newHotkey) {
    const wasActive = this._isActive;
    const callback = this._callback;

    if (wasActive) {
      this.unbind();
    }

    this._hotkey = this._parseHotkey(newHotkey);

    if (wasActive && callback) {
      this.bind(callback);
    }
  }

  /**
   * 处理按键事件
   * @private
   */
  _handleKeydown(event) {
    if (this._matchesHotkey(event)) {
      event.preventDefault();
      event.stopPropagation();
      
      if (this._callback) {
        this._callback();
        this._eventBus.emit('hotkey:triggered', { hotkey: this._hotkeyToString() });
      }
    }
  }

  /**
   * 检测是否匹配快捷键
   * @private
   */
  _matchesHotkey(event) {
    const { ctrl, alt, shift, meta, key } = this._hotkey;

    // macOS上ctrl映射到meta
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlOrMeta = isMac ? (event.metaKey === ctrl) : (event.ctrlKey === ctrl);

    return (
      ctrlOrMeta &&
      event.altKey === alt &&
      event.shiftKey === shift &&
      event.key.toLowerCase() === key
    );
  }

  /**
   * 检查快捷键冲突
   * @private
   */
  _checkConflicts() {
    const hotkeyStr = this._hotkeyToString().toLowerCase();
    return HotkeyManager.COMMON_CONFLICTS[hotkeyStr] || [];
  }

  /**
   * 转换为字符串表示
   * @private
   */
  _hotkeyToString() {
    const parts = [];
    if (this._hotkey.ctrl) parts.push('Ctrl');
    if (this._hotkey.alt) parts.push('Alt');
    if (this._hotkey.shift) parts.push('Shift');
    if (this._hotkey.meta) parts.push('Meta');
    if (this._hotkey.key) parts.push(this._hotkey.key.toUpperCase());
    return parts.join('+');
  }

  /**
   * 获取当前快捷键
   * @returns {string}
   */
  getHotkey() {
    return this._hotkeyToString();
  }

  /**
   * 检查是否激活
   * @returns {boolean}
   */
  isActive() {
    return this._isActive;
  }
}

export default HotkeyManager;
