/**
 * DashStory Extension - Background Service Worker
 * 处理与后端API通信、截图处理、音频管理
 */

// API配置
const API_CONFIG = {
  endpoint: 'http://localhost:8000/api/v1',
  timeout: 30000
};

// 存储键
const STORAGE_KEYS = {
  API_KEY: 'dashstory_api_key',
  LANGUAGE: 'dashstory_language',
  HISTORY: 'dashstory_history',
  SETTINGS: 'dashstory_settings'
};

/**
 * 初始化
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[DashStory] Extension installed');
  
  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'dashstory-capture',
    title: 'DashStory - 截图解读',
    contexts: ['page', 'image']
  });

  // 初始化默认设置
  const settings = await getSettings();
  if (!settings) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: {
        language: 'zh',
        voiceId: 'professional',
        autoPlay: true
      }
    });
  }
});

/**
 * 监听右键菜单点击
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'dashstory-capture') {
    await captureAndInterpret(tab);
  }
});

/**
 * 监听快捷键命令
 */
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (command === 'capture-area') {
    await sendToContent(tab.id, { action: 'startAreaCapture' });
  } else if (command === 'capture-full') {
    await captureAndInterpret(tab);
  }
});

/**
 * 监听来自popup和content script的消息
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    sendResponse({ error: err.message });
  });
  return true; // 保持消息通道打开
});

/**
 * 消息处理
 */
async function handleMessage(message, sender) {
  const { action, data } = message;

  switch (action) {
    case 'captureVisibleTab':
      return await captureVisibleTab();

    case 'captureArea':
      return await captureArea(data);

    case 'interpretImage':
      return await interpretImage(data);

    case 'getHistory':
      return await getHistory();

    case 'clearHistory':
      return await clearHistory();

    case 'saveToHistory':
      return await saveToHistory(data);

    case 'getSettings':
      return await getSettings();

    case 'saveSettings':
      return await saveSettings(data);

    case 'validateApiKey':
      return await validateApiKey(data.apiKey);

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * 截图可见区域
 */
async function captureVisibleTab() {
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });
    return { success: true, dataUrl };
  } catch (error) {
    console.error('[DashStory] Capture failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 截图指定区域
 */
async function captureArea(data) {
  const { x, y, width, height } = data;
  
  try {
    // 先截取整个可见区域
    const fullCapture = await chrome.tabs.captureVisibleTab(null, {
      format: 'png',
      quality: 100
    });

    // 裁剪指定区域
    const croppedDataUrl = await cropImage(fullCapture, x, y, width, height);
    return { success: true, dataUrl: croppedDataUrl };
  } catch (error) {
    console.error('[DashStory] Area capture failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 裁剪图片
 */
async function cropImage(dataUrl, x, y, width, height) {
  // 创建离屏canvas
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  ctx.drawImage(bitmap, x, y, width, height, 0, 0, width, height);
  
  const croppedBlob = await canvas.convertToBlob({ type: 'image/png' });
  const reader = new FileReader();
  
  return new Promise((resolve) => {
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(croppedBlob);
  });
}

/**
 * 调用多模态识别API
 */
async function interpretImage(data) {
  const { imageData, pageUrl, language } = data;
  const settings = await getSettings();
  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new Error('请先设置API Key');
  }

  try {
    const response = await fetch(`${API_CONFIG.endpoint}/vision/interpret`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        image: imageData,
        pageUrl: pageUrl,
        language: language || settings.language || 'zh'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    // 保存到历史记录
    await saveToHistory({
      ...result,
      imageData,
      pageUrl,
      timestamp: Date.now()
    });

    return result;
  } catch (error) {
    console.error('[DashStory] Interpret failed:', error);
    throw error;
  }
}

/**
 * 截图并解读（完整流程）
 */
async function captureAndInterpret(tab) {
  try {
    // 1. 截图
    const captureResult = await captureVisibleTab();
    if (!captureResult.success) {
      throw new Error(captureResult.error);
    }

    // 2. 发送到content script显示处理中状态
    await sendToContent(tab.id, {
      action: 'showProcessing',
      data: { imageData: captureResult.dataUrl }
    });

    // 3. 调用API解读
    const result = await interpretImage({
      imageData: captureResult.dataUrl,
      pageUrl: tab.url
    });

    // 4. 发送结果到content script
    await sendToContent(tab.id, {
      action: 'showResult',
      data: result
    });

    return result;
  } catch (error) {
    await sendToContent(tab.id, {
      action: 'showError',
      data: { message: error.message }
    });
    throw error;
  }
}

/**
 * 获取历史记录
 */
async function getHistory() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.HISTORY);
  return result[STORAGE_KEYS.HISTORY] || [];
}

/**
 * 保存到历史记录（最多20条）
 */
async function saveToHistory(item) {
  const history = await getHistory();
  
  // 添加新记录
  history.unshift({
    id: Date.now().toString(),
    ...item
  });

  // 限制数量
  if (history.length > 20) {
    history.splice(20);
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: history });
  return { success: true };
}

/**
 * 清除历史记录
 */
async function clearHistory() {
  await chrome.storage.local.set({ [STORAGE_KEYS.HISTORY]: [] });
  return { success: true };
}

/**
 * 获取设置
 */
async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return result[STORAGE_KEYS.SETTINGS] || null;
}

/**
 * 保存设置
 */
async function saveSettings(settings) {
  await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  return { success: true };
}

/**
 * 获取API Key
 */
async function getApiKey() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEY);
  return result[STORAGE_KEYS.API_KEY] || null;
}

/**
 * 验证API Key
 */
async function validateApiKey(apiKey) {
  try {
    const response = await fetch(`${API_CONFIG.endpoint}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      // 保存有效的API Key
      await chrome.storage.local.set({ [STORAGE_KEYS.API_KEY]: apiKey });
      return { valid: true };
    }
    return { valid: false, error: 'Invalid API Key' };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * 发送消息到content script
 */
async function sendToContent(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.error('[DashStory] Send to content failed:', error);
  }
}
