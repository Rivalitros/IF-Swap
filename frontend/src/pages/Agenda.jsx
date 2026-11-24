import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, MapPin } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { dateTime, Feedback, Field, useAction, useResource } from '../components.jsx';
import { useLive } from '../realtime.jsx';

export const appointmentStates = {
  pendente: 'Pendente', confirmado: 'Confirmado', em_andamento: 'Em andamento', concluido: 'Concluído', cancelado: 'Cancelado',
};
const monthTitle = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
const dayTitle = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' });
const localInput = value => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
const dayKey = value => localInput(value).slice(0, 10);
const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function Calendar({ items, selected, onDay }) {
  const [month, setMonth] = useState(() => new Date());
  const year = month.getFullYear(), index = month.getMonth();
  const offset = new Date(year, index, 1).getDay();
  const days = new Date(year, index + 1, 0).getDate();
  const busyDays = new Set(items.filter(item => item.status !== 'cancelado').map(item => dayKey(item.starts_at)));
  const today = dayKey(new Date());
  return <section className="card calendar" aria-label="Calendário de encontros">
    <header className="section-heading">
      <button className="icon-button" aria-label="Mês anterior" onClick={() => setMonth(new Date(year, index - 1, 1))}><ChevronLeft size={19} /></button>
      <h2>{monthTitle.format(month)}</h2>
      <button className="icon-button" aria-label="Próximo mês" onClick={() => setMonth(new Date(year, index + 1, 1))}><ChevronRight size={19} /></button>
    </header>
    <div className="calendar-days">
      {weekdays.map(day => <span key={day}>{day}</span>)}
      {Array.from({ length: offset }, (_, i) => <span key={`empty-${i}`} />)}
      {Array.from({ length: days }, (_, i) => {
        const date = new Date(year, index, i + 1);
        const key = dayKey(date);
        return <button type="button" key={key} aria-pressed={selected === key} aria-current={key === today ? 'date' : undefined}
          aria-label={dayTitle.format(date) + (busyDays.has(key) ? ', tem encontros' : '')}
          onClick={() => onDay(key === selected ? '' : key)}>{i + 1}{busyDays.has(key) && <i />}</button>;
      })}
    </div>
    {selected && <button className="secondary" onClick={() => onDay('')}>Ver todos os encontros</button>}
  </section>;
}

function ScheduleForm({ matches, existing, initialMatch, selected, onSave, onClose }) {
  const action = useAction();
  return <form className="form-stack" onSubmit={event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    action.run(async () => {
      const body = { ...data, startsAt: new Date(data.startsAt).toISOString(), endsAt: new Date(data.endsAt).toISOString() };
      if (existing) body.action = 'change';
      await api(existing ? `/agenda/${existing.id}` : '/agenda', { method: existing ? 'PATCH' : 'POST', body });
      onSave();
    });
  }}>
    {!existing && <Field label="Pessoa">{id => <select required id={id} name="matchId" defaultValue={initialMatch || ''}><option value="">Selecione uma conversa</option>
      {matches.map(match => <option key={match.id} value={match.id}>{match.peer.name}</option>)}
    </select>}</Field>}
    <div className="schedule-fields">
      <Field label="Início" type="datetime-local" name="startsAt" required defaultValue={existing ? localInput(existing.starts_at) : selected ? selected + 'T14:00' : ''} />
      <Field label="Fim" type="datetime-local" name="endsAt" required defaultValue={existing ? localInput(existing.ends_at) : selected ? selected + 'T15:00' : ''} />
    </div>
    <Field label="Modalidade">{id => <select id={id} name="modality" defaultValue={existing?.modality || 'presencial'}><option value="presencial">Presencial</option><option value="online">Online</option></select>}</Field>
    <Field label="Local ou link" name="location" required maxLength={240} defaultValue={existing?.location || ''} />
    {existing && <Field label="Motivo da mudança (opcional)" name="reason" maxLength={240} />}
    <Feedback error={action.error} />
    <div className="actions"><button type="button" className="secondary" onClick={onClose}>Voltar</button>
      <button className="primary" disabled={action.busy}>{existing ? 'Enviar contraproposta' : 'Enviar proposta'}</button></div>
  </form>;
}

function Appointment({ item, user, refresh }) {
  const action = useAction();
  const [change, setChange] = useState(false);
  const own = item.proposer_id === user.id;
  const time = Date.now();
  const starts = Date.parse(item.starts_at);
  const ends = Date.parse(item.ends_at);
  const transition = (command, label) => <button type="button" className={command === 'accept' ? 'primary' : 'secondary'} disabled={action.busy} onClick={() => action.run(async () => {
    await api(`/agenda/${item.id}`, { method: 'PATCH', body: { action: command } });
    refresh();
  })}>{label}</button>;

  return <article className="card appointment">
    <div className="section-heading"><h2>{item.peer.name}</h2><span className={'tag status-' + item.status}>{appointmentStates[item.status]}</span></div>
    <p><CalendarDays size={16} /> {dateTime(item.starts_at)} — {dateTime(item.ends_at)}</p>
    <p><MapPin size={16} /> {item.modality === 'presencial' ? 'Presencial' : 'Online'} · {item.location}</p>
    {item.change_reason && <p className="muted">Contraproposta: {item.change_reason}</p>}
    {item.status === 'pendente' && own && <p className="muted">Aguardando resposta.</p>}
    {item.status === 'pendente' && starts <= time && <p className="muted">O horário proposto já passou.</p>}
    <Feedback error={action.error} />
    {!change && <div className="actions">
      {item.status === 'pendente' && !own && <>
        {starts > time && <>{transition('accept', 'Aceitar')}<button className="secondary" onClick={() => setChange(true)}>Solicitar alteração</button></>}
        {transition('decline', 'Recusar')}
      </>}
      {['pendente', 'confirmado'].includes(item.status) && transition('cancel', 'Cancelar encontro')}
      {item.status === 'confirmado' && starts <= time && ends > time && transition('start', 'Iniciar encontro')}
      {['confirmado', 'em_andamento'].includes(item.status) && ends <= time && transition('complete', 'Concluir encontro')}
    </div>}
    {change && <ScheduleForm existing={item} onClose={() => setChange(false)} onSave={() => { setChange(false); refresh(); }} />}
    {item.status === 'concluido' && ends <= time && (item.reviewed
      ? <p className="muted">Avaliação enviada.</p> : <ReviewForm item={item} refresh={refresh} />)}
  </article>;
}

function ReviewForm({ item, refresh }) {
  const [open, setOpen] = useState(false);
  const action = useAction();
  if (!open) return <button className="secondary" onClick={() => setOpen(true)}>Avaliar troca</button>;
  return <form className="form-stack review-form" onSubmit={event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    action.run(async () => {
      await api(`/agenda/${item.id}/reviews`, { method: 'POST', body: { rating: Number(form.get('rating')), comment: form.get('comment') } });
      refresh();
    });
  }}>
    <Field label="Nota">{id => <select id={id} name="rating" required defaultValue=""><option value="">Selecione de 1 a 5</option>
      {[5, 4, 3, 2, 1].map(value => <option key={value} value={value}>{value} {value === 1 ? 'estrela' : 'estrelas'}</option>)}</select>}</Field>
    <Field label="Comentário (opcional)">{id => <textarea id={id} name="comment" maxLength={1000} />}</Field>
    <Feedback error={action.error} />
    <div className="actions"><button type="button" className="secondary" onClick={() => setOpen(false)}>Voltar</button>
      <button className="primary" disabled={action.busy}>Enviar avaliação</button></div>
  </form>;
}

export function Agenda({ user }) {
  const { version } = useLive();
  const [params, setParams] = useSearchParams();
  const matchId = params.get('match');
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState('');
  const items = useResource('/agenda', version);
  const matches = useResource('/matches', version);
  const creating = open || Boolean(matchId);
  const current = items.data?.filter(item => !day || dayKey(item.starts_at) === day);
  function close() { setOpen(false); setParams({}); }
  return <>
    <header className="page-heading"><h1>Agenda</h1><p>Proponha e acompanhe seus encontros de troca.</p></header>
    <div className="agenda-grid">
      <div className="agenda-side"><Calendar items={items.data || []} selected={day} onDay={setDay} />
        {!creating && <button className="primary" onClick={() => setOpen(true)}>Propor encontro</button>}</div>
      <div className="agenda-list">
        {creating && <section className="card detail-section"><h2>Propor encontro</h2><p className="muted">Escolha uma conversa com troca recíproca.</p>
          <Feedback error={matches.error} busy={matches.busy} />
          {matches.data && (matches.data.length ? <ScheduleForm matches={matches.data} initialMatch={matchId} selected={day} onClose={close} onSave={() => { close(); items.refresh(); }} />
            : <><p>Inicie uma conversa nas sugestões antes de propor um encontro.</p><button className="secondary" onClick={close}>Voltar</button></>)}
        </section>}
        <Feedback error={items.error} busy={items.busy} />
        {current?.length === 0 && <div className="card empty"><CalendarDays size={26} /><p>Nenhum encontro {day ? 'nesta data' : 'agendado'}.</p></div>}
        {current?.map(item => <Appointment item={item} user={user} refresh={items.refresh} key={item.id} />)}
      </div>
    </div>
  </>;
}
