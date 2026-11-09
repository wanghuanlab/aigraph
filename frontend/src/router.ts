import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import WorkspaceView from './views/WorkspaceView.vue';
import TheoryWorkspace from './views/TheoryWorkspace.vue';
import MaterialsView from './views/MaterialsView.vue';
import AccountView from './views/AccountView.vue';
import AdminView from './views/AdminView.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/workspace/:id', name: 'workspace', component: WorkspaceView },
    { path: '/theory/:id', name: 'theory', component: TheoryWorkspace },
    { path: '/materials', name: 'materials', component: MaterialsView },
    { path: '/account', name: 'account', component: AccountView },
    { path: '/admin', name: 'admin', component: AdminView },
  ],
});
