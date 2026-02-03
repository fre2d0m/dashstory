/**
 * DataNormalizer - 数据标准化处理器
 * 统一时间序列、分布、对比类数据格式
 */
export class DataNormalizer {
  constructor() {
    this._processors = new Map();
    this._initProcessors();
  }

  /**
   * 初始化各类型数据处理器
   * @private
   */
  _initProcessors() {
    // 时间序列数据处理
    this._processors.set('time_series', this._normalizeTimeSeries.bind(this));
    // 分布数据处理
    this._processors.set('distribution', this._normalizeDistribution.bind(this));
    // 对比数据处理
    this._processors.set('comparison', this._normalizeComparison.bind(this));
    // 单值数据处理
    this._processors.set('single_value', this._normalizeSingleValue.bind(this));
    // 表格数据处理
    this._processors.set('table', this._normalizeTable.bind(this));
  }

  /**
   * 标准化Panel数据
   * @param {Object} panelData - 原始Panel数据
   * @returns {Object} 标准化后的数据
   */
  normalize(panelData) {
    const { metricType, data } = panelData;
    
    const processor = this._processors.get(metricType);
    if (!processor) {
      console.warn(`[DataNormalizer] Unknown metricType: ${metricType}, using raw data`);
      return panelData;
    }

    const normalizedData = processor(data, panelData);
    
    return {
      ...panelData,
      data: normalizedData,
      _normalized: true,
      _normalizedAt: Date.now()
    };
  }

  /**
   * 标准化时间序列数据
   * @private
   */
  _normalizeTimeSeries(data, context) {
    if (!Array.isArray(data)) {
      return this._convertObjectToTimeSeries(data);
    }

    return data.map((point, index) => {
      // 支持多种输入格式
      if (typeof point === 'object') {
        return {
          t: point.t || point.time || point.timestamp || point.date || index,
          v: this._parseNumericValue(point.v || point.value || point.y || 0),
          label: point.label || null,
          metadata: point.metadata || {}
        };
      }
      // 纯数值数组
      return {
        t: index,
        v: this._parseNumericValue(point),
        label: null,
        metadata: {}
      };
    }).sort((a, b) => {
      // 按时间排序
      if (typeof a.t === 'string' && typeof b.t === 'string') {
        return a.t.localeCompare(b.t);
      }
      return a.t - b.t;
    });
  }

  /**
   * 标准化分布数据
   * @private
   */
  _normalizeDistribution(data, context) {
    if (!Array.isArray(data)) {
      // 对象格式转数组
      return Object.entries(data).map(([category, value]) => ({
        category,
        value: this._parseNumericValue(value),
        percentage: null // 后续计算
      }));
    }

    const normalized = data.map(item => {
      if (typeof item === 'object') {
        return {
          category: item.category || item.name || item.label || 'Unknown',
          value: this._parseNumericValue(item.value || item.v || item.count || 0),
          percentage: item.percentage || null
        };
      }
      return {
        category: 'Unknown',
        value: this._parseNumericValue(item),
        percentage: null
      };
    });

    // 计算百分比
    const total = normalized.reduce((sum, item) => sum + item.value, 0);
    if (total > 0) {
      normalized.forEach(item => {
        if (item.percentage === null) {
          item.percentage = Number(((item.value / total) * 100).toFixed(2));
        }
      });
    }

    return normalized;
  }

  /**
   * 标准化对比数据
   * @private
   */
  _normalizeComparison(data, context) {
    if (!Array.isArray(data)) {
      return this._convertObjectToComparison(data);
    }

    return data.map(item => {
      const current = this._parseNumericValue(item.current || item.value || item.v || 0);
      const previous = this._parseNumericValue(item.previous || item.baseline || item.compare || 0);
      const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;

      return {
        name: item.name || item.label || item.metric || 'Metric',
        current,
        previous,
        change: Number(change.toFixed(2)),
        changeType: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'unchanged',
        unit: item.unit || context.unit || ''
      };
    });
  }

  /**
   * 标准化单值数据
   * @private
   */
  _normalizeSingleValue(data, context) {
    if (typeof data === 'object' && !Array.isArray(data)) {
      return {
        value: this._parseNumericValue(data.value || data.v || 0),
        previousValue: data.previousValue || data.previous || null,
        target: data.target || null,
        status: this._computeStatus(data, context),
        trend: data.trend || null,
        sparkline: data.sparkline || null
      };
    }

    return {
      value: this._parseNumericValue(data),
      previousValue: null,
      target: null,
      status: 'normal',
      trend: null,
      sparkline: null
    };
  }

  /**
   * 标准化表格数据
   * @private
   */
  _normalizeTable(data, context) {
    if (!Array.isArray(data)) {
      return { headers: [], rows: [] };
    }

    if (data.length === 0) {
      return { headers: [], rows: [] };
    }

    // 从第一行提取headers
    const headers = Object.keys(data[0]);
    const rows = data.map(row => {
      return headers.map(header => ({
        key: header,
        value: row[header],
        formatted: this._formatValue(row[header])
      }));
    });

    return { headers, rows };
  }

  /**
   * 对象转时间序列
   * @private
   */
  _convertObjectToTimeSeries(obj) {
    return Object.entries(obj).map(([t, v]) => ({
      t,
      v: this._parseNumericValue(v),
      label: null,
      metadata: {}
    }));
  }

  /**
   * 对象转对比数据
   * @private
   */
  _convertObjectToComparison(obj) {
    return Object.entries(obj).map(([name, values]) => {
      if (typeof values === 'object') {
        return {
          name,
          current: this._parseNumericValue(values.current || 0),
          previous: this._parseNumericValue(values.previous || 0),
          change: 0,
          changeType: 'unchanged',
          unit: values.unit || ''
        };
      }
      return {
        name,
        current: this._parseNumericValue(values),
        previous: 0,
        change: 0,
        changeType: 'unchanged',
        unit: ''
      };
    });
  }

  /**
   * 解析数值
   * @private
   */
  _parseNumericValue(value) {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      // 移除常见格式字符
      const cleaned = value.replace(/[$,￥%\s]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * 计算状态
   * @private
   */
  _computeStatus(data, context) {
    const value = this._parseNumericValue(data.value || data.v || 0);
    const thresholds = context.thresholds || {};

    if (thresholds.critical !== undefined && value <= thresholds.critical) {
      return 'critical';
    }
    if (thresholds.warning !== undefined && value <= thresholds.warning) {
      return 'warning';
    }
    if (thresholds.success !== undefined && value >= thresholds.success) {
      return 'success';
    }
    return 'normal';
  }

  /**
   * 格式化值
   * @private
   */
  _formatValue(value) {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'number') {
      // 大数字格式化
      if (Math.abs(value) >= 1e9) {
        return (value / 1e9).toFixed(2) + 'B';
      }
      if (Math.abs(value) >= 1e6) {
        return (value / 1e6).toFixed(2) + 'M';
      }
      if (Math.abs(value) >= 1e3) {
        return (value / 1e3).toFixed(2) + 'K';
      }
      return value.toFixed(2);
    }
    return String(value);
  }

  /**
   * 添加自定义处理器
   * @param {string} metricType - 指标类型
   * @param {Function} processor - 处理函数
   */
  addProcessor(metricType, processor) {
    this._processors.set(metricType, processor);
  }
}

export default DataNormalizer;
