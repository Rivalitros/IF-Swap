import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BookOpen, UsersRound } from 'lucide-react';
import { api } from '../api.js';
import { affiliations, Avatar, dateTime, Feedback, Rating, useAction, useResource } from '../components.jsx';
import { canReview, ReviewForm } from '../ReviewForm.jsx';
import { useLive } from '../realtime.jsx';

const reviewPath = id => `/pessoas/${id}?avaliar=1`;

function Tags({ values, empty, outlined }) {
  return values.length ? <div className="tags">{values.map(value => <span key={value} className={`tag ${outlined ? 'outlined' : ''}`}>{value}</span>)}</div> :
    <p className="muted">{empty}</p>;
}

function Suggestion({ person }) {
  const action = useAction();
  const navigate = useNavigate();
  const otherInterests = person.learn.filter(value => !person.can_teach.includes(value));
  return <article className="card suggestion">
    <div className="person"><Avatar person={person} /><div><h2>{person.name}</h2><p>{person.department}</p></div></div>
    <Rating person={person} reviewTo={reviewPath(person.id)} />
    {!person.reciprocal && <span className="compatibility">Troca em um sentido</span>}
    {person.can_learn.length > 0 && <section><h3>Ensina o que você quer aprender</h3><Tags values={person.can_learn} /></section>}
    {person.can_teach.length > 0 && <section><h3>Quer aprender o que você ensina</h3><Tags values={person.can_teach} outlined /></section>}
    {otherInterests.length > 0 && <details className="other-interests"><summary>Outros interesses de aprendizado</summary><Tags values={otherInterests} outlined /></details>}
    <Feedback error={action.error} />
    <footer className="actions">
      <Link to={`/pessoas/${person.id}`} className="button profile-link">Ver perfil</Link>
      <button className="primary" disabled={action.busy} onClick={() => action.run(async () => {
        const match = await api('/matches', { method: 'POST', body: { userId: person.id } });
        navigate(`/conversas/${match.id}`);
      })}>Iniciar conversa</button>
    </footer>
  </article>;
}

export function Suggestions() {
  const [search] = useSearchParams();
  const q = search.get('q') || '';
  const result = useResource(`/suggestions?q=${encodeURIComponent(q)}`);
  return <>
    <header className="page-heading suggestions-heading"><h1>Sugestões para você</h1><p>Pessoas que ensinam o que você quer aprender e querem aprender o que você ensina.</p></header>
    <Feedback error={result.error} busy={result.busy} />
    {result.error && <button className="secondary" onClick={result.refresh}>Tentar novamente</button>}
    {result.data?.length === 0 && <div className="card empty"><UsersRound size={26} /><h2>{q ? 'Nenhum resultado' : 'Nenhuma sugestão por enquanto'}</h2>
      <p>{q ? 'Tente buscar por outro nome, curso ou habilidade.' : 'Adicione habilidades ao seu perfil para encontrar pessoas compatíveis.'}</p>
      <Link className="button secondary" to={q ? '/' : '/perfil'}>{q ? 'Limpar busca' : 'Editar habilidades'}</Link>
    </div>}
    <div className="suggestion-grid">{result.data?.map(person => <Suggestion person={person} key={person.id} />)}</div>
  </>;
}

function ProfileReview({ person, refreshProfile }) {
  const heading = useRef(null);
  const { version } = useLive();
  const agenda = useResource('/agenda', version);
  const [sentIds, setSentIds] = useState([]);
  const available = agenda.data?.filter(item =>
    item.peer.id === person.id && canReview(item) && !sentIds.includes(item.id));

  useEffect(() => { heading.current.focus(); }, []);

  return <section className="card detail-section profile-review">
    <div className="section-heading">
      <h2 ref={heading} tabIndex={-1}>Avaliar troca com {person.name}</h2>
      <Link to={`/pessoas/${person.id}`} className="inline-link">Fechar avaliação</Link>
    </div>
    <Feedback error={agenda.error} busy={agenda.busy} />
    {agenda.error && <button className="secondary" onClick={agenda.refresh}>Tentar novamente</button>}
    {sentIds.length > 0 && <p className="muted" role="status">Avaliação enviada.</p>}
    {available?.length === 1 && <p className="muted">{dateTime(available[0].starts_at)} · {available[0].location}</p>}
    {available?.length > 0 && <ReviewForm key={available.map(item => item.id).join(',')} appointments={available} onSaved={review => {
      setSentIds(current => [...current, review.appointment_id]);
      agenda.refresh();
      refreshProfile();
    }} />}
    {available?.length === 0 && !sentIds.length && <>
      <p className="muted">Você pode avaliar uma vez por encontro concluído com {person.name}.</p>
      <Link to="/agenda" className="inline-link">Ver agenda</Link>
    </>}
  </section>;
}

export function PublicProfile() {
  const { id } = useParams();
  const [search] = useSearchParams();
  const result = useResource(`/users/${id}`);
  const person = result.data;
  const reviewing = search.has('avaliar');
  return <>
    <Link to="/" className="inline-link">Voltar às sugestões</Link>
    <Feedback error={result.error} busy={result.busy} />
    {person && <>
      <header className="page-heading"><div className="person"><Avatar person={person} size="large" /><div><h1>{person.name}</h1><p>{affiliations[person.affiliation]} · {person.department}</p><Rating person={person} reviewTo={reviewPath(person.id)} /></div></div></header>
      {reviewing && <ProfileReview key={person.id} person={person} refreshProfile={result.refresh} />}
      <div className="profile-grid">
        <section className="card detail-section"><h2><BookOpen size={20} /> Habilidades</h2>
          <h3>Ensina</h3><Tags values={person.skills.teach.map(skill => skill.name)} empty="Nenhuma habilidade informada." />
          <h3>Quer aprender</h3><Tags values={person.skills.learn.map(skill => skill.name)} empty="Nenhuma habilidade informada." />
        </section>
        <section className="card detail-section">
          <div className="section-heading"><h2>Avaliações recebidas</h2>
            {!reviewing && <Link to={reviewPath(person.id)} className="inline-link">Avaliar troca</Link>}</div>
          {person.rank && <p className="muted">{person.rank}º lugar no ranking de reputação</p>}
          {person.reviews.length ? person.reviews.map(review => <div className="review" key={review.id}>
            <strong>{review.author}</strong> · {review.rating}/5 <small>{dateTime(review.created_at)}</small><p>{review.comment}</p>
          </div>) : <p className="muted">Ainda não há avaliações.</p>}
        </section>
      </div>
    </>}
  </>;
}
