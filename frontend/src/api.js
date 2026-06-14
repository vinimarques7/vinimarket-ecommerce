const getHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

async function request(url, options = {}) {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || `Erro ${res.status}`)
  return data
}

export const api = {
  // Users
  register: (body) =>
    request('/users/register', { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }),
  login: (body) =>
    request('/users/login', { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }),
  getUser: (id, token) =>
    request(`/users/${id}`, { headers: getHeaders(token) }),

  // Products
  getProducts: ()        => request('/products'),
  getProduct:  (id)      => request(`/products/${id}`),
  createProduct: (body, token) =>
    request('/products', { method: 'POST', headers: getHeaders(token), body: JSON.stringify(body) }),
  updateProduct: (id, body, token) =>
    request(`/products/${id}`, { method: 'PUT', headers: getHeaders(token), body: JSON.stringify(body) }),

  // Orders
  createOrder: (body, token) =>
    request('/orders', { method: 'POST', headers: getHeaders(token), body: JSON.stringify(body) }),
  getUserOrders: (userId, token) =>
    request(`/orders/${userId}`, { headers: getHeaders(token) }),
  deleteOrder: (orderId, token) =>
    fetch(`/orders/${orderId}`, { method: 'DELETE', headers: getHeaders(token) }).then(r => {
      if (!r.ok && r.status !== 204) throw new Error(`Erro ${r.status}`)
    }),

  // Gateway status
  getStatus: () => request('/status'),
}
