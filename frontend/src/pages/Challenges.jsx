import { useState } from 'react';
import { CalendarDays, LayoutGrid, MessageCircle } from 'lucide-react';
import { api } from '../api.js';
import { Avatar, calendarDate, dateTime, Feedback, Field, useAction, useResource } from '../components.jsx';

function Replies({ challenge, canReply, onReply }) {
  const resource = useResource(`/challenges/${challenge.id}/replies`);
  const action = useAction();
  const [parent, setParent] = useState(null);
  const byParent = new Map();
  for (const reply of resource.data || []) {
    const group = byParent.get(reply.parent_id) || [];
    group.push(reply);
    byParent.set(reply.parent_id, group);
  }
  const stack = (byParent.get(null) || []).map(reply => [reply, 0]).reverse();
  const ordered = [];
  while (stack.length) {
    const [reply, depth] = stack.pop();
    ordered.push([reply, depth]);
    for (const child of [...(byParent.get(reply.id) || [])].reverse()) stack.push([child, depth + 1]);
  }

  return <section className="reply-list" aria-label="Respostas">
    <Feedback error={resource.error} busy={resource.busy} />
    {resource.data?.length === 0 && <p className="muted">Ainda não há respostas.</p>}
    {ordered.map(([reply, depth]) => <article className="reply" key={reply.id} style={{ '--depth': Math.min(depth, 4) }}>
      <header><strong>{reply.author_name}</strong><small>{dateTime(reply.created_at)}</small></header>
      <p>{reply.message}</p>
      {canReply && <button className="text-button" onClick={() => setParent(reply)}>Responder a {reply.author_name}</button>}
    </article>)}
    {canReply && <form className="form-stack" onSubmit={event => {
      event.preventDefault();
      const form = event.currentTarget;
      const text = new FormData(form).get('message');
      action.run(async () => {
        await api(`/challenges/${challenge.id}/replies`, { method: 'POST', body: { message: text, parentId: parent?.id } });
        setParent(null);
        form.reset();
        resource.refresh();
        onReply();
      });
    }}>
      {parent && <div className="section-heading"><span>Em resposta a {parent.author_name}</span><button type="button" className="text-button" onClick={() => setParent(null)}>Cancelar réplica</button></div>}
      <Field label={parent ? 'Sua réplica' : 'Sua resposta'}>{id => <textarea id={id} name="message" required maxLength={2000} />}</Field>
      <Feedback error={action.error} />
      <button className="primary" disabled={action.busy}>Enviar resposta</button>
    </form>}
  </section>;
}

function Challenge({ item, user, afterClose }) {
  const [expanded, setExpanded] = useState(false);
  const [added, setAdded] = useState(0);
  const action = useAction();
  const canReply = item.status === 'aberto' && !item.expired;
  return <article className="card challenge">
    <header className="section-heading"><div className="person"><Avatar person={{ name: item.author_name, photo: item.photo }} />
      <div><h2>{item.author_name}</h2><small>{dateTime(item.created_at)}</small></div></div>
      <span className="tag">{item.status === 'encerrado' ? 'Encerrado' : item.expired ? 'Prazo expirado' : 'Aberto'}</span></header>
    <p className="challenge-text">{item.description}</p>
    <p className="challenge-date"><CalendarDays size={16} /> Prazo até {calendarDate(item.deadline)}</p>
    <Feedback error={action.error} />
    <div className="actions">
      <button className="secondary" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}><MessageCircle size={16} /> {expanded ? 'Ocultar respostas' : `Respostas (${item.reply_count + added})`}</button>
      {item.author_id === user.id && item.status === 'aberto' && <button className="secondary" disabled={action.busy} onClick={() => action.run(async () => {
        await api(`/challenges/${item.id}/close`, { method: 'PATCH' });
        afterClose(item.id);
      })}>Encerrar desafio</button>}
    </div>
    {expanded && <Replies challenge={item} canReply={canReply} onReply={() => setAdded(count => count + 1)} />}
  </article>;
}

export function Challenges({ user }) {
  const [status, setStatus] = useState('');
  const [extra, setExtra] = useState(null);
  const [show, setShow] = useState(false);
  const [closed, setClosed] = useState(new Set());
  const url = '/challenges?' + (status ? `status=${status}&` : '');
  const list = useResource(url);
  const action = useAction();
  const paging = useAction();
  const items = [...(list.data?.items || []), ...(extra?.items || [])].map(item => closed.has(item.id) ? { ...item, status: 'encerrado' } : item)
    .filter(item => !status || item.status === status);
  const next = extra ? extra.next : list.data?.next;

  return <>
    <header className="page-heading"><h1>Mural de desafios</h1><p>Peça ajuda para aprender algo ou compartilhe o que você sabe.</p></header>
    <div className="section-heading mural-toolbar">
      <Field label="Filtrar por status">{id => <select id={id} value={status} onChange={event => { setStatus(event.target.value); setExtra(null); }}>
        <option value="">Todos os desafios</option><option value="aberto">Abertos</option><option value="encerrado">Encerrados</option></select>}</Field>
      <button className="primary" onClick={() => setShow(value => !value)}>{show ? 'Fechar publicação' : 'Publicar desafio'}</button>
    </div>
    {show && <form className="card form-stack mural-form" onSubmit={event => {
      event.preventDefault();
      const body = Object.fromEntries(new FormData(event.currentTarget));
      action.run(async () => { await api('/challenges', { method: 'POST', body }); setShow(false); setStatus(''); setExtra(null); list.refresh(); });
    }}>
      <Field label="O que você quer aprender?">{id => <textarea id={id} name="description" required minLength={5} maxLength={2000} />}</Field>
      <Field label="Prazo" type="date" name="deadline" required />
      <Feedback error={action.error} />
      <button className="primary" disabled={action.busy}>Publicar</button>
    </form>}
    <Feedback error={list.error || paging.error} busy={list.busy} />
    {list.error && <button className="secondary" onClick={list.refresh}>Tentar novamente</button>}
    {list.data && !items.length && <div className="card empty"><LayoutGrid size={25} /><p>Nenhum desafio nesta lista.</p></div>}
    <div className="mural-list">{items.map(item => <Challenge item={item} user={user} key={item.id} afterClose={id => {
      setClosed(current => new Set([...current, id]));
      if (status === 'encerrado') list.refresh();
    }} />)}</div>
    {next && <button className="secondary more" disabled={paging.busy} onClick={() => paging.run(async () => {
      const page = await api(url + 'before=' + next);
      setExtra(current => ({ ...page, items: [...(current?.items || []), ...page.items] }));
    })}>Carregar mais desafios</button>}
  </>;
}
