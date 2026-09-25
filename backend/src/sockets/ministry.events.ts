import { Server, Socket } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import { ServerToClientEvents, ClientToServerEvents, SocketData } from '../types/socket.types'

const prisma = new PrismaClient()

type AppServer = Server<ClientToServerEvents, ServerToClientEvents>
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, any, SocketData>

const ministryRoom = (churchId: string, groupId: string) => `church:${churchId}:ministry:${groupId}`

export const registerMinistryEvents = (io: AppServer, socket: AppSocket) => {
  const { churchId, email } = socket.data

  socket.on('ministry:join_room', async ({ groupId }) => {
    // Without this check, anyone who learns a groupId (leaked in an API
    // response, guessed) could listen to another church's ministry chat —
    // the room name alone was never real access control.
    const group = await prisma.ministryGroup.findFirst({ where: { id: groupId, churchId } })
    if (!group) {
      console.warn(`[socket] ${email} tried to join ministry room outside their church: ${groupId}`)
      return
    }
    socket.join(ministryRoom(churchId, groupId))
    console.log(`[socket] ${email} joined ministry room: ${groupId}`)
  })

  socket.on('ministry:leave_room', ({ groupId }) => {
    socket.leave(ministryRoom(churchId, groupId))
  })
}

export const broadcastMinistryMessage = (
  io: AppServer,
  churchId: string,
  groupId: string,
  message: { id: string; text: string; createdAt: string; user: { name: string } }
) => {
  io.to(ministryRoom(churchId, groupId)).emit('ministry:message', { groupId, message })
}
