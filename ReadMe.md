# Vocab System Frontend

本前端專案提供一個簡潔的介面，用於：
- 手動貼上英文文章並解析字彙
- 查看歷史文章
- 管理字卡與新增單字定義
	-（可選）透過後端觸發 n8n workflow 自動取得文章與單字
前端使用 Vue 3（Composition API）。

## 功能概要
- 貼上文章並送至後端解析
- 顯示解析後的單字列表（字卡模式）
- 點擊字卡可將該字彙加入字庫
- 手動補充中文釋義
- 載入並瀏覽歷史文章
- 透過按鈕觸發 n8n（若後端有啟用）

## 核心元件
`ArticleReader.vue`

主要頁面，包含：
- 文章輸入區
- 歷史文章列表
- 解析按鈕
- n8n 觸發按鈕
- 字卡列表

`WordCard.vue`
單字卡片元件，包含：
- 單字顯示
- 翻譯揭示
- 手動補充釋義
- 新增字彙至後端 `/api/words`

## API 互動
前端與後端以 REST API 溝通。以下為主要呼叫：
### 解析文章
`POST /api/parse`

### 儲存文章
`POST /api/articles/save`

### 載入歷史文章
```
GET /api/articles/list
GET /api/articles/load/<filename>
```
### 新增／更新字彙
`POST /api/words`

### n8n（可選）
```
POST /api/trigger
GET  /api/job/<job_id>
```

### 本地開發
```
npm install
npm run dev
```

### 預設顯示於：
```
http://localhost:5173
```

## 注意事項
- 前端完全依賴後端提供的資料格式運作
- 若後端新增功能，前端大多不需變動
- n8n 不是必備功能；未啟用時前端照樣正常運作
- 所有字卡互動邏輯集中於 `WordCard.vue`
- 系統目前是能動就好的狀態

## 授權
MIT License.