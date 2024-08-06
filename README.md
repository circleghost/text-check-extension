# 文字校正與比較工具

這是一個 Chrome 擴展程式,用於校正選中的文字並顯示比較結果。它特別適用於中文文本的校正,並支持 Google Docs 和 Google Slides。

## 功能

- 選取網頁上的文字,點擊浮動按鈕進行校正
- 支持 Google Docs 和 Google Slides 中的文字校正
- 使用 OpenAI API 進行智能文字校正
- 顯示原文與校正後文字的對比結果
- 支持一鍵複製校正後的文字

## 安裝

1. 下載此專案的 ZIP 檔案並解壓縮
2. 在 Chrome 瀏覽器中,前往 `chrome://extensions/`
3. 開啟右上角的「開發人員模式」
4. 點擊「載入未封裝項目」,選擇解壓縮後的資料夾

## 使用方法

1. 在擴展程式的選項頁面中設置您的 OpenAI API 金鑰
2. 在網頁上選取要校正的文字
3. 點擊出現的「校正」按鈕
4. 在彈出的視窗中查看校正結果
5. 可以選擇複製校正後的文字

## 檔案結構

- `manifest.json`: 擴展程式的配置文件
- `background.js`: 背景腳本,處理 API 請求
- `content.js`: 內容腳本,處理網頁上的交互
- `google-docs-inject.js`: 注入到 Google Docs 和 Slides 的腳本
- `options.html` 和 `options.js`: 選項頁面
- `popup.html` 和 `popup.js`: 彈出視窗
- `content-styles.css`: 樣式文件

## 開發

本擴展程式使用原生 JavaScript 開發,無需額外的構建步驟。如需修改,直接編輯相應的文件即可。

## 注意事項

- 請確保您有有效的 OpenAI API 金鑰
- 在 Google Docs 和 Slides 中使用時,可能需要重新整理頁面以使擴展程式生效

## 授權

[MIT License](LICENSE)