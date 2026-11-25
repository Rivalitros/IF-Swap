import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { api } from './api.js';

export function Brand() {
  return <span className="brand"><span className="brand-mark" aria-hidden="true" /><span>IF Swap</span></span>;
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
  return <div className="field"><label htmlFor={id}>{label}</label>
    {children ? children(id) : <input id={id} {...props} />}
  </div>;
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

export function Rating({ person, reviewTo }) {
  const rating = Number(person.reputation);
  const stars = <span className="stars" aria-hidden="true">
    {[1, 2, 3, 4, 5].map(value => <Star size={16} strokeWidth={1} key={value} className={value <= Math.round(rating) ? 'filled' : ''} />)}
  </span>;
  return <span className="rating">
    {reviewTo ? <Link className="rating-link" to={reviewTo} title="Avaliar troca"
      aria-label={`Avaliar troca com ${person.name}`}>{stars}</Link> : stars}
    {person.review_count ? <><strong aria-label={`Nota ${rating} de 5`}>{rating.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}</strong>
      <span>({person.review_count} <span className="rating-word">{person.review_count === 1 ? 'avaliação' : 'avaliações'}</span>)</span></> : 'Sem avaliações'}
  </span>;
}
