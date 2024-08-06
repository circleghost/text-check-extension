let floatingButton = null;
let correctionWindow = null;

if (window.location.hostname === 'docs.google.com' || window.location.hostname === 'slides.google.com') {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('google-docs-inject.js');
  document.head.appendChild(script);

  window.addEventListener("message", function(event) {
    if (event.source != window) return;
    if (event.data.type && (event.data.type == "FROM_PAGE")) {
      handleCorrection(event.data.text);
    }
  }, false);
} else {
  document.addEventListener('mouseup', handleTextSelection);
}

function createFloatingButton() {
  if (floatingButton) return;

  floatingButton = document.createElement('button');
  floatingButton.textContent = '校正';
  floatingButton.className = 'correction-floating-button';
  floatingButton.addEventListener('click', handleCorrection);
  document.body.appendChild(floatingButton);
}

function showFloatingButton(event) {
  if (!floatingButton) createFloatingButton();

  const x = event.clientX || window.innerWidth / 2;
  const y = event.clientY || window.innerHeight / 2;

  console.log(`按鈕位置：x=${x}, y=${y}`);
  floatingButton.style.left = `${x}px`;
  floatingButton.style.top = `${y}px`;
  floatingButton.style.display = 'block';
  console.log('按鈕應該已顯示');
}

function hideFloatingButton() {
  if (floatingButton) floatingButton.style.display = 'none';
}

function handleTextSelection(event) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (!range.collapsed) {
      showFloatingButton(event);
    } else {
      hideFloatingButton();
    }
  }
}

function handleCorrection() {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText.length > 0) {
    if (correctionWindow && !correctionWindow.closed) {
      correctionWindow.focus();
    } else {
      const windowFeatures = 'width=600,height=400,resizable=yes,scrollbars=yes,status=no,location=no,menubar=no,toolbar=no';
      correctionWindow = window.open('', '_blank', windowFeatures);
      correctionWindow.document.write(`
        <html>
        <head>
          <title>文字校正結果</title>
          <link rel="stylesheet" href="${chrome.runtime.getURL('content-styles.css')}">
        </head>
        <body>
          <div class="correction-window">
            <h2>文字校正結果</h2>
            <div id="result">正在處理中...</div>
          </div>
        </body>
        </html>
      `);
      correctionWindow.document.close();
    }
    correctText(selectedText);
  }
}

function correctText(text) {
  chrome.runtime.sendMessage({action: "correctText", text: text}, function(response) {
    if (chrome.runtime.lastError) {
      showError('錯誤：' + chrome.runtime.lastError.message);
      return;
    }
    if (response.error) {
      showError(response.error);
      return;
    }
    
    let correctedText = "";
    const messageListener = function(msg) {
      if (msg.error) {
        showError(msg.error);
      } else if (msg.done) {
        const finalComparison = compareTextHtml(text, correctedText);
        updateCorrectionWindow(finalComparison, correctedText, true);
        chrome.runtime.onMessage.removeListener(messageListener);
      } else if (msg.content) {
        correctedText += msg.content;
        const comparison = compareTextHtml(text, correctedText);
        updateCorrectionWindow(comparison, correctedText, false);
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
  });
}

function showError(errorMessage) {
  if (correctionWindow && !correctionWindow.closed) {
    const resultElement = correctionWindow.document.getElementById('result');
    if (resultElement) {
      resultElement.innerHTML = `<p style="color: red;">${errorMessage}</p>`;
    }
  }
}

function updateCorrectionWindow(comparison, correctedText, isDone) {
  if (correctionWindow && !correctionWindow.closed) {
    const resultElement = correctionWindow.document.getElementById('result');
    if (resultElement) {
      resultElement.innerHTML = `
        <h3>校正結果：</h3>
        <div id="corrected-text">${comparison.replace(/\n/g, '<br>')}</div>
        ${isDone ? '<button id="copy-button">複製校正後的文字</button>' : ''}
      `;
      
      if (isDone) {
        const copyButton = correctionWindow.document.getElementById('copy-button');
        copyButton.addEventListener('click', function() {
          correctionWindow.navigator.clipboard.writeText(correctedText).then(() => {
            correctionWindow.alert('文字已複製到剪貼簿！');
          }).catch(err => {
            console.error('複製失敗：', err);
            correctionWindow.alert('複製失敗，請手動複製文字。');
          });
        });
      }
    }
  }
}

function compareTextHtml(text1, text2) {
  const diff = Diff.diffChars(text1, text2);
  let result = '';
  
  for (let part of diff) {
    if (part.added) {
      result += `<span class="ins">${part.value}</span>`;
    } else if (part.removed) {
      result += `<span class="del">${part.value}</span>`;
    } else {
      result += part.value;
    }
  }
  
  return result;
}

// 載入 diff 庫
const script = document.createElement('script');
script.src = chrome.runtime.getURL('lib/diff.min.js');
script.onload = function() {
    console.log('Diff library loaded');
};
document.head.appendChild(script);

console.log('Content script 已載入');