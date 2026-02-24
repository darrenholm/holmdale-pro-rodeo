/**
 * base44Client.js — COMPATIBILITY SHIM
 * 
 * This file re-exports the new Railway client with the old `base44` interface
 * so all existing pages work without changing their imports.
 * 
 * Old: import { base44 } from '@/api/base44Client';
 *      base44.functions.invoke('xyz', params);
 *      base44.entities.TicketOrder.list();
 * 
 * These all work through this shim → railwayClient.js
 */

import { api, entities, functions } from './railwayClient';

export const base44 = {
  functions,
  entities,
  auth: {
    me: async () => {
      const token = api.getToken();
      if (token) return { role: 'admin' };
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
  // No-op for removed features
  appLogs: {
    logUserInApp: async () => {}
  },
  asServiceRole: {
    functions: {
      invoke: (name, params) => functions.invoke(name, params)
    }
  }
};
