console.log('Background script 已載入');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息：', request);
  if (request.action === "correctText") {
    chrome.storage.local.get(['openaiApiKey'], async (result) => {
      if (chrome.runtime.lastError) {
        console.error('獲取 API 設置時發生錯誤：', chrome.runtime.lastError);
        sendResponse({error: '獲取 API 設置時發生錯誤'});
        return;
      }

      const apiKey = result.openaiApiKey;

      if (!apiKey) {
        sendResponse({error: '未設置 OpenAI API 金鑰，請在選項頁面中設置。'});
        return;
      }

      try {
        callOpenAiApi(request.text, apiKey, sender.tab.id);
        sendResponse({status: 'streaming'});
      } catch (error) {
        console.error('API 調用錯誤：', error);
        sendResponse({error: error.toString()});
      }
    });
    return true;  // 保持消息通道開啟
  }
});

chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name === "correctionStream");
  port.onDisconnect.addListener(function() {
    console.log("Port disconnected");
  });
});

async function callOpenAiApi(text, apiKey, tabId) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {role: "system", content: "你是一名專業的臺灣繁體中文雜誌編輯，幫我檢查給定內容的錯字及語句文法。"},
          {role: "user", content: `請將以下文字複寫，中文語法正確並改掉錯字。\n\n<text>\n${text}\n</text>`}
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            chrome.tabs.sendMessage(tabId, {done: true});
            return;
          }
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0].delta.content;
            if (content) {
              chrome.tabs.sendMessage(tabId, {content: content});
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
            chrome.tabs.sendMessage(tabId, {error: "解析 API 回應時發生錯誤"});
          }
        }
      }
    }
  } catch (error) {
    console.error('API 調用錯誤：', error);
    chrome.tabs.sendMessage(tabId, {error: error.toString()});
  }
}