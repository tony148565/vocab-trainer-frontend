<template>
  <div class="popup">
    <h3>{{ word }}</h3>
    <p>{{ definition }}</p>
    <button @click="$emit('add')">加入字彙庫</button>
    <button @click="$emit('close')">關閉</button>
  </div>
</template>

<script setup>
defineProps({ word: String, definition: String });
</script>

<style scoped>
.popup {
  position: fixed;
  top: 30%;
  left: 40%;
  background: white;
  border: 1px solid #ccc;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
</style>
