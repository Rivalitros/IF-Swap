import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { Check, CheckCheck, MessageCircle, Send } from 'lucide-react';
import { api } from '../api.js';
import { Avatar, dateTime, Field, Feedback, useAction, useResource } from '../components.jsx';
import { request, useLive } from '../realtime.jsx';

function mergeMessages(current, next) {
  const messages = new Map(current.map(message => [message.id, message]));
  for (const incoming of next) {
    const previous = messages.get(incoming.id);
    messages.set(incoming.id, {
      ...previous, ...incoming,
      delivered_at: incoming.delivered_at || previous?.delivered_at,
      read_at: incoming.read_at || previous?.read_at,
    });
  }
  return Array.from(messages.values()).sort((a, b) => a.id - b.id);
}

function Thread({ matchId, peer, userId }) {
  const { socket, connected } = useLive();
  const [messages, setMessages] = useState([]);
  const [before, setBefore] = useState(null);
  const [ready, setReady] = useState(false);
  const [online, setOnline] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [visible, setVisible] = useState(!document.hidden);
  const history = useAction();
  const send = useAction();
  const pending = useRef(null);
  const acknowledged = useRef(new Set());
  const typingTimer = useRef();
  const lastTyping = useRef(0);
  const scroll = useRef();
  const stickToEnd = useRef(true);

  useEffect(() => {
    const visibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);

  useEffect(() => {
    setReady(false);
    setOnline(false);
    setTyping(false);
    acknowledged.current.clear();
    const controller = new AbortController();
    let otherTimer;
    const receive = message => {
      if (message.match_id === matchId) setMessages(current => mergeMessages(current, [message]));
    };
    const receipt = data => {
      if (data.matchId === matchId) setMessages(current => mergeMessages(current, data.messages.filter(item => current.some(message => message.id === item.id))));
    };
    const presence = data => { if (data.userId === peer.id) setOnline(data.online); };
    const receiveTyping = data => {
      if (data.matchId !== matchId || data.userId !== peer.id) return;
      clearTimeout(otherTimer);
      setTyping(data.active);
      if (data.active) otherTimer = setTimeout(() => setTyping(false), 3000);
    };
    socket.on('chat:message', receive).on('chat:receipt', receipt).on('chat:presence', presence).on('chat:typing', receiveTyping);

    (async () => {
      try {
        setError('');
        if (connected) {
          const joined = await request(socket, 'chat:join', { matchId });
          if (controller.signal.aborted) return;
          setOnline(joined.online);
        }
        const data = await api(`/matches/${matchId}/messages`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setMessages(current => mergeMessages(current, data.messages));
        setBefore(data.next);
        setReady(true);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      }
    })();

    return () => {
      controller.abort();
      clearTimeout(otherTimer);
      clearTimeout(typingTimer.current);
      socket.off('chat:message', receive).off('chat:receipt', receipt).off('chat:presence', presence).off('chat:typing', receiveTyping);
      if (socket.connected) request(socket, 'chat:leave', { matchId }).catch(() => {});
    };
  }, [socket, connected, matchId, peer.id, reload]);

  useEffect(() => {
    if (!connected || !ready || !visible) return;
    const ids = messages.filter(message => message.sender_id !== userId && !message.read_at && !acknowledged.current.has(message.id)).slice(0, 50).map(message => message.id);
    if (!ids.length) return;
    ids.forEach(id => acknowledged.current.add(id));
    request(socket, 'chat:read', { matchId, ids }).catch(() => ids.forEach(id => acknowledged.current.delete(id)));
  }, [socket, connected, ready, visible, userId, matchId, messages]);

  useEffect(() => {
    if (scroll.current && stickToEnd.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [messages]);

  function changeDraft(value) {
    setDraft(value);
    clearTimeout(typingTimer.current);
    if (!connected) return;
    if (Date.now() - lastTyping.current > 800) {
      lastTyping.current = Date.now();
      request(socket, 'chat:typing', { matchId, active: Boolean(value.trim()) }).catch(() => {});
    }
    typingTimer.current = setTimeout(() => request(socket, 'chat:typing', { matchId, active: false }).catch(() => {}), 1500);
  }

  return <section className="card thread">
    <header className="section-heading thread-head">
      <div className="person"><Avatar person={peer} /><div><h2>{peer.name}</h2><p>{online ? 'Online' : 'Offline'}</p></div></div>
      <Link className="button secondary" to={`/agenda?match=${matchId}`}>Agendar</Link>
    </header>
    {!connected && <p className="feedback warning" role="status">Conexão em tempo real indisponível. Seu rascunho foi mantido enquanto esta conversa estiver aberta.</p>}
    <Feedback error={error || history.error || send.error} />
    {error && <button className="secondary" onClick={() => setReload(value => value + 1)}>Tentar novamente</button>}
    <div className="message-list" ref={scroll} onScroll={event => {
      const node = event.currentTarget;
      stickToEnd.current = node.scrollHeight - node.scrollTop - node.clientHeight < 70;
    }} aria-label="Histórico de mensagens">
      {before && <button className="secondary" disabled={history.busy} onClick={() => history.run(async () => {
        stickToEnd.current = false;
        const older = await api(`/matches/${matchId}/messages?before=${before}`);
        setMessages(current => mergeMessages(current, older.messages));
        setBefore(older.next);
      })}>Carregar anteriores</button>}
      {ready && !messages.length && <p className="muted">Comece a conversa com uma mensagem.</p>}
      {messages.map(message => {
        const own = message.sender_id === userId;
        const state = message.read_at ? 'Lida' : message.delivered_at ? 'Recebida' : 'Enviada';
        return <article className={`message ${own ? 'own' : ''}`} key={message.id}>
          <strong>{own ? 'Você' : peer.name}</strong>
          <p>{message.content}</p>
          <small>{dateTime(message.created_at)} {own && <span title={state}>{message.delivered_at ? <CheckCheck size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" />} {state}</span>}</small>
        </article>;
      })}
    </div>
    {typing && <p className="muted typing" role="status">{peer.name} está digitando…</p>}
    <form className="field-row chat-compose" onSubmit={event => {
      event.preventDefault();
      const content = draft.trim();
      if (!content) return;
      if (pending.current?.content !== content) pending.current = { content, clientId: crypto.randomUUID?.() || uuid() };
      send.run(async () => {
        const message = await request(socket, 'chat:send', { matchId, ...pending.current });
        stickToEnd.current = true;
        setMessages(current => mergeMessages(current, [message]));
        pending.current = null;
        changeDraft('');
      });
    }}>
      <Field label="Mensagem" value={draft} maxLength={2000} placeholder="Escreva uma mensagem" onChange={event => changeDraft(event.target.value)} disabled={send.busy} />
      <button className="primary" disabled={!connected || !ready || !draft.trim() || send.busy}><Send size={16} /> Enviar</button>
    </form>
  </section>;
}

function uuid() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function Chat({ user }) {
  const { id } = useParams();
  const { version, messageEvent, dismissMessage } = useLive();
  useEffect(() => {
    if (messageEvent?.match_id === Number(id) && !document.hidden) dismissMessage();
  }, [id, messageEvent, dismissMessage]);
  const list = useResource('/matches', version);
  const active = useResource(id ? `/matches/${id}` : null);
  return <>
    <header className="page-heading"><h1>Conversas</h1><p>Combine suas trocas com a comunidade.</p></header>
    <div className="chat-grid">
      <aside className="card conversation-list" aria-label="Conversas recentes">
        <h2>Recentes</h2>
        <Feedback error={list.error} busy={list.busy} />
        {list.data?.length === 0 && <p className="muted">Você ainda não iniciou conversas. <Link className="inline-link" to="/">Ver sugestões</Link></p>}
        {list.data?.map(match => <NavLink className="conversation" to={`/conversas/${match.id}`} key={match.id}>
          <Avatar person={match.peer} /><div><strong>{match.peer.name}</strong><small>{match.last_message || 'Nova conversa'}</small></div>
          {match.unread > 0 && <span aria-label={`${match.unread} mensagens não lidas`} className="unread">{match.unread}</span>}
        </NavLink>)}
      </aside>
      {id ? <div><Feedback error={active.error} busy={active.busy} />
        {active.data && <Thread key={id} matchId={Number(id)} peer={active.data.peer} userId={user.id} />}
      </div> : <div className="card empty"><MessageCircle size={28} /><h2>Selecione uma conversa</h2></div>}
    </div>
  </>;
}
