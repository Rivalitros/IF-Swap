import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BookOpen, MessageCircle, Sparkles, UsersRound } from 'lucide-react';
import { api } from '../api.js';
import { affiliations, Avatar, dateTime, Feedback, Rating, useAction, useResource } from '../components.jsx';

function Tags({ values, empty }) {
  return values.length ? <div className="tags">{values.map(value => <span key={value} className="tag">{value}</span>)}</div> :
    <p className="muted">{empty}</p>;
}

function Suggestion({ person }) {
  const action = useAction();
  const navigate = useNavigate();
  return <article className="card suggestion">
    <div className="person"><Avatar person={person} /><div><h2>{person.name}</h2><p>{person.department}</p></div></div>
    <Rating person={person} />
    <span className={`compatibility ${person.reciprocal ? 'reciprocal' : ''}`}><Sparkles size={14} />{person.reciprocal ? 'Troca recíproca' : 'Troca em um sentido'}</span>
    {person.can_learn.length > 0 && <section><h3>Você pode aprender</h3><Tags values={person.can_learn} /></section>}
    {person.can_teach.length > 0 && <section><h3>Você pode ensinar</h3><Tags values={person.can_teach} /></section>}
    <section><h3>Quer aprender</h3><Tags values={person.learn} empty="Nenhuma habilidade informada." /></section>
    <Feedback error={action.error} />
    <footer className="actions">
      <Link to={`/pessoas/${person.id}`} className="button secondary">Ver perfil</Link>
      <button className="primary" disabled={action.busy} onClick={() => action.run(async () => {
        const match = await api('/matches', { method: 'POST', body: { userId: person.id } });
        navigate(`/conversas/${match.id}`);
      })}><MessageCircle size={16} /> Iniciar conversa</button>
    </footer>
  </article>;
}

export function Suggestions() {
  const [search] = useSearchParams();
  const q = search.get('q') || '';
  const result = useResource(`/suggestions?q=${encodeURIComponent(q)}`);
  return <>
    <header className="page-heading"><h1>Sugestões para você</h1><p>Conheça pessoas com habilidades que combinam com as suas.</p></header>
    <Feedback error={result.error} busy={result.busy} />
    {result.error && <button className="secondary" onClick={result.refresh}>Tentar novamente</button>}
    {result.data?.length === 0 && <div className="card empty"><UsersRound size={26} /><h2>{q ? 'Nenhum resultado' : 'Nenhuma sugestão por enquanto'}</h2>
      <p>{q ? 'Tente buscar por outro nome, curso ou habilidade.' : 'Adicione habilidades ao seu perfil para encontrar pessoas compatíveis.'}</p>
      <Link className="button secondary" to={q ? '/' : '/perfil'}>{q ? 'Limpar busca' : 'Editar habilidades'}</Link>
    </div>}
    <div className="suggestion-grid">{result.data?.map(person => <Suggestion person={person} key={person.id} />)}</div>
  </>;
}

export function PublicProfile() {
  const { id } = useParams();
  const result = useResource(`/users/${id}`);
  const person = result.data;
  return <>
    <Link to="/" className="inline-link">Voltar às sugestões</Link>
    <Feedback error={result.error} busy={result.busy} />
    {person && <>
      <header className="page-heading"><div className="person"><Avatar person={person} size="large" /><div><h1>{person.name}</h1><p>{affiliations[person.affiliation]} · {person.department}</p><Rating person={person} /></div></div></header>
      <div className="profile-grid">
        <section className="card detail-section"><h2><BookOpen size={20} /> Habilidades</h2>
          <h3>Ensina</h3><Tags values={person.skills.teach.map(skill => skill.name)} empty="Nenhuma habilidade informada." />
          <h3>Quer aprender</h3><Tags values={person.skills.learn.map(skill => skill.name)} empty="Nenhuma habilidade informada." />
        </section>
        <section className="card detail-section"><h2>Avaliações recebidas</h2>
          {person.reviews.length ? person.reviews.map(review => <div className="review" key={review.id}>
            <strong>{review.author}</strong> · {review.rating}/5 <small>{dateTime(review.created_at)}</small><p>{review.comment}</p>
          </div>) : <p className="muted">Ainda não há avaliações.</p>}
        </section>
      </div>
    </>}
  </>;
}
