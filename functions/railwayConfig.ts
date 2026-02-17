// Railway Backend Configuration
const RAILWAY_API_URL = 'https://rodeo-fresh-production.up.railway.app';

// Public endpoints (no auth required)
export const PUBLIC_ENDPOINTS = {
  events: '/api/events',
  eventById: (id) => `/api/events/${id}`,
  products: '/api/products',
  productById: (id) => `/api/products/${id}`,
  createTicketOrder: '/api/ticket-orders',
  getTicketByConfirmation: (code) => `/api/ticket-orders/confirmation/${code}`,
  createOrder: '/api/orders',
  login: '/api/auth/login',
};

// Admin endpoints (require authentication)
export const ADMIN_ENDPOINTS = {
  staff: '/api/staff',
  shifts: '/api/shifts',
  dashboardStats: '/api/dashboard/stats',
  scanTicket: (id) => `/api/ticket-orders/${id}/scan`,
};

// Make a request to Railway API
export const railwayRequest = async (endpoint, options = {}) => {
  const url = `${RAILWAY_API_URL}${endpoint}`;
  const {
    method = 'GET',
    body = null,
    token = null,
    headers = {},
  } = options;

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Add auth token if provided
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`Railway API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`Railway request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
};

export default {
  RAILWAY_API_URL,
  PUBLIC_ENDPOINTS,
  ADMIN_ENDPOINTS,
  railwayRequest,
};