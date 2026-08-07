import { API_URL } from '../utils/constants'
import { useAuthStore } from '../store/auth.store'

export const eventService = {
  getAll: async () => {
    const token = useAuthStore.getState().token
    const response = await fetch(`${API_URL}/events`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const json = await response.json()

    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch events')
    }

    return json.data
  },

  create: async (data: {
    title: string
    date: string
    time: string
    type: string
    accent?: string
    acceptRegistration?: boolean
    registrationTitle?: string | null
    registrationDescription?: string | null
    registrationFields?: Array<{
      key: string
      label: string
      type: 'text' | 'email' | 'tel' | 'textarea' | 'number'
      required: boolean
      placeholder?: string
    }>
  }) => {
    const token = useAuthStore.getState().token
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const json = await response.json()

    if (!json.success) {
      throw new Error(json.message || 'Failed to create event')
    }

    return json.data
  },

  delete: async (id: string) => {
    const token = useAuthStore.getState().token
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const json = await response.json()

    if (!json.success) {
      throw new Error(json.message || 'Failed to delete event')
    }

    return json.data
  },
}