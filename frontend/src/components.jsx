import { useEffect, useId, useState } from 'react';
import { ArrowLeftRight, Star } from 'lucide-react';
import { api } from './api.js';

export function Brand() {
  return <span className="brand"><span className="brand-mark"><ArrowLeftRight size={22} aria-hidden="true" /></span><span>IF<span className="brand-light">Swap</span></span></span>;
}

export function Avatar({ person, size = '' }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [person?.photo]);
  const initials = person?.name?.trim().split(/\s+/).slice(0, 2).map(name => name[0]).join('').toUpperCase() || '?';
  return <span className={`avatar ${size}`}>
    {person?.photo && !broken ? <img src={`/api/photos/${encodeURIComponent(person.photo)}`} alt="" onError={() => setBroken(true)} /> : initials}
  </span>;
}

export function Field({ label, children, ...props }) {
  const id = useId();
  return <label className="field" htmlFor={id}><span>{label}</span>
    {children ? children(id) : <input id={id} {...props} />}
  </label>;
}

export function Feedback({ error, busy }) {
  return error ? <p className="feedback error" role="alert">{error}</p> :
    busy ? <p className="muted" role="status">Carregando…</p> : null;
}

export function useResource(path, version = 0) {
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState({ path: null, data: null, error: '', busy: true });
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    api(path, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setState({ path, data, error: '', busy: false });
    }, error => {
      if (!controller.signal.aborted) setState({ path, data: null, error: error.message, busy: false });
    });
    return () => controller.abort();
  }, [path, version, retry]);
  return { ...(state.path === path ? state : { data: null, error: '', busy: Boolean(path) }), refresh: () => setRetry(n => n + 1) };
}

export function useAction() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async task => {
    setBusy(true);
    setError('');
    try { await task(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return { busy, error, run };
}

export const affiliations = { aluno: 'Aluno', professor: 'Professor', funcionario: 'Funcionário' };
export const dateTime = value => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
export const calendarDate = value => value.split('-').reverse().join('/');

export function AffiliationField({ value = 'aluno' }) {
  return <Field label="Vínculo escolar">{id => <select id={id} name="affiliation" defaultValue={value}>
    {Object.entries(affiliations).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
  </select>}</Field>;
}

export function Rating({ person }) {
  return <span className="rating"><Star size={15} aria-hidden="true" />
    {person.review_count ? `${Number(person.reputation).toLocaleString('pt-BR')} (${person.review_count} ${person.review_count === 1 ? 'avaliação' : 'avaliações'})` : 'Sem avaliações'}
  </span>;
}
