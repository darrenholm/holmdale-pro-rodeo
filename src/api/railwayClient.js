/**
 * railwayClient.js — Direct Railway API Client
 * Replaces @base44/sdk and railwayAuth.jsx
 * 
 * Usage:
 *   import { api, entities } from '@/api/railwayClient';
 *   
 *   // Direct API calls
 *   const events = await api.get('/events');
 *   const result = await api.post('/ticket-orders', { ... });
 *   
 *   // Entity helpers (same patterns as base44.entities.*)
 *   const tickets = await entities.TicketOrder.list();
 *   const ticket  = await entities.TicketOrder.create({ ... });
 */

const RAILWAY_API_URL = import.meta.env.VITE_RAILWAY_API_URL 
  || 'https://rodeo-fresh-production-7348.up.railway.app/api';

const TOKEN_KEY = 'railway_auth_token';
const AUTH_EMAIL = 'darren@holmgraphics.ca';
const AUTH_PASSWORD = 'changeme123';

// ─── Core API Client ────────────────────────────────────────

class RailwayClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  async login() {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD })
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    const token = data.token;
    
    if (!token) {
      throw new Error('No token received');
    }

    this.setToken(token);
    return token;
  }

  async request(endpoint, options = {}) {
    const { method = 'GET', body = null, retry = true } = options;

    let token = this.getToken();
    if (!token) {
      token = await this.login();
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    const config = { method, headers };
    if (body) {
      config.body = JSON.stringify(body);
    }

    let response = await fetch(`${this.baseUrl}${endpoint}`, config);

    // If unauthorized, re-login and retry once
    if ((response.status === 401 || response.status === 403) && retry) {
      this.clearToken();
      token = await this.login();
      headers['Authorization'] = `Bearer ${token}`;
      config.headers = headers;
      response = await fetch(`${this.baseUrl}${endpoint}`, config);
    }

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`Railway API error: ${response.status}`);
      error.status = response.status;
      error.details = errorText;
      throw error;
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) return null;
    
    return await response.json();
  }

  // Convenience methods
  get(endpoint) { 
    return this.request(endpoint); 
  }
  
  post(endpoint, body) { 
    return this.request(endpoint, { method: 'POST', body }); 
  }
  
  put(endpoint, body) { 
    return this.request(endpoint, { method: 'PUT', body }); 
  }
  
  patch(endpoint, body) { 
    return this.request(endpoint, { method: 'PATCH', body }); 
  }
  
  delete(endpoint) { 
    return this.request(endpoint, { method: 'DELETE' }); 
  }
}

// ─── Entity Helpers ─────────────────────────────────────────
// These replicate the base44.entities.* API so page changes are minimal

function createEntityHelper(client, basePath) {
  return {
    async list(sort, limit) {
      let url = basePath;
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', limit);
      const qs = params.toString();
      if (qs) url += `?${qs}`;
      return client.get(url);
    },

    async filter(filters) {
      let url = basePath;
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        params.set(key, value);
      });
      const qs = params.toString();
      if (qs) url += `?${qs}`;
      return client.get(url);
    },

    async getById(id) {
      return client.get(`${basePath}/${id}`);
    },

    async create(data) {
      return client.post(basePath, data);
    },

    async bulkCreate(items) {
      return client.post(`${basePath}/bulk`, items);
    },

    async update(id, data) {
      return client.put(`${basePath}/${id}`, data);
    },

    async delete(id) {
      return client.delete(`${basePath}/${id}`);
    }
  };
}

// ─── Singleton Instances ────────────────────────────────────

const api = new RailwayClient(RAILWAY_API_URL);

const entities = {
  TicketOrder: createEntityHelper(api, '/ticket-orders'),
  Staff:       createEntityHelper(api, '/staff'),
  Shift:       createEntityHelper(api, '/shifts'),
  BarPurchase: createEntityHelper(api, '/bar-credits'),
  Product:     createEntityHelper(api, '/products'),
  Event:       createEntityHelper(api, '/events'),
  Order:       createEntityHelper(api, '/orders'),
};

// ─── Legacy Compatibility ───────────────────────────────────
// Mimics base44.functions.invoke() for gradual migration
// This lets pages that use railwayAuth.callWithAuth() keep working

const functions = {
  async invoke(functionName, params = {}) {
    // Map old function names to direct API calls
    const FUNCTION_MAP = {
      // Direct GET endpoints
      'getEventsFromRailway':          () => api.get('/events'),
      'getProductsFromRailway':        () => api.get('/products'),
      'getProductByIdRailway':         () => api.get(`/products/${params.id}`),
      'getShiftsFromRailway':          () => api.get('/shifts'),
      'getStaffFromRailway':           () => api.get('/staff'),
      'getDashboardStatsRailway':      () => api.get('/dashboard/stats'),
      'getTicketByConfirmationRailway':() => api.get(`/ticket-orders/confirmation/${params.code}`),
      
      // Ticket operations
      'getTicketFromRailway':          () => api.get(`/ticket-orders?rfid_tag_id=${params.rfid_tag_id}`),
      'scanTicketRailway':             () => api.post(`/ticket-orders/${params.id}/scan`, params),
      'searchTickets':                 () => api.post('/ticket-orders/search', params),
      'searchRefundableTickets':       () => api.post('/ticket-orders/search-refundable', params),
      'insertTicketToRailway':         () => api.post('/ticket-orders', params),
      'lookupTicketOrder':             () => api.post('/ticket-orders/lookup', params),
      'manualConfirmTicket':           () => api.post(`/ticket-orders/${params.id}/confirm`, params),
      
      // Events
      'createEventRailway':            () => api.post('/events', params),
      'updateEventRailway':            () => api.put(`/events/${params.id}`, params),
      'deleteEventRailway':            () => api.delete(`/events/${params.id}`),
      'getEventCurrentTier':           () => api.get(`/events/${params.eventId}/tier`),
      'getEventTierData':              () => api.get(`/events/${params.eventId}/tier-data`),
      'updateEventPrices':             () => api.put(`/events/${params.id}/prices`, params),
      'fixEventPrices':                () => api.post('/events/fix-prices', params),
      
      // Staff
      'assignStaffToShift':            () => api.post(`/shifts/${params.shiftId}/assign`, params),
      'createEventShifts':             () => api.post('/shifts/create-for-event', params),
      'importStaffFromSQL':            () => api.post('/staff/import', params),
      
      // Moneris / Payments (these need server-side routes)
      'createTicketCheckoutMoneris':   () => api.post('/moneris/ticket-checkout', params),
      'createBarTokenCheckout':        () => api.post('/moneris/bar-checkout', params),
      'createMerchandiseCheckout':     () => api.post('/moneris/merch-checkout', params),
      'refundTicket':                  () => api.post('/moneris/refund', params),
      
      // Email
      'handleTicketPaymentSuccess':    () => api.post('/email/ticket-confirmation', params),
      'sendTicketConfirmation':        () => api.post('/email/send-confirmation', params),
      'resendTicketEmail':             () => api.post('/email/resend-ticket', params),
      'testSimpleEmail':               () => api.post('/email/test', params),
      
      // Reports
      'getTodayTicketSales':           () => api.get('/reports/today-sales'),
      
      // Shipping
      'getShippingRates':              () => api.post('/shipping/rates', params),
      'createShipment':                () => api.post('/shipping/create', params),
      'trackShipment':                 () => api.get(`/shipping/track/${params.tracking_number}`),

      // Ticket quantity fixes
      'fixTicketQuantity':             () => api.post('/ticket-orders/fix-quantity', params),
    };

    const fn = FUNCTION_MAP[functionName];
    if (!fn) {
      console.warn(`Unknown function: ${functionName}. Attempting direct POST to /${functionName}`);
      return { data: await api.post(`/${functionName}`, params) };
    }

    // Wrap response to match old { data: ... } format
    const result = await fn();
    return { data: result };
  }
};

// ─── Exports ────────────────────────────────────────────────

export { api, entities, functions };

// Default export mimics the old base44 client shape for minimal page changes
export default { api, entities, functions };
