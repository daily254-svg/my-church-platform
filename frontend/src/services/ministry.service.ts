import { API_URL } from '../constants'

export const ministryService = { 
  getAll: async (token: string) => {
    const response = await fetch(`${API_URL}/ministry`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const json = await response.json()
    if (!response.ok) throw new Error(json.message || 'Failed to fetch ministry groups')
    return json.data
  },

  getMyGroups: async (token: string) => {
    const response = await fetch(`${API_URL}/ministry/my`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const json = await response.json()
    if (!response.ok) throw new Error(json.message || 'Failed to fetch my groups')
    return json.data
  },

  join: async (groupId: string, token: string) => {
    const response = await fetch(`${API_URL}/ministry/${groupId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const json = await response.json()
    if (!response.ok) throw new Error(json.message || 'Failed to join group')
    return json.data
  },

  leave: async (groupId: string, token: string) => {
    const response = await fetch(`${API_URL}/ministry/${groupId}/leave`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const json = await response.json()
    if (!response.ok) throw new Error(json.message || 'Failed to leave group')
    return json.data
  },

  getMessages: async (groupId: string, token: string) => {
    const response = await fetch(`${API_URL}/ministry/${groupId}/messages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const json = await response.json()
    if (!response.ok) throw new Error(json.message || 'Failed to fetch messages')
    return json.data
  },

  sendMessage: async (groupId: string, text: string, token: string) => {
    const response = await fetch(`${API_URL}/ministry/${groupId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    })

    const json = await response.json()
    if (!response.ok) throw new Error(json.message || 'Failed to send message')
    return json.data
  },
}
