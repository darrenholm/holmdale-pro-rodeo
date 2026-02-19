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
      console.log('Error in callWithAuth:', error);
      console.log('Error status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      
      // Check for authentication errors (401 or 500 with 403/401 message)
      const status = error.response?.status;
      const errorMessage = error.response?.data?.error || error.message || '';
      
      const isAuthError = status === 401 || 
                         status === 500 && (errorMessage.includes('403') || errorMessage.includes('401') || errorMessage.includes('Unauthorized'));
      
      if (isAuthError) {
        console.log('Token invalid/expired, re-authenticating...');
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