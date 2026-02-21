const BASE_URL = 'https://rodeo-fresh-production-7348.up.railway.app/api';

const PUBLIC_ENDPOINTS = {
  GET_EVENTS: '/events',
  GET_PRODUCTS: '/products',
  GET_PRODUCT_BY_ID: '/products/:id',
  CREATE_TICKET_ORDER: '/ticket-orders',
  GET_TICKET_BY_CONFIRMATION: '/ticket-orders/confirmation/:code',
  CREATE_ORDER: '/orders',
  LOGIN: '/auth/login',
};

const ADMIN_ENDPOINTS = {
  GET_STAFF: '/staff',
  GET_SHIFTS: '/shifts',
  GET_DASHBOARD_STATS: '/dashboard/stats',
  SCAN_TICKET: '/ticket-orders/:id/scan',
};

async function railwayRequest(endpoint, options = {}) {
  const { method = 'GET', body = null, token = null, params = {} } = options;

  let url = `${BASE_URL}${endpoint}`;
  
  // Replace path parameters
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  console.log(`[Railway Request] ${method} ${url}`);
  console.log('[Request Body]', body ? JSON.stringify(body) : 'none');
  console.log('[Auth Header]', headers['Authorization']);
  console.log('[Token Received]', token);

  const response = await fetch(url, config);

  console.log('[Response Status]', response.status);
  console.log('[Response OK]', response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Railway Error] ${response.status}: ${errorText}`);
    console.error('[Full URL Called]', url);
    console.error('[Request Body Sent]', body ? JSON.stringify(body) : 'none');
    throw new Error(`Railway API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

export { BASE_URL, PUBLIC_ENDPOINTS, ADMIN_ENDPOINTS, railwayRequest };