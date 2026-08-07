export const API_URL = 'https://my-church-12.onrender.com'
export const SOCKET_URL = 'https://my-church-12.onrender.com'

export const API_ROUTES = {
  auth: {
    login:    `${API_URL}/auth/login`,
    me:       `${API_URL}/auth/me`,
  },
} as const