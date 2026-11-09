import { reactive } from 'vue';
import { api, type PublicUser } from './api';

export const auth = reactive<{ user: PublicUser | null; ready: boolean }>({ user: null, ready: false });

export async function refreshAuth() {
  try {
    const result = await api.me();
    auth.user = result.user;
  } catch {
    auth.user = null;
  } finally {
    auth.ready = true;
  }
}
