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
      console.log('Attempting Railway login...');
      const response = await base44.functions.invoke('loginRailway', {
        email: 'darren@holmgraphics.ca',
        password: 'changeme123'
      });
      
      console.log('Login response:', response);
      console.log('Login response.data:', response.data);
      console.log('Login response.data.data:', response.data.data);
      
      // The loginRailway function returns { success: true, data: result }
      // where result contains the token
      const token = response.data.data?.token;
      console.log('Token received:', token ? 'Yes' : 'No');
      
      if (!token) {
        throw new Error('No token received from Railway login');
      }
      
      localStorage.setItem(TOKEN_KEY, token);
      return token;
    } catch (error) {
      console.error('Railway login failed:', error);
      console.error('Login error details:', error.response);
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