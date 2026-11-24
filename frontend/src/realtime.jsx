import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const LiveContext = createContext(null);

export function useLive() {
  return useContext(LiveContext);
}

export function request(socket, event, payload) {
  if (!socket.connected) return Promise.reject(new Error('Conexão indisponível. Tente novamente após reconectar.'));
  return socket.timeout(5000).emitWithAck(event, payload).then(response => {
    if (!response.ok) throw new Error(response.error);
    return response.data;
  }, () => { throw new Error('A confirmação demorou. Tente novamente.'); });
}

export function LiveProvider({ userId, children, onExpired }) {
  const [socket] = useState(() => io({ autoConnect: false }));
  const [connected, setConnected] = useState(false);
  const [version, setVersion] = useState(0);
  const [scheduleEvent, setScheduleEvent] = useState(null);
  const [messageEvent, setMessageEvent] = useState(null);

  useEffect(() => {
    const connect = () => { setConnected(true); setVersion(value => value + 1); };
    const disconnect = () => setConnected(false);
    const onError = error => {
      if (error.data?.status === 401) onExpired();
      else if (!socket.active) {
        retryTimer = setTimeout(() => socket.connect(), 3000);
      }
    };
    let retryTimer;
    const onMessage = message => {
      setVersion(value => value + 1);
      if (message.sender_id !== userId) {
        setMessageEvent(message);
        request(socket, 'chat:delivered', { matchId: message.match_id, ids: [message.id] }).catch(() => {});
      }
    };
    const onSchedule = event => {
      setScheduleEvent(event);
      setVersion(value => value + 1);
    };
    const onReceipt = () => setVersion(value => value + 1);
    socket.on('connect', connect).on('disconnect', disconnect).on('connect_error', onError).on('auth:expired', onExpired);
    socket.on('chat:message', onMessage).on('chat:receipt', onReceipt).on('agenda:update', onSchedule);
    socket.connect();
    return () => {
      clearTimeout(retryTimer);
      socket.off('connect', connect).off('disconnect', disconnect).off('connect_error', onError).off('auth:expired', onExpired);
      socket.off('chat:message', onMessage).off('chat:receipt', onReceipt).off('agenda:update', onSchedule);
      socket.disconnect();
    };
  }, [socket, userId, onExpired]);

  const value = useMemo(() => ({ socket, connected, version, scheduleEvent, messageEvent,
    dismissSchedule: () => setScheduleEvent(null), dismissMessage: () => setMessageEvent(null) }),
  [socket, connected, version, scheduleEvent, messageEvent]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}
