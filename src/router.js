import { createRouter, createWebHistory } from 'vue-router';
import ArticleReader from './views/ArticleReader.vue';
import WordList from './views/WordList.vue';
import Review from './views/Review.vue';

const routes = [
  { path: '/', component: ArticleReader },
  { path: '/pool', component: WordList },
  { path: '/review', component: Review },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
