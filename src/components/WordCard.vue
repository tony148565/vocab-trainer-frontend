<template>
  <div
    class="word-card"
    :class="{
      revealed: localRevealed,
      selected,
      'no-data-card': localRevealed && !definition,
    }"
    @click="handleCardClick"
  >
    <div class="word">{{ word }}</div>

    <div v-if="localRevealed" class="definition">
      <template v-if="definition && !isEditing">
        {{ definition }}
      </template>

      <template v-else>
        <div v-if="!isEditing" class="no-data">
          （無資料）
          <button
            v-if="!readonly"
            class="edit-btn"
            @click.stop="isEditing = true"
          >
            手動輸入
          </button>
        </div>

        <div v-else class="edit-box" @click.stop>
          <input
            v-model="customDef"
            placeholder="輸入中文釋義..."
            @keyup.enter="saveCustomDef"
          />
          <button class="save-btn" @click="saveCustomDef">儲存</button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  word: { type: String, required: true },
  definition: { type: String, default: '' },
  apiBase: { type: String, required: true },
  readonly: { type: Boolean, default: false },
})

const emit = defineEmits(['added', 'updated'])

const localRevealed = ref(false)
const selected = ref(false)
const isEditing = ref(false)
const customDef = ref('')

// ✅ 若是唯讀模式，由父層控制顯示狀態
watch(
  () => props.definition,
  (newDef) => {
    if (props.readonly) {
      localRevealed.value = newDef && newDef.trim() !== ''
    }
  },
  { immediate: true }
)

// ✅ 點擊揭示釋義（無釋義不入庫）
const handleCardClick = async () => {
  if (props.readonly) return
  if (localRevealed.value) return

  localRevealed.value = true
  selected.value = true

  // ✅ 沒有釋義就不送出 API
  if (!props.definition || props.definition.trim() === '') return

  try {
    await fetch(`${props.apiBase}/api/words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: props.word, definition: props.definition }),
    })
    emit('added', props.word)
  } catch (err) {
    console.error('加入字彙庫失敗', err)
  }
}

// ✅ 手動補充釋義（這部分仍會寫入字彙庫）
const saveCustomDef = async () => {
  if (props.readonly) return
  if (!customDef.value.trim()) return
  try {
    await fetch(`${props.apiBase}/api/words`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: props.word, definition: customDef.value }),
    })
    emit('updated', { word: props.word, definition: customDef.value })
    isEditing.value = false
    selected.value = true
    localRevealed.value = true
  } catch (err) {
    console.error('自訂字義儲存失敗', err)
  }
}
</script>


<style scoped>
.word-card {
  width: 160px;
  min-height: 100px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f8f8f8;
  padding: 10px;
  text-align: center;
  transition: all 0.25s ease;
  user-select: none;
}
.word-card:hover {
  background-color: #eaeaea;
}
.word-card.revealed {
  background-color: #fffef0;
  border-color: #d8b200;
}
.word-card.selected {
  box-shadow: 0 0 10px rgba(255, 193, 7, 0.6);
  border-color: #ffb300;
}
/* ✅ 新增：無資料時灰底 */
.word-card.no-data-card {
  background-color: #eeeeee;
  border-color: #bdbdbd;
}
.word {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}
.definition {
  margin-top: 8px;
  font-size: 13px;
  color: #555;
  white-space: pre-wrap;
}
.no-data {
  color: #999;
}
.edit-box {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}
.edit-box input {
  width: 90%;
  padding: 4px;
  border: 1px solid #bbb;
  border-radius: 4px;
}
.edit-btn,
.save-btn {
  margin-top: 6px;
  padding: 3px 6px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.edit-btn {
  background: #9c27b0;
  color: white;
}
.save-btn {
  background: #4caf50;
  color: white;
}
</style>
