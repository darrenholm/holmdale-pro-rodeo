/**
 * railwayAuth.jsx — COMPATIBILITY SHIM
 * 
 * Preserves the old `railwayAuth.callWithAuth('functionName', params)` API
 * but now routes through the new railwayClient directly.
 */

import { api, functions } from '@/api/railwayClient';

const TOKEN_KEY = 'railway_auth_token';

export const railwayAuth = {
  async getToken() {
    let token = api.getToken();
    if (!token) {
      token = await api.login();
    }
    return token;
  },

  async login() {
    return await api.login();
  },

  async callWithAuth(functionName, params = {}) {
    const result = await functions.invoke(functionName, params);
    return result;
  },

  clearToken() {
    api.clearToken();
  }
};