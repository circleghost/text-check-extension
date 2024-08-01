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
  const prompt = `你是一名專業的臺灣繁體中文雜誌編輯，幫我檢查給定內容的錯字及語句文法。請特別注意以下規則：
1. 中文與英文之間，中文與數字之間應有空格，例如 FLAC，JPEG，Google Search Console 等。
2. 以下情況不需調整：
   - 括弧內的說明，例如（圖一）、（加入產品圖示）。
   - 阿拉伯數字不用調整成中文。
   - 英文不一定要翻譯成中文。
   - emoji 或特殊符號是為了增加閱讀體驗，也不必調整。
3. 請保留原文的段落和換行格式。
4. 請不要使用額外的 Markdown 語法。
5. 請仔細審視給定的文字，將冗詞、語法錯誤進行修改。`;

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
          {role: "system", content: prompt},
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

    // ... 其餘代碼保持不變

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