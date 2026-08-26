const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('fintech_token');
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem('fintech_token', token);
  } else {
    localStorage.removeItem('fintech_token');
  }
}

async function request(endpoint: string, options: any = {}): Promise<any> {
  const url = `${API_BASE}${endpoint}`;
  const token = getToken();
  const workspaceId = localStorage.getItem('fintech_workspace_id');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(workspaceId ? { 'x-workspace-id': workspaceId } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is FormData, delete Content-Type to let fetch set it with the boundary
  if (options.body && options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config: any = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    const message = error.error || error.message || `HTTP ${response.status}`;

    // Only wipe the token + force-logout on 401s from *protected* endpoints.
    // Auth endpoints (login, register, google) return 401 for "wrong password"
    // — we must NOT treat that as a session expiry.
    const isAuthRoute = endpoint.startsWith('/auth/');
    if (response.status === 401 && !isAuthRoute) {
      setToken(null);
      throw new Error('UNAUTHORIZED');
    }

    throw new Error(message);
  }

  return response.json();
}

export const api = {
  // Direct generic request
  request,

  // Auth
  login: (data: any) => request('/auth/login', { method: 'POST', body: data }),
  register: (data: any) => request('/auth/register', { method: 'POST', body: data }),
  googleLogin: (idToken: string, invitedBy?: string | null) => request('/auth/google', { method: 'POST', body: { idToken, invitedBy } }),
  getMe: () => request('/auth/me'),
  updateProfile: (data: any) => request('/auth/profile', { method: 'PUT', body: data }),
  updateCurrency: (currency: string) => request('/auth/currency', { method: 'PUT', body: { currency } }),

  // Expenses
  getExpenses: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/expenses${query ? `?${query}` : ''}`);
  },
  getExpense: (id: string) => request(`/expenses/${id}`),
  createExpense: (data: any) => request('/expenses', { method: 'POST', body: data }),
  updateExpense: (id: string, data: any) => request(`/expenses/${id}`, { method: 'PUT', body: data }),
  deleteExpense: (id: string) => request(`/expenses/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data: any) => request('/categories', { method: 'POST', body: data }),
  updateCategory: (id: string, data: any) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id: string) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Budgets
  getBudgets: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/budgets${query ? `?${query}` : ''}`);
  },
  createBudget: (data: any) => request('/budgets', { method: 'POST', body: data }),
  deleteBudget: (id: string) => request(`/budgets/${id}`, { method: 'DELETE' }),

  // Subscriptions
  getSubscriptions: () => request('/subscriptions'),
  createSubscription: (data: any) => request('/subscriptions', { method: 'POST', body: data }),
  updateSubscription: (id: string, data: any) => request(`/subscriptions/${id}`, { method: 'PUT', body: data }),
  deleteSubscription: (id: string) => request(`/subscriptions/${id}`, { method: 'DELETE' }),

  // Credit Cards
  getCreditCards: () => request('/credit_cards'),
  createCreditCard: (data: any) => request('/credit_cards', { method: 'POST', body: data }),
  updateCreditCard: (id: string, data: any) => request(`/credit_cards/${id}`, { method: 'PUT', body: data }),
  deleteCreditCard: (id: string) => request(`/credit_cards/${id}`, { method: 'DELETE' }),

  // Bills
  getBills: () => request('/bills'),
  createBill: (data: any) => request('/bills', { method: 'POST', body: data }),
  updateBill: (id: string, data: any) => request(`/bills/${id}`, { method: 'PUT', body: data }),
  deleteBill: (id: string) => request(`/bills/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals: () => request('/goals'),
  createGoal: (data: any) => request('/goals', { method: 'POST', body: data }),
  updateGoal: (id: string, data: any) => request(`/goals/${id}`, { method: 'PUT', body: data }),
  deleteGoal: (id: string) => request(`/goals/${id}`, { method: 'DELETE' }),

  // Analytics
  getSummary: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/analytics/summary${query ? `?${query}` : ''}`);
  },
  getByCategory: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/analytics/by-category${query ? `?${query}` : ''}`);
  },
  getTrend: () => request('/analytics/trend'),
  getBudgetStatus: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/analytics/budget-status${query ? `?${query}` : ''}`);
  },

  // Insights
  getInsights: () => request('/insights'),

  // Groups
  getGroups: () => request('/groups'),
  createGroup: (data: any) => request('/groups', { method: 'POST', body: data }),
  getGroupDetails: (id: string) => request(`/groups/${id}`),
  deleteGroup: (id: string) => request(`/groups/${id}`, { method: 'DELETE' }),
  addGroupMember: (id: string, data: any) => request(`/groups/${id}/members`, { method: 'POST', body: data }),
  addGroupExpense: (id: string, data: any) => request(`/groups/${id}/expenses`, { method: 'POST', body: data }),
  addGroupSettlement: (id: string, data: any) => request(`/groups/${id}/settlements`, { method: 'POST', body: data }),

  // Friends
  getFriends: () => request('/friends'),
  getPendingFriends: () => request('/friends/pending'),
  sendFriendRequest: (toUserIdOrEmail: string) => {
    if (toUserIdOrEmail.includes('@')) {
      return request('/friends', { method: 'POST', body: { email: toUserIdOrEmail } });
    } else {
      return request('/friends', { method: 'POST', body: { toUserId: toUserIdOrEmail } });
    }
  },
  acceptFriendRequest: (requestId: string) => request(`/friends/${requestId}/accept`, { method: 'PUT' }),
  rejectFriendRequest: (requestId: string) => request(`/friends/${requestId}/reject`, { method: 'PUT' }),
  removeFriend: (friendshipId: string) => request(`/friends/${friendshipId}`, { method: 'DELETE' }),
};
