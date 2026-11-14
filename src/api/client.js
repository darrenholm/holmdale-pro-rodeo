/**
 * client.js — one object for pages that call the rodeo API (Railway).
 * functions.invoke(name, params) and entities.<Table> come from railwayClient.
 */
import { api, entities, functions } from './railwayClient';

export const rodeo = {
  functions,
  entities,
  auth: {
    me: async () => {
      const token = api.getToken();
      if (token) return await api.get('/auth/me');
      throw new Error('Not authenticated');
    },
    logout: () => {
      api.clearToken();
      window.location.href = '/';
    },
    redirectToLogin: () => {
      window.location.href = '/Staff';
    }
  }
};
