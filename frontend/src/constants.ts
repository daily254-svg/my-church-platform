export const API_URL =
  "https://my-church-12.onrender.com";

export const SOCKET_URL =
  "https://my-church-12.onrender.com";

export const API_ROUTES = {
  auth: {
    register:          `${API_URL}/auth/register`,
    login:             `${API_URL}/auth/login`,
    me:                `${API_URL}/auth/me`,
    roleAvailability:  `${API_URL}/auth/role-availability`,
    pushToken:         `${API_URL}/auth/push-token`,
  },
  sermons: {
    getAll: `${API_URL}/sermons`,
    getById: (id: string) => `${API_URL}/sermons/${id}`,
  },
} as const;