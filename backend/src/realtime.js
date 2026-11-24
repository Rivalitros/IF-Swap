import { Server } from 'socket.io';
import { z } from 'zod';
import { AppError, checkOrigin, id, publicError, text } from './http.js';
import { receipt, storeMessage } from './repositories/chat.js';
import { requireMatch } from './repositories/matching.js';
import { sessionHash, sessionUser } from './services/sessions.js';

const userRoom = id => `user:${id}`;
const chatRoom = id => `chat:${id}`;
const sessionRoom = hash => `session:${hash}`;
const matchPayload = z.object({ matchId: id });
const messagePayload = matchPayload.extend({ clientId: z.uuid(), content: text(2000) });
const receiptPayload = matchPayload.extend({ ids: z.array(id).min(1).max(50) });
const typingPayload = matchPayload.extend({ active: z.boolean() });

export function realtime(server, db, ready) {
  const io = new Server(server, {
    maxHttpBufferSize: 16384,
    allowRequest: (req, done) => done(null, checkOrigin(req)),
  });
  const online = id => Boolean(io.sockets.adapter.rooms.get(userRoom(id))?.size);
  const notify = (ids, event, data) => io.to(ids.map(userRoom)).emit(event, data);
  const logout = hash => io.in(sessionRoom(hash)).disconnectSockets(true);

  io.use(async (socket, next) => {
    try {
      await ready();
      const hash = sessionHash(socket.request.headers.cookie);
      socket.data.userId = await sessionUser(db, hash);
      socket.data.hash = hash;
      next();
    } catch (error) {
      const { status, message } = publicError(error);
      const rejection = new Error(message);
      rejection.data = { status };
      next(rejection);
    }
  });

  async function presence(userId, isOnline) {
    const { rows } = await db.query(`SELECT CASE WHEN user_low=$1 THEN user_high ELSE user_low END AS peer
      FROM matches WHERE $1 IN (user_low,user_high) AND status='active'`, [userId]);
    if (online(userId) !== isOnline || !rows.length) return;
    notify(rows.map(row => row.peer), 'chat:presence', { userId, online: isOnline });
  }

  io.on('connection', socket => {
    const { userId, hash } = socket.data;
    const wasOnline = online(userId);
    socket.join([userRoom(userId), sessionRoom(hash)]);
    if (!wasOnline) presence(userId, true).catch(() => {});
    socket.on('disconnect', () => {
      if (!online(userId)) presence(userId, false).catch(() => {});
    });

    function on(name, schema, handler) {
      socket.on(name, async (payload, ack) => {
        if (typeof ack !== 'function') return;
        try {
          const validated = schema.parse(payload);
          await sessionUser(db, hash);
          ack({ ok: true, data: await handler(validated) });
        } catch (error) {
          const { status, message } = publicError(error);
          ack({ ok: false, status, error: message });
          if (status === 401) socket.disconnect(true);
        }
      });
    }

    let roomOperation = Promise.resolve();
    const roomChange = fn => payload => {
      const task = roomOperation.then(() => fn(payload));
      roomOperation = task.catch(() => {});
      return task;
    };
    on('chat:join', matchPayload, roomChange(async ({ matchId }) => {
      const match = await requireMatch(db, userId, matchId);
      if (match.status !== 'active') throw new AppError(409, 'A conversa está encerrada.');
      if (socket.data.matchId) await socket.leave(chatRoom(socket.data.matchId));
      await socket.join(chatRoom(matchId));
      socket.data.matchId = matchId;
      return { peerId: match.peerId, online: online(match.peerId) };
    }));

    on('chat:leave', matchPayload, roomChange(async ({ matchId }) => {
      if (socket.data.matchId !== matchId) return;
      await socket.leave(chatRoom(matchId));
      delete socket.data.matchId;
    }));

    on('chat:typing', typingPayload, async ({ matchId, active }) => {
      const match = await requireMatch(db, userId, matchId);
      if (socket.data.matchId !== matchId || match.status !== 'active') throw new AppError(403, 'Abra a conversa primeiro.');
      socket.to(chatRoom(matchId)).emit('chat:typing', { matchId, userId, active });
    });

    on('chat:send', messagePayload, async data => {
      const result = await storeMessage(db, userId, data);
      if (result.inserted) notify([userId, result.peerId], 'chat:message', result.message);
      return result.message;
    });

    for (const mode of ['delivered', 'read']) {
      on(`chat:${mode}`, receiptPayload, async data => {
        const { rows, peerId } = await receipt(db, userId, data, mode);
        if (rows.length) notify([userId, peerId], 'chat:receipt', { matchId: data.matchId, messages: rows });
        return { updated: rows.length };
      });
    }
  });

  return { io, online, notify, logout };
}
