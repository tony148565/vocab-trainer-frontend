<template>
  <div class="article-reader">
    <h2>Article Reader</h2>

    <!-- 區塊：選擇舊文章 -->
    <div class="article-history">
      <button @click="loadArticleList">
        載入歷史文章
      </button>
	  <button @click="startN8N">  <!-- 預留位置，n8n workflow的觸發點 -->
        載入最新文章
      </button>
	  <div v-if="loading">n8n 執行中…</div>
      <select v-if="articles.length" v-model="selectedFile" @change="loadArticle">
        <option value="">選擇已儲存的文章</option>
        <option v-for="(a, i) in articles" :key="i" :value="a.filename">
          {{ a.title }}（{{ a.created_at }}）
        </option>
      </select>
    </div>

    <!-- 區塊：文章輸入 -->
    <textarea
      v-model="text"
      placeholder="貼上文章..."
      class="input-area"
    ></textarea>

    <div class="toolbar">
      <button @click="parseArticle">解析文章</button>
      <button @click="saveArticle">儲存文章</button>
    </div>

    <!-- 區塊：解析結果 -->
    <div v-if="parsedWords.length" class="word-cards">
      <WordCard
        v-for="(item, idx) in parsedWords"
        :key="idx"
        :word="item.word"
        :definition="item.zh || ''"
        :api-base="API_BASE"
        @added="handleAdded"
        @updated="handleUpdated"
      />
    </div>

    <div v-else-if="parsed" class="empty">
      （未偵測到任何單字）
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import WordCard from '../components/WordCard.vue'

const API_BASE = 'http://127.0.0.1:5000'

const text = ref('')
const parsedWords = ref([])
const parsed = ref(false)
const articles = ref([])
const selectedFile = ref('')
const loading = ref(false)
const jobId = ref(null)


/** 統一格式：
 * 手動解析：[{word:"xxx", zh:"xxx"}]
 * n8n 回傳：[{xxx:"中文"}]
 * 全部轉成：{word:"xxx", zh:"中文"}
 */
function normalizeWords(list) {
  return (list || []).map(item => {
    // case A: 後端 parse API 已經是正確格式
    if (item.word) {
      return { word: item.word, zh: item.zh || "" }
    }
    // case B: n8n 回傳是 key-value 字典
    const key = Object.keys(item)[0]
    return { word: key, zh: item[key] || "" }
  })
}


/** Step 1 — 手動解析文章（保留原本流程） **/
const parseArticle = async () => {
  const content = text.value.trim()
  if (!content) return alert('請先貼上文章內容')

  try {
    const res = await fetch(`${API_BASE}/api/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content }),
    })

    const data = await res.json()
    parsedWords.value = normalizeWords(data)
    parsed.value = true

  } catch (err) {
    console.error('解析失敗', err)
  }
}


/** Step 2 — N8N 版本 **/
async function startN8N() {
  loading.value = true

  const res = await fetch(`${API_BASE}/api/trigger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  })

  const data = await res.json()
  console.log("trigger 回應:", data)

  jobId.value = data.job_id
  if (!jobId.value) {
    loading.value = false
    alert("無法取得 job_id")
    return
  }

  await pollJobResult()
}


/** Step 3 — 等待後端 callback **/
async function pollJobResult() {
  while (true) {
    const resp = await fetch(`${API_BASE}/api/job/${jobId.value}`);
    const result = await resp.json();

    if (result.status !== "pending") {
      handleN8NResult(result)
      break
    }
    await new Promise(r => setTimeout(r, 700))
  }
}


/** Step 4 — 接回 n8n 的結果 **/
function handleN8NResult(result) {
  loading.value = false

  // 填入文章
  text.value = result.article.text || ""

  // n8n words → 格式 B → 正規化成格式 A
  parsedWords.value = normalizeWords(result.words)

  parsed.value = true

  console.log("n8n 完整文章:", result.article)
  console.log("n8n 單字:", result.words)
}


/** 儲存文章 **/
const saveArticle = async () => {
  const content = text.value.trim()
  if (!content) return alert('內容為空，無法儲存')

  try {
    const res = await fetch(`${API_BASE}/api/articles/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: content, source: 'manual' }),
    })
    const result = await res.json()
    if (result.status === 'saved') {
      alert(`已儲存：${result.title}`)
      await loadArticleList()
    } else {
      alert('儲存失敗')
    }
  } catch (err) {
    console.error('儲存失敗', err)
  }
}


/** 載入歷史文章列表 **/
const loadArticleList = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/articles/list`)
    const data = await res.json()
    articles.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('無法載入文章列表', err)
  }
}


/** 載入指定文章 **/
const loadArticle = async () => {
  if (!selectedFile.value) return
  try {
    const res = await fetch(`${API_BASE}/api/articles/load/${selectedFile.value}`)
    const data = await res.json()
    text.value = data.text || ''
    parsedWords.value = []
    parsed.value = false
  } catch (err) {
    console.error('載入文章失敗', err)
  }
}


/** 單字事件 **/
const handleAdded = (word) => {
  console.log(`已加入字彙庫：${word}`)
}

const handleUpdated = (payload) => {
  const target = parsedWords.value.find((w) => w.word === payload.word)
  if (target) target.zh = payload.definition
}

</script>



<style scoped>
.article-reader {
  padding: 1rem;
}

.article-history {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0.5rem;
}

.article-history select {
  flex: 1;
  padding: 4px 8px;
  font-size: 14px;
}

.input-area {
  width: 100%;
  height: 150px;
  margin-bottom: 1rem;
  padding: 8px;
  font-size: 14px;
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 1rem;
}

button {
  padding: 6px 12px;
  cursor: pointer;
}

.word-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.empty {
  color: #777;
  margin-top: 1rem;
  font-style: italic;
}
</style>
