import { useState } from 'react';
import { Star } from 'lucide-react';
import { api } from './api.js';
import { dateTime, Feedback, Field, useAction } from './components.jsx';

const ratings = [1, 2, 3, 4, 5];

export function canReview(item) {
  return item.status === 'concluido' && Date.parse(item.ends_at) <= Date.now() && !item.reviewed;
}

export function ReviewForm({ appointments, onSaved, onCancel }) {
  const [rating, setRating] = useState(0);
  const action = useAction();
  const choosingAppointment = appointments.length > 1;

  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const appointmentId = choosingAppointment ? data.get('appointmentId') : appointments[0].id;
    action.run(async () => {
      const review = await api(`/agenda/${appointmentId}/reviews`, {
        method: 'POST', body: { rating, comment: data.get('comment') },
      });
      onSaved(review);
    });
  }

  return <form className="form-stack review-form" onSubmit={submit}>
    {choosingAppointment && <Field label="Encontro">{id => <select id={id} name="appointmentId" required defaultValue="">
      <option value="">Selecione um encontro</option>
      {appointments.map(item => <option key={item.id} value={item.id}>{dateTime(item.starts_at)} · {item.location}</option>)}
    </select>}</Field>}
    <fieldset className="rating-picker" disabled={action.busy}>
      <legend>Nota</legend>
      <div className="rating-options">
        {ratings.map(value => {
          const label = value === 1 ? '1 estrela' : `${value} estrelas`;
          return <label className="rating-option" key={value} title={label}>
            <input type="radio" name="rating" value={value} aria-label={label} required
              checked={rating === value} onChange={() => setRating(value)} />
            <Star size={23} aria-hidden="true" className={value <= rating ? 'filled' : undefined} />
          </label>;
        })}
      </div>
    </fieldset>
    <Field label="Comentário (opcional)">{id => <textarea id={id} name="comment" maxLength={1000} disabled={action.busy} />}</Field>
    <Feedback error={action.error} />
    <div className="actions">
      {onCancel && <button type="button" className="secondary" disabled={action.busy} onClick={onCancel}>Voltar</button>}
      <button className="primary" disabled={action.busy || !rating}>Enviar avaliação</button>
    </div>
  </form>;
}
