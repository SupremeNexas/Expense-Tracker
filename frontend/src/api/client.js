const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('fintech_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('fintech_token', token);
  } else {
    localStorage.removeItem('fintech_token');
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized (e.g., clear token)
      setToken(null);
      // Let the app know we are unauthorized by throwing a specific error
      throw new Error('UNAUTHORIZED');
    }
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  getMe: () => request('/auth/me'),
  updateCurrency: (currency) => request('/auth/currency', { method: 'PUT', body: { currency } }),

  // Expenses
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/expenses${query ? `?${query}` : ''}`);
  },
  getExpense: (id) => request(`/expenses/${id}`),
  createExpense: (data) => request('/expenses', { method: 'POST', body: data }),
  updateExpense: (id, data) => request(`/expenses/${id}`, { method: 'PUT', body: data }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/budgets${query ? `?${query}` : ''}`);
  },
  createBudget: (data) => request('/budgets', { method: 'POST', body: data }),
  deleteBudget: (id) => request(`/budgets/${id}`, { method: 'DELETE' }),

  // Subscriptions
  getSubscriptions: () => request('/subscriptions'),
  createSubscription: (data) => request('/subscriptions', { method: 'POST', body: data }),
  updateSubscription: (id, data) => request(`/subscriptions/${id}`, { method: 'PUT', body: data }),
  deleteSubscription: (id) => request(`/subscriptions/${id}`, { method: 'DELETE' }),

  // Credit Cards
  getCreditCards: () => request('/credit_cards'),
  createCreditCard: (data) => request('/credit_cards', { method: 'POST', body: data }),
  updateCreditCard: (id, data) => request(`/credit_cards/${id}`, { method: 'PUT', body: data }),
  deleteCreditCard: (id) => request(`/credit_cards/${id}`, { method: 'DELETE' }),

  // Bills
  getBills: () => request('/bills'),
  createBill: (data) => request('/bills', { method: 'POST', body: data }),
  updateBill: (id, data) => request(`/bills/${id}`, { method: 'PUT', body: data }),
  deleteBill: (id) => request(`/bills/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals: () => request('/goals'),
  createGoal: (data) => request('/goals', { method: 'POST', body: data }),
  updateGoal: (id, data) => request(`/goals/${id}`, { method: 'PUT', body: data }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),

  // Analytics
  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/analytics/summary${query ? `?${query}` : ''}`);
  },
  getByCategory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/analytics/by-category${query ? `?${query}` : ''}`);
  },
  getTrend: () => request('/analytics/trend'),
  getBudgetStatus: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/analytics/budget-status${query ? `?${query}` : ''}`);
  },

  // Insights
  getInsights: () => request('/insights'),

  // Groups
  getGroups: () => request('/groups'),
  createGroup: (data) => request('/groups', { method: 'POST', body: data }),
  getGroupDetails: (id) => request(`/groups/${id}`),
  addGroupMember: (id, data) => request(`/groups/${id}/members`, { method: 'POST', body: data }),
  addGroupExpense: (id, data) => request(`/groups/${id}/expenses`, { method: 'POST', body: data }),
  addGroupSettlement: (id, data) => request(`/groups/${id}/settlements`, { method: 'POST', body: data }),
};
