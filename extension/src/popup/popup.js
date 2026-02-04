/**
 * DashStory Extension - Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 元素引用
  const elements = {
    mainView: document.getElementById('mainView'),
    settingsView: document.getElementById('settingsView'),
    apiKeyAlert: document.getElementById('apiKeyAlert'),
    settingsBtn: document.getElementById('settingsBtn'),
    backBtn: document.getElementById('backBtn'),
    goToSettings: document.getElementById('goToSettings'),
    captureAreaBtn: document.getElementById('captureAreaBtn'),
    captureFullBtn: document.getElementById('captureFullBtn'),
    historyList: document.getElementById('historyList'),
    historyEmpty: document.getElementById('historyEmpty'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    apiKeyInput: document.getElementById('apiKeyInput'),
    apiKeyHint: document.getElementById('apiKeyHint'),
    validateApiKeyBtn: document.getElementById('validateApiKeyBtn'),
    languageSelect: document.getElementById('languageSelect'),
    voiceSelect: document.getElementById('voiceSelect'),
    autoPlayCheckbox: document.getElementById('autoPlayCheckbox'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn')
  };

  // 初始化
  await init();

  /**
   * 初始化
   */
  async function init() {
    // 加载设置
    await loadSettings();
    // 加载历史
    await loadHistory();
    // 检查API Key
    await checkApiKey();
    // 绑定事件
    bindEvents();
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 设置按钮
    elements.settingsBtn.addEventListener('click', showSettings);
    elements.backBtn.addEventListener('click', hideSettings);
    elements.goToSettings?.addEventListener('click', showSettings);

    // 截图按钮
    elements.captureAreaBtn.addEventListener('click', captureArea);
    elements.captureFullBtn.addEventListener('click', captureFull);

    // 清空历史
    elements.clearHistoryBtn.addEventListener('click', clearHistory);

    // API Key验证
    elements.validateApiKeyBtn.addEventListener('click', validateApiKey);

    // 保存设置
    elements.saveSettingsBtn.addEventListener('click', saveSettings);
  }

  /**
   * 加载设置
   */
  async function loadSettings() {
    const response = await chrome.runtime.sendMessage({ action: 'getSettings' });
    if (response) {
      elements.languageSelect.value = response.language || 'zh';
      elements.voiceSelect.value = response.voiceId || 'professional';
      elements.autoPlayCheckbox.checked = response.autoPlay !== false;
    }
  }

  /**
   * 检查API Key
   */
  async function checkApiKey() {
    const result = await chrome.storage.local.get('dashstory_api_key');
    const hasApiKey = !!result.dashstory_api_key;
    
    elements.apiKeyAlert.style.display = hasApiKey ? 'none' : 'block';
    
    if (hasApiKey) {
      elements.apiKeyInput.value = result.dashstory_api_key;
    }
  }

  /**
   * 加载历史记录
   */
  async function loadHistory() {
    const history = await chrome.runtime.sendMessage({ action: 'getHistory' });
    
    if (!history || history.length === 0) {
      elements.historyEmpty.style.display = 'block';
      return;
    }

    elements.historyEmpty.style.display = 'none';
    
    // 清空现有内容（除了empty提示）
    const existingItems = elements.historyList.querySelectorAll('.history-item');
    existingItems.forEach(item => item.remove());

    // 渲染历史记录
    history.forEach(item => {
      const historyItem = createHistoryItem(item);
      elements.historyList.appendChild(historyItem);
    });
  }

  /**
   * 创建历史记录项
   */
  function createHistoryItem(item) {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <div class="history-item__thumb">
        <img src="${item.imageData}" alt="">
      </div>
      <div class="history-item__content">
        <div class="history-item__title">${item.summary || '解读结果'}</div>
        <div class="history-item__time">${formatTime(item.timestamp)}</div>
      </div>
    `;
    
    div.addEventListener('click', () => {
      // 点击查看详情
      showHistoryDetail(item);
    });
    
    return div;
  }

  /**
   * 格式化时间
   */
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
      return '刚刚';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * 显示历史详情
   */
  function showHistoryDetail(item) {
    // 发送到content script显示
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'showResult',
          data: item
        });
        window.close();
      }
    });
  }

  /**
   * 区域截图
   */
  async function captureArea() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { action: 'startAreaCapture' });
      window.close();
    }
  }

  /**
   * 整页截图
   */
  async function captureFull() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      // 显示处理中
      const result = await chrome.runtime.sendMessage({ action: 'captureVisibleTab' });
      
      if (result.success) {
        // 发送到content显示处理中
        await chrome.tabs.sendMessage(tab.id, {
          action: 'showProcessing',
          data: { imageData: result.dataUrl }
        });

        // 调用解读
        try {
          const interpretResult = await chrome.runtime.sendMessage({
            action: 'interpretImage',
            data: {
              imageData: result.dataUrl,
              pageUrl: tab.url
            }
          });

          await chrome.tabs.sendMessage(tab.id, {
            action: 'showResult',
            data: interpretResult
          });
        } catch (error) {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'showError',
            data: { message: error.message }
          });
        }
      }
      
      window.close();
    }
  }

  /**
   * 清空历史
   */
  async function clearHistory() {
    if (confirm('确定要清空所有解读记录吗？')) {
      await chrome.runtime.sendMessage({ action: 'clearHistory' });
      await loadHistory();
    }
  }

  /**
   * 验证API Key
   */
  async function validateApiKey() {
    const apiKey = elements.apiKeyInput.value.trim();
    
    if (!apiKey) {
      showApiKeyHint('请输入API Key', 'error');
      return;
    }

    elements.validateApiKeyBtn.disabled = true;
    elements.validateApiKeyBtn.textContent = '验证中...';

    try {
      const result = await chrome.runtime.sendMessage({
        action: 'validateApiKey',
        data: { apiKey }
      });

      if (result.valid) {
        showApiKeyHint('✓ API Key有效', 'success');
        elements.apiKeyAlert.style.display = 'none';
      } else {
        showApiKeyHint('✗ ' + (result.error || 'API Key无效'), 'error');
      }
    } catch (error) {
      showApiKeyHint('✗ 验证失败: ' + error.message, 'error');
    } finally {
      elements.validateApiKeyBtn.disabled = false;
      elements.validateApiKeyBtn.textContent = '验证';
    }
  }

  /**
   * 显示API Key提示
   */
  function showApiKeyHint(message, type) {
    elements.apiKeyHint.textContent = message;
    elements.apiKeyHint.className = 'form-hint ' + type;
  }

  /**
   * 保存设置
   */
  async function saveSettings() {
    const settings = {
      language: elements.languageSelect.value,
      voiceId: elements.voiceSelect.value,
      autoPlay: elements.autoPlayCheckbox.checked
    };

    await chrome.runtime.sendMessage({
      action: 'saveSettings',
      data: settings
    });

    // 显示保存成功
    elements.saveSettingsBtn.textContent = '已保存';
    setTimeout(() => {
      elements.saveSettingsBtn.textContent = '保存设置';
    }, 1500);
  }

  /**
   * 显示设置页
   */
  function showSettings() {
    elements.mainView.style.display = 'none';
    elements.settingsView.style.display = 'block';
  }

  /**
   * 隐藏设置页
   */
  function hideSettings() {
    elements.settingsView.style.display = 'none';
    elements.mainView.style.display = 'block';
  }
});
