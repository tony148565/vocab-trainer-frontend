import { defineStore } from 'pinia'

const API_BASE = 'http://127.0.0.1:5000'

export const useWordStore = defineStore('wordStore', {
  state: () => ({
    words: JSON.parse(localStorage.getItem('words') || '[]'),
    loading: false,
  }),

  actions: {
    // 從後端載入
    async loadWords() {
      this.loading = true
      try {
        const res = await fetch(`${API_BASE}/api/words`)
        this.words = await res.json()
        this.saveLocal()
      } catch (err) {
        console.error('載入字彙庫失敗', err)
      } finally {
        this.loading = false
      }
    },

    // 新增或更新單字
    async addWord(word, definition = '') {
      try {
        const res = await fetch(`${API_BASE}/api/words`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word, definition }),
        })

        if (!res.ok) throw new Error('HTTP Error')

        // 後端會自動判斷是 created or updated
        const existing = this.words.find(w => w.word === word)
        if (existing) {
          existing.definition = definition || existing.definition
        } else {
          this.words.push({ word, definition, reviewed: 0 })
        }

        this.saveLocal()
      } catch (err) {
        console.error('寫入字彙庫失敗', err)
      }
    },

    // 刪除單字
    async deleteWord(word) {
      try {
        const res = await fetch(`${API_BASE}/api/words/${word}`, { method: 'DELETE' })
        if (res.ok) {
          this.words = this.words.filter(w => w.word !== word)
          this.saveLocal()
        }
      } catch (err) {
        console.error('刪除單字失敗', err)
      }
    },

    // 隨機抽一字
    randomWord() {
      return this.words.length
        ? this.words[Math.floor(Math.random() * this.words.length)]
        : null
    },

    // 儲存至 localStorage（快取）
    saveLocal() {
      localStorage.setItem('words', JSON.stringify(this.words))
    },
  },
})
