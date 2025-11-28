<template>
  <div class="word-list">
    <h2>字彙庫</h2>

    <div class="toolbar">
      <button @click="loadWords">重新載入</button>
      <button @click="toggleSort">
        排序：{{ sortOrder === 'desc' ? '由多到少' : '由少到多' }}
      </button>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜尋英文單字..."
        class="search-box"
      />
      <button @click="exportWords('json')">匯出 JSON</button>
      <button @click="exportWords('csv')">匯出 CSV</button>
      <label class="import-btn">
        匯入字彙庫
        <input type="file" accept=".json,.csv" @change="importWords" hidden />
      </label>
    </div>

    <div v-if="loading" class="loading">載入中...</div>

    <div v-if="!loading && filteredWords.length === 0" class="empty">
      沒有符合的結果
    </div>

    <table v-if="!loading && filteredWords.length > 0">
      <thead>
        <tr>
          <th>英文單字</th>
          <th>中文釋義</th>
          <th @click="toggleSort" style="cursor: pointer;">
            複習次數 <span>{{ sortOrder === 'desc' ? '▼' : '▲' }}</span>
          </th>
          <th>出現次數</th>
          <th>出現比例 (%)</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in filteredWords" :key="index">
          <td class="word">{{ item.word }}</td>
          <td class="definition">{{ item.definition }}</td>
          <td class="reviewed">{{ item.reviewed ?? 0 }}</td>
          <td class="count">{{ item.count ?? 0 }}</td>
          <td class="ratio">{{ item.ratio }}</td>
          <td>
            <button class="delete-btn" @click="deleteWord(item.word)">刪除</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const API_BASE = 'http://127.0.0.1:5000'
const words = ref([])
const loading = ref(false)
const sortOrder = ref('desc')
const searchQuery = ref('')
const totalCount = ref(0)

const loadWords = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/api/words`)
    const data = await res.json()
    const total = data.reduce((acc, w) => acc + (w.count || 0), 0)
    totalCount.value = total || 1
    words.value = data.map(w => ({
      ...w,
      ratio: ((w.count || 0) / totalCount.value * 100).toFixed(2)
    }))
  } catch (err) {
    console.error('載入字彙庫失敗', err)
  } finally {
    loading.value = false
  }
}

const filteredWords = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const order = sortOrder.value === 'asc' ? 1 : -1
  return [...words.value]
    .filter(w => !q || w.word.toLowerCase().includes(q))
    .sort((a, b) => {
      const ra = a.reviewed ?? 0
      const rb = b.reviewed ?? 0
      return (ra - rb) * order
    })
})

const toggleSort = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}

const deleteWord = async (word) => {
  if (!confirm(`確定刪除 "${word}"？`)) return
  try {
    const res = await fetch(`${API_BASE}/api/words/${word}`, { method: 'DELETE' })
    if (res.ok) {
      words.value = words.value.filter(w => w.word !== word)
    }
  } catch (err) {
    console.error('刪除失敗', err)
  }
}

const exportWords = async (format = 'json') => {
  try {
    const res = await fetch(`${API_BASE}/api/export?format=${format}`)
    if (!res.ok) {
      alert(`匯出失敗 (${res.status})`)
      return
    }

    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = format === 'csv' ? 'words.csv' : 'words.json'
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('匯出錯誤', err)
    alert('匯出失敗')
  }
}


// 匯入 JSON / CSV
const importWords = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  const form = new FormData()
  form.append('file', file)

  try {
    const res = await fetch(`${API_BASE}/api/import`, { method: 'POST', body: form })
    const result = await res.json()

    if (!res.ok) {
      alert(`❌ 匯入失敗 (${res.status})：${result.error}`)
      return
    }

    alert(`✅ 匯入完成：新增 ${result.added} 筆，更新 ${result.updated} 筆，略過 ${result.skipped} 筆`)
    await loadWords()
  } catch (err) {
    alert(`❌ 匯入錯誤：${err}`)
  } finally {
    event.target.value = ''
  }
}

onMounted(loadWords)
</script>

<style scoped>
.word-list {
  padding: 1rem;
}

.toolbar {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.search-box {
  width: 180px;
  padding: 6px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.import-btn {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.import-btn:hover {
  background-color: #2980b9;
}

.loading {
  color: gray;
  margin: 1rem 0;
}

.empty {
  color: #888;
  margin: 1rem 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

th, td {
  border: 1px solid #ccc;
  padding: 6px 10px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}

.word {
  font-weight: 600;
}

.definition {
  white-space: pre-wrap;
}

.reviewed, .count, .ratio {
  text-align: center;
  width: 100px;
}

.delete-btn {
  background-color: #e74c3c;
  border: none;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.delete-btn:hover {
  background-color: #c0392b;
}
</style>
