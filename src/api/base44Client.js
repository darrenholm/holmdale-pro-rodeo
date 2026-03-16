/**
 * base44Client.js — Compatibility shim
 * Re-exports Railway client with the old base44 interface
 */
import { api, entities, functions } from './railwayClient';

export const base44 = {
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
  },
  appLogs: { logUserInApp: async () => {} },
  asServiceRole: {
    functions: {
      invoke: (name, params) => functions.invoke(name, params)
    }
  }
};
