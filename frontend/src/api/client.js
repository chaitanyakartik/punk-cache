async function api(path, options = {}) {
  const { body, ...rest } = options;
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...rest,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

api.get = (path) => api(path);
api.post = (path, body) => api(path, { method: 'POST', body });
api.put = (path, body) => api(path, { method: 'PUT', body });
api.del = (path) => api(path, { method: 'DELETE' });

// ─── Tracker ──────────────────────────────────────────────────────────────────

api.tracker = {
  getMonth: (yearMonth) => api.get(`/tracker/${yearMonth}`),
  updateRow: (yearMonth, date, values) => api.put(`/tracker/${yearMonth}/row`, { date, ...values }),
  updateColumns: (yearMonth, columns) => api.put(`/tracker/${yearMonth}/columns`, { columns }),
};

// ─── Goals ────────────────────────────────────────────────────────────────────

api.goals = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  logSession: (goalId, { value, note }) => api.post(`/goals/${goalId}/log`, { value, note }),
  addMilestone: (goalId, { label, target, due }) => api.post(`/goals/${goalId}/milestone`, { label, target, due }),
};

export default api;
