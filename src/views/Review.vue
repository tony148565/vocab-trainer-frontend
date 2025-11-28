<template>
  <div class="review">
    <h2>Review Mode</h2>

    <div v-if="!currentWord" class="empty">
      <p>目前沒有可複習的單字。</p>
      <button @click="fetchRandom">開始複習</button>
    </div>

    <div v-else class="review-area">
      <!-- 單字卡 (唯讀模式) -->
      <WordCard
        :word="currentWord.word"
        :definition="revealed ? currentWord.definition : ''"
        :api-base="API_BASE"
        :readonly="true"
      />

      <!-- 控制按鈕 -->
      <div class="controls">
        <button
          v-if="!revealed"
          class="btn-remember"
          @click="markRemembered(true)"
        >
          ✅ 我記得
        </button>
        <button
          v-if="!revealed"
          class="btn-forget"
          @click="markRemembered(false)"
        >
          ❌ 我忘了
        </button>
        <button
          v-if="revealed"
          class="btn-next"
          @click="fetchRandom"
        >
          ➡ 下一題
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import WordCard from '../components/WordCard.vue'

const API_BASE = 'http://127.0.0.1:5000'
const currentWord = ref(null)
const revealed = ref(false)

// 抽取隨機單字
const fetchRandom = async () => {
  revealed.value = false
  try {
    const res = await fetch(`${API_BASE}/api/random`)
    const data = await res.json()
    if (data.error) {
      currentWord.value = null
    } else {
      currentWord.value = data
    }
  } catch (err) {
    console.error('隨機抽字失敗', err)
    currentWord.value = null
  }
}

// 標記複習結果
const markRemembered = async (remembered) => {
  if (!currentWord.value) return

  if (!remembered) {
    // 若使用者忘了 → 顯示中文釋義（但不立即切換）
    revealed.value = true
  }

  try {
    await fetch(`${API_BASE}/api/review/${currentWord.value.word}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remembered }),
    })
  } catch (err) {
    console.error('更新複習狀態失敗', err)
  }

  if (remembered) {
    // 若記得 → 自動換下一題
    fetchRandom()
  }
}

// 初始化
fetchRandom()
</script>

<style scoped>
.review {
  padding: 1rem;
  text-align: center;
}

.empty {
  margin-top: 2rem;
}

.review-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.controls {
  display: flex;
  gap: 10px;
}

button {
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.btn-remember {
  background: #4caf50;
  color: #fff;
}
.btn-forget {
  background: #e53935;
  color: #fff;
}
.btn-next {
  background: #2196f3;
  color: #fff;
}
</style>
