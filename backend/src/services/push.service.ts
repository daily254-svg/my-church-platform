import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'

const expo = new Expo()

export interface PushPayload {
  title: string
  body: string
  data?: Record<string, unknown>
}

export const sendPushNotification = async (
  pushTokens: string[],
  payload: PushPayload
): Promise<void> => {
  // Filter valid Expo push tokens only
  const validTokens = pushTokens.filter(token => Expo.isExpoPushToken(token))
  if (validTokens.length === 0) return

  const messages: ExpoPushMessage[] = validTokens.map(token => ({
    to:    token,
    sound: 'default',
    title: payload.title,
    body:  payload.body,
    data:  payload.data ?? {},
  }))

  // Batch into chunks — Expo recommends max 100 per request
  const chunks = expo.chunkPushNotifications(messages)

  for (const chunk of chunks) {
    try {
      const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk)
      tickets.forEach((ticket, i) => {
        if (ticket.status === 'error') {
          console.warn(`[push] Error for token ${validTokens[i]}:`, ticket.message)
        }
      })
    } catch (err) {
      console.error('[push] Chunk send failed:', err)
    }
  }
}

// Helper — send to all users with a push token, within one church
export const sendToAll = async (
  prisma: any,
  churchId: string,
  payload: PushPayload
): Promise<void> => {
  const users = await prisma.user.findMany({
    where:  { churchId, pushToken: { not: null }, status: 'ACTIVE' },
    select: { pushToken: true },
  })
  const tokens = users.map((u: any) => u.pushToken).filter(Boolean)
  await sendPushNotification(tokens, payload)
}

// Helper — send to specific roles, within one church
export const sendToRoles = async (
  prisma: any,
  churchId: string,
  roles: string[],
  payload: PushPayload
): Promise<void> => {
  const users = await prisma.user.findMany({
    where:  { churchId, role: { in: roles }, pushToken: { not: null }, status: 'ACTIVE' },
    select: { pushToken: true },
  })
  const tokens = users.map((u: any) => u.pushToken).filter(Boolean)
  await sendPushNotification(tokens, payload)
}

// Helper — send to a single user
export const sendToUser = async (
  prisma: any,
  userId: string,
  payload: PushPayload
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { pushToken: true },
  })
  if (!user?.pushToken) return
  await sendPushNotification([user.pushToken], payload)
}