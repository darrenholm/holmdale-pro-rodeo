import { base44 } from '@/api/base44Client';

const TOKEN_KEY = 'railway_auth_token';

export const railwayAuth = {
  async getToken() {
    let token = localStorage.getItem(TOKEN_KEY);
    
    if (!token) {
      token = await this.login();
    }
    
    return token;
  },

  async login() {
    try {
      const response = await base44.functions.invoke('loginRailway', {
        email: 'darren@holmgraphics.ca',
        password: 'changeme123'
      });
      
      const token = response.data.token;
      localStorage.setItem(TOKEN_KEY, token);
      return token;
    } catch (error) {
      console.error('Railway login failed:', error);
      throw error;
    }
  },

  async callWithAuth(functionName, params = {}) {
    let token = await this.getToken();
    
    try {
      const response = await base44.functions.invoke(functionName, {
        ...params,
        token
      });
      return response.data;
    } catch (error) {
      // If 403, token expired - re-login and retry
      if (error.response?.status === 500 && error.response?.data?.error?.includes('403')) {
        console.log('Token expired, re-logging in...');
        localStorage.removeItem(TOKEN_KEY);
        token = await this.login();
        
        const response = await base44.functions.invoke(functionName, {
          ...params,
          token
        });
        return response.data;
      }
      throw error;
    }
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }
};