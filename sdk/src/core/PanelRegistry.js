/**
 * PanelRegistry - Panel数据注册中心
 * 管理Panel元数据与数据快照
 */
export class PanelRegistry {
  /**
   * @param {EventBus} eventBus - 事件总线实例
   */
  constructor(eventBus) {
    this._panels = new Map();
    this._eventBus = eventBus;
    this._updateQueue = [];
    this._debounceTimer = null;
    this._debounceInterval = 1000; // 1秒防抖
  }

  /**
   * 必填字段
   * @private
   */
  static REQUIRED_FIELDS = ['panelId', 'title', 'metricType', 'unit', 'data', 'timeRange'];

  /**
   * 可选字段
   * @private
   */
  static OPTIONAL_FIELDS = ['description', 'dimension', 'aggregation', 'thresholds', 'owner', 'order'];

  /**
   * 注册Panel
   * @param {Object} panelData - Panel数据
   * @returns {string} panelId
   */
  register(panelData) {
    this._validatePanel(panelData);
    
    const { panelId } = panelData;
    
    if (this._panels.has(panelId)) {
      console.warn(`[PanelRegistry] Panel "${panelId}" already exists, updating instead`);
      this.update(panelId, panelData);
      return panelId;
    }

    const panel = {
      ...panelData,
      _registeredAt: Date.now(),
      _updatedAt: Date.now()
    };

    this._panels.set(panelId, panel);
    this._eventBus.emit('panel:registered', { panelId, panel });
    
    return panelId;
  }

  /**
   * 更新Panel数据
   * @param {string} panelId - Panel ID
   * @param {Object} data - 新数据
   */
  update(panelId, data) {
    if (!this._panels.has(panelId)) {
      throw new Error(`[PanelRegistry] Panel "${panelId}" not found`);
    }

    const existingPanel = this._panels.get(panelId);
    const updatedPanel = {
      ...existingPanel,
      ...data,
      panelId, // 保持原panelId不变
      _updatedAt: Date.now()
    };

    this._panels.set(panelId, updatedPanel);
    this._queueUpdate(panelId);
  }

  /**
   * 批量更新（带防抖）
   * @param {Array<Object>} updates - 更新数组
   */
  batchUpdate(updates) {
    updates.forEach(update => {
      if (this._panels.has(update.panelId)) {
        const existingPanel = this._panels.get(update.panelId);
        this._panels.set(update.panelId, {
          ...existingPanel,
          ...update,
          _updatedAt: Date.now()
        });
        this._updateQueue.push(update.panelId);
      }
    });
    
    this._debouncedEmitUpdate();
  }

  /**
   * 移除Panel
   * @param {string} panelId - Panel ID
   */
  remove(panelId) {
    if (this._panels.has(panelId)) {
      this._panels.delete(panelId);
      this._eventBus.emit('panel:removed', { panelId });
    }
  }

  /**
   * 获取Panel
   * @param {string} panelId - Panel ID
   * @returns {Object|null}
   */
  get(panelId) {
    return this._panels.get(panelId) || null;
  }

  /**
   * 获取所有Panel
   * @returns {Array<Object>}
   */
  getAll() {
    return Array.from(this._panels.values()).sort((a, b) => {
      // 按order字段排序，未设置的排在最后
      const orderA = a.order ?? Infinity;
      const orderB = b.order ?? Infinity;
      return orderA - orderB;
    });
  }

  /**
   * 获取Panel数量
   * @returns {number}
   */
  count() {
    return this._panels.size;
  }

  /**
   * 检查Panel是否存在
   * @param {string} panelId - Panel ID
   * @returns {boolean}
   */
  has(panelId) {
    return this._panels.has(panelId);
  }

  /**
   * 清除所有Panel
   */
  clear() {
    this._panels.clear();
    this._eventBus.emit('panel:cleared');
  }

  /**
   * 导出所有Panel数据（用于API调用）
   * @returns {Array<Object>}
   */
  export() {
    return this.getAll().map(panel => {
      // 移除内部字段
      const { _registeredAt, _updatedAt, ...exportData } = panel;
      return exportData;
    });
  }

  /**
   * 验证Panel数据
   * @private
   */
  _validatePanel(panelData) {
    const missingFields = PanelRegistry.REQUIRED_FIELDS.filter(
      field => panelData[field] === undefined || panelData[field] === null
    );

    if (missingFields.length > 0) {
      throw new Error(
        `[PanelRegistry] Missing required fields: ${missingFields.join(', ')}`
      );
    }

    // 验证metricType
    const validMetricTypes = ['time_series', 'distribution', 'comparison', 'single_value', 'table'];
    if (!validMetricTypes.includes(panelData.metricType)) {
      throw new Error(
        `[PanelRegistry] Invalid metricType "${panelData.metricType}". Valid types: ${validMetricTypes.join(', ')}`
      );
    }

    // 验证data格式
    if (!Array.isArray(panelData.data) && typeof panelData.data !== 'object') {
      throw new Error('[PanelRegistry] data must be an array or object');
    }
  }

  /**
   * 将更新加入队列
   * @private
   */
  _queueUpdate(panelId) {
    if (!this._updateQueue.includes(panelId)) {
      this._updateQueue.push(panelId);
    }
    this._debouncedEmitUpdate();
  }

  /**
   * 防抖发送更新事件
   * @private
   */
  _debouncedEmitUpdate() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    this._debounceTimer = setTimeout(() => {
      if (this._updateQueue.length > 0) {
        const updatedPanelIds = [...this._updateQueue];
        this._updateQueue = [];
        this._eventBus.emit('panel:updated', { panelIds: updatedPanelIds });
      }
    }, this._debounceInterval);
  }
}

export default PanelRegistry;
