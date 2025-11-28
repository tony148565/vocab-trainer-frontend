<template>
  <div>
    <h1>Vocabulary Trainer</h1>
    <nav>
      <router-link to="/">閱讀文章</router-link> |
      <router-link to="/pool">字彙庫</router-link> |
      <router-link to="/review">複習模式</router-link>
    </nav>
    <router-view />
  </div>
</template>

<style scoped>
nav {
  margin-bottom: 1rem;
}
nav a {
  margin: 0 0.5rem;
  text-decoration: none;
}
</style>
