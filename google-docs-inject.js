(function() {
    let floatingButton = null;
  
    function createFloatingButton() {
        console.log('createFloatingButton 被調用');
        if (floatingButton) {
          console.log('按鈕已存在，不需要重新創建');
          return;
        }
      
        floatingButton = document.createElement('button');
        floatingButton.textContent = '校正';
        floatingButton.className = 'correction-floating-button';
        floatingButton.style.position = 'fixed';
        floatingButton.style.zIndex = '9999';
        floatingButton.style.display = 'none';
        floatingButton.addEventListener('click', handleCorrection);
        document.body.appendChild(floatingButton);
        console.log('按鈕已創建並添加到 body');
      }
  
    function showFloatingButton(event) {
        console.log('showFloatingButton 被調用');
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
        console.log('handleTextSelection 被調用');
        const selection = document.getSelection();
        if (selection && selection.toString().trim().length > 0) {
            console.log('有文字被選中');
            showFloatingButton(event);
        } else {
            console.log('沒有文字被選中');
            hideFloatingButton();
        }
    }
    
    document.addEventListener('mouseup', handleTextSelection);
  
    function handleCorrection() {
      const selectedText = document.getSelection().toString().trim();
      if (selectedText.length > 0) {
        window.postMessage({ type: "FROM_PAGE", text: selectedText }, "*");
      }
    }
  
    document.addEventListener('selectionchange', handleTextSelection);
    console.log('Google Docs 注入腳本已載入');
  })();