/**
 * EventBus - 事件总线
 * 提供发布/订阅模式的事件管理
 */
export class EventBus {
  constructor() {
    this._events = new Map();
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消订阅函数
   */
  on(event, callback) {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event).add(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  /**
   * 一次性订阅事件
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  once(event, callback) {
    const wrapper = (...args) => {
      this.off(event, wrapper);
      callback.apply(this, args);
    };
    this.on(event, wrapper);
  }

  /**
   * 取消订阅事件
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this._events.has(event)) {
      this._events.get(event).delete(callback);
    }
  }

  /**
   * 发布事件
   * @param {string} event - 事件名
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    if (this._events.has(event)) {
      this._events.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventBus] Error in event handler for "${event}":`, error);
        }
      });
    }
  }

  /**
   * 清除所有事件
   */
  clear() {
    this._events.clear();
  }

  /**
   * 获取事件监听器数量
   * @param {string} event - 事件名
   * @returns {number}
   */
  listenerCount(event) {
    return this._events.has(event) ? this._events.get(event).size : 0;
  }
}

export default EventBus;
