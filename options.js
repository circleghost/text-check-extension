document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('save');
  if (saveButton) {
    saveButton.addEventListener('click', function() {
      var openaiApiKey = document.getElementById('openai-api-key').value;
      
      chrome.storage.local.set({
        openaiApiKey: openaiApiKey
      }, function() {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        var status = document.getElementById('status');
        status.textContent = 'API 設定已保存。';
        setTimeout(function() {
          status.textContent = '';
        }, 2000);
      });
    });
  }

  // 載入已保存的 API 設定
  chrome.storage.local.get(['openaiApiKey'], function(result) {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
      return;
    }
    if (result.openaiApiKey) {
      document.getElementById('openai-api-key').value = result.openaiApiKey;
    }
  });
});