import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import { refreshAuth } from './auth';
import './styles.css';

refreshAuth().finally(() => {
  createApp(App).use(router).mount('#app');
});
