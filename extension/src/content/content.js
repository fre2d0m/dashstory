/**
 * DashStory Extension - Content Script
 * 页面截取、遮盖、结果展示
 */

(function() {
  'use strict';

  // 状态
  let isCapturing = false;
  let selectionBox = null;
  let startX, startY;
  let overlay = null;
  let resultPanel = null;
  let audioPlayer = null;

  /**
   * 监听来自background的消息
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { action, data } = message;

    switch (action) {
      case 'startAreaCapture':
        startAreaCapture();
        break;
      case 'showProcessing':
        showProcessingPanel(data);
        break;
      case 'showResult':
        showResultPanel(data);
        break;
      case 'showError':
        showErrorPanel(data);
        break;
    }
  });

  /**
   * 开始区域截图
   */
  function startAreaCapture() {
    if (isCapturing) return;
    isCapturing = true;

    // 创建遮罩层
    overlay = document.createElement('div');
    overlay.className = 'dashstory-overlay';
    overlay.innerHTML = `
      <div class="dashstory-overlay__hint">
        拖动选择要截取的区域，ESC取消
      </div>
    `;
    document.body.appendChild(overlay);

    // 监听鼠标事件
    overlay.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
  }

  /**
   * 鼠标按下
   */
  function onMouseDown(e) {
    if (e.button !== 0) return;
    
    startX = e.clientX;
    startY = e.clientY;

    // 创建选择框
    selectionBox = document.createElement('div');
    selectionBox.className = 'dashstory-selection';
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    document.body.appendChild(selectionBox);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  /**
   * 鼠标移动
   */
  function onMouseMove(e) {
    if (!selectionBox) return;

    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  }

  /**
   * 鼠标释放
   */
  async function onMouseUp(e) {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    if (!selectionBox) return;

    const rect = selectionBox.getBoundingClientRect();
    
    // 最小尺寸检查
    if (rect.width < 50 || rect.height < 50) {
      cancelCapture();
      return;
    }

    // 获取设备像素比
    const dpr = window.devicePixelRatio || 1;

    // 清理选择UI
    cleanupCapture();

    // 发送截图请求
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'captureArea',
        data: {
          x: Math.round(rect.left * dpr),
          y: Math.round(rect.top * dpr),
          width: Math.round(rect.width * dpr),
          height: Math.round(rect.height * dpr)
        }
      });

      if (result.success) {
        // 显示处理中
        showProcessingPanel({ imageData: result.dataUrl });
        
        // 调用解读
        const interpretResult = await chrome.runtime.sendMessage({
          action: 'interpretImage',
          data: {
            imageData: result.dataUrl,
            pageUrl: window.location.href
          }
        });
        
        showResultPanel(interpretResult);
      } else {
        showErrorPanel({ message: result.error });
      }
    } catch (error) {
      showErrorPanel({ message: error.message });
    }
  }

  /**
   * 键盘事件
   */
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      cancelCapture();
    }
  }

  /**
   * 取消截图
   */
  function cancelCapture() {
    cleanupCapture();
  }

  /**
   * 清理截图UI
   */
  function cleanupCapture() {
    if (overlay) {
      overlay.removeEventListener('mousedown', onMouseDown);
      overlay.remove();
      overlay = null;
    }
    if (selectionBox) {
      selectionBox.remove();
      selectionBox = null;
    }
    document.removeEventListener('keydown', onKeyDown);
    isCapturing = false;
  }

  /**
   * 显示处理中面板
   */
  function showProcessingPanel(data) {
    removeResultPanel();
    
    resultPanel = createPanel(`
      <div class="dashstory-panel__header">
        <span class="dashstory-panel__title">DashStory</span>
        <button class="dashstory-panel__close" data-action="close">&times;</button>
      </div>
      <div class="dashstory-panel__body">
        <div class="dashstory-panel__preview">
          <img src="${data.imageData}" alt="Screenshot">
        </div>
        <div class="dashstory-panel__loading">
          <div class="dashstory-spinner"></div>
          <p>AI正在分析图表内容...</p>
        </div>
      </div>
    `);
  }

  /**
   * 显示结果面板
   */
  function showResultPanel(data) {
    removeResultPanel();

    const { text, audioUrl, confidence, summary, highlights, risks, nextActions } = data;
    
    resultPanel = createPanel(`
      <div class="dashstory-panel__header">
        <span class="dashstory-panel__title">DashStory - 解读结果</span>
        <button class="dashstory-panel__close" data-action="close">&times;</button>
      </div>
      <div class="dashstory-panel__body">
        ${confidence && confidence < 0.6 ? `
          <div class="dashstory-panel__warning">
            ⚠️ 识别置信度较低，结果仅供参考
          </div>
        ` : ''}
        
        <div class="dashstory-panel__section">
          <h4>📝 摘要</h4>
          <p>${summary || text || '暂无摘要'}</p>
        </div>

        ${highlights && highlights.length > 0 ? `
          <div class="dashstory-panel__section">
            <h4>✨ 亮点</h4>
            <ul>
              ${highlights.map(h => `<li>${h}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${risks && risks.length > 0 ? `
          <div class="dashstory-panel__section">
            <h4>⚠️ 风险提示</h4>
            <ul>
              ${risks.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${nextActions && nextActions.length > 0 ? `
          <div class="dashstory-panel__section">
            <h4>🎯 建议行动</h4>
            <ul>
              ${nextActions.map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${audioUrl ? `
          <div class="dashstory-panel__audio">
            <button class="dashstory-btn dashstory-btn--primary" data-action="play" data-audio="${audioUrl}">
              ▶️ 播放语音解读
            </button>
            <button class="dashstory-btn" data-action="download" data-audio="${audioUrl}">
              ⬇️ 下载音频
            </button>
          </div>
        ` : ''}

        <div class="dashstory-panel__actions">
          <button class="dashstory-btn" data-action="copy">📋 复制文本</button>
        </div>
      </div>
    `);

    // 绑定事件
    bindPanelEvents(data);
  }

  /**
   * 显示错误面板
   */
  function showErrorPanel(data) {
    removeResultPanel();

    resultPanel = createPanel(`
      <div class="dashstory-panel__header dashstory-panel__header--error">
        <span class="dashstory-panel__title">DashStory</span>
        <button class="dashstory-panel__close" data-action="close">&times;</button>
      </div>
      <div class="dashstory-panel__body">
        <div class="dashstory-panel__error">
          <p>❌ ${data.message || '处理失败'}</p>
          <button class="dashstory-btn dashstory-btn--primary" data-action="retry">重试</button>
        </div>
      </div>
    `);

    resultPanel.querySelector('[data-action="retry"]')?.addEventListener('click', () => {
      removeResultPanel();
      startAreaCapture();
    });
  }

  /**
   * 创建面板
   */
  function createPanel(content) {
    const panel = document.createElement('div');
    panel.className = 'dashstory-panel';
    panel.innerHTML = content;
    document.body.appendChild(panel);

    // 关闭按钮
    panel.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      removeResultPanel();
    });

    // 拖动支持
    makeDraggable(panel);

    return panel;
  }

  /**
   * 移除结果面板
   */
  function removeResultPanel() {
    if (resultPanel) {
      resultPanel.remove();
      resultPanel = null;
    }
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer = null;
    }
  }

  /**
   * 绑定面板事件
   */
  function bindPanelEvents(data) {
    // 播放音频
    resultPanel.querySelector('[data-action="play"]')?.addEventListener('click', (e) => {
      const audioUrl = e.target.dataset.audio;
      playAudio(audioUrl, e.target);
    });

    // 下载音频
    resultPanel.querySelector('[data-action="download"]')?.addEventListener('click', (e) => {
      const audioUrl = e.target.dataset.audio;
      downloadAudio(audioUrl);
    });

    // 复制文本
    resultPanel.querySelector('[data-action="copy"]')?.addEventListener('click', () => {
      const text = formatResultText(data);
      navigator.clipboard.writeText(text).then(() => {
        showToast('已复制到剪贴板');
      });
    });
  }

  /**
   * 播放音频
   */
  function playAudio(url, button) {
    if (audioPlayer) {
      audioPlayer.pause();
      if (audioPlayer.src === url) {
        button.textContent = '▶️ 播放语音解读';
        audioPlayer = null;
        return;
      }
    }

    audioPlayer = new Audio(url);
    audioPlayer.play();
    button.textContent = '⏸️ 暂停';

    audioPlayer.addEventListener('ended', () => {
      button.textContent = '▶️ 播放语音解读';
      audioPlayer = null;
    });
  }

  /**
   * 下载音频
   */
  function downloadAudio(url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashstory-narration-${Date.now()}.mp3`;
    a.click();
  }

  /**
   * 格式化结果文本
   */
  function formatResultText(data) {
    let text = `DashStory 解读结果\n${'='.repeat(40)}\n\n`;
    
    if (data.summary) {
      text += `📝 摘要：\n${data.summary}\n\n`;
    }
    
    if (data.highlights?.length) {
      text += `✨ 亮点：\n${data.highlights.map(h => `• ${h}`).join('\n')}\n\n`;
    }
    
    if (data.risks?.length) {
      text += `⚠️ 风险：\n${data.risks.map(r => `• ${r}`).join('\n')}\n\n`;
    }
    
    if (data.nextActions?.length) {
      text += `🎯 建议：\n${data.nextActions.map(a => `• ${a}`).join('\n')}\n\n`;
    }

    text += `\n生成时间：${new Date().toLocaleString()}`;
    return text;
  }

  /**
   * 使面板可拖动
   */
  function makeDraggable(panel) {
    const header = panel.querySelector('.dashstory-panel__header');
    let isDragging = false;
    let offsetX, offsetY;

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      offsetX = e.clientX - panel.offsetLeft;
      offsetY = e.clientY - panel.offsetTop;
      header.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panel.style.left = (e.clientX - offsetX) + 'px';
      panel.style.top = (e.clientY - offsetY) + 'px';
      panel.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      header.style.cursor = 'grab';
    });
  }

  /**
   * 显示Toast提示
   */
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'dashstory-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('dashstory-toast--visible'), 10);
    setTimeout(() => {
      toast.classList.remove('dashstory-toast--visible');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

})();
