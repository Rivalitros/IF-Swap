import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { api } from '../api.js';
import { AffiliationField, Avatar, Brand, Feedback, Field, useAction } from '../components.jsx';

const titles = ['Meu perfil', 'Eu ensino', 'Eu quero aprender'];
const examples = { teach: ['Programação', 'Matemática', 'Violão'], learn: ['Desenho', 'Inglês', 'Edição de vídeo'] };

function SkillEditor({ user, kind, change }) {
  const action = useAction();
  const [name, setName] = useState('');
  const items = user.skills[kind];
  const add = value => action.run(async () => {
    change(await api('/profile/skills', { method: 'POST', body: { name: value, kind } }));
    setName('');
  });
  return <section className="skill-editor">
    <div className="section-heading"><h3>{kind === 'teach' ? titles[1] : titles[2]}</h3><span className="muted">{items.length} / 5</span></div>
    <div className="tags">{items.map(skill => <span className="tag" key={skill.id}>{skill.name}
      <button type="button" className="icon-button" disabled={action.busy} aria-label={`Remover ${skill.name}`} onClick={() => action.run(async () => change(await api(`/profile/skills/${kind}/${skill.id}`, { method: 'DELETE' })))}><X size={13} /></button>
    </span>)}</div>
    <form className="field-row" onSubmit={event => { event.preventDefault(); add(name); }}>
      <Field label="Habilidade" value={name} onChange={event => setName(event.target.value)} maxLength={60} required disabled={items.length >= 5} />
      <button type="submit" className="secondary" disabled={action.busy || items.length >= 5}>Adicionar</button>
    </form>
    <div className="tags example-tags">{examples[kind].filter(value => !items.some(skill => skill.name === value)).map(value => <button type="button" className="subtle" key={value} disabled={action.busy || items.length >= 5} onClick={() => add(value)}>+ {value}</button>)}</div>
    <Feedback error={action.error} />
  </section>;
}

function ProfileForm({ user, update, next }) {
  const photo = useAction();
  const save = useAction();
  return <>
    <div className="photo-row">
      <Avatar person={user} size="large" />
      <label className="photo-input"><Camera size={18} /> Adicionar foto
        <input type="file" accept="image/png,image/jpeg,image/webp" disabled={photo.busy} onChange={event => {
          const file = event.target.files[0];
          event.target.value = '';
          if (!file) return;
          const body = new FormData();
          body.set('photo', file);
          photo.run(async () => update(await api('/profile/photo', { method: 'PUT', body })));
        }} />
      </label>
    </div>
    <Feedback error={photo.error} />
    <form className="form-stack" onSubmit={event => {
      event.preventDefault();
      const fd = new FormData(event.currentTarget);
      const body = { ...Object.fromEntries(fd), is_public: fd.has('is_public') };
      save.run(async () => {
        update(await api('/profile', { method: 'PATCH', body }));
        if (next) await next();
      });
    }}>
      <Field label="Nome completo" name="name" defaultValue={user.name} required minLength={2} maxLength={100} />
      <Field label="Curso ou setor" name="department" defaultValue={user.department} required minLength={2} maxLength={100} />
      <AffiliationField value={user.affiliation} />
      <label className="checkbox"><input type="checkbox" name="is_public" defaultChecked={user.is_public} /> Mostrar meu perfil nas sugestões</label>
      <Feedback error={save.error} />
      <button className="primary" disabled={save.busy || photo.busy}>{next ? 'Continuar' : 'Salvar perfil'}</button>
    </form>
  </>;
}

export function Profile({ user, update, onboarding = false }) {
  const [backStep, setBackStep] = useState(null);
  const step = backStep ?? user.onboarding_step;
  const action = useAction();
  const advance = async () => {
    if (step < user.onboarding_step) {
      setBackStep(step + 1 === user.onboarding_step ? null : step + 1);
      return;
    }
    update(await api('/profile/advance', { method: 'POST', body: { step } }));
  };

  if (!onboarding) return <>
    <header className="page-heading"><h1>Meu perfil</h1><p>Gerencie seus dados e as habilidades que você quer trocar.</p></header>
    <div className="profile-grid">
      <article className="card"><ProfileForm user={user} update={update} /></article>
      <article className="card"><SkillEditor user={user} kind="teach" change={update} /><SkillEditor user={user} kind="learn" change={update} /></article>
    </div>
  </>;

  return <main className="setup-page">
    <Brand />
    <article className="card setup-card">
      <ol className="steps">{titles.map((title, index) => <li aria-current={step === index + 1 ? 'step' : undefined} key={title}><span>{index + 1}</span>{title}</li>)}</ol>
      <h1>{titles[step - 1]}</h1>
      {step === 1 ? <ProfileForm user={user} update={update} next={advance} /> : <>
        <p className="muted">Adicione até cinco habilidades para receber sugestões compatíveis.</p>
        <SkillEditor key={step} user={user} kind={step === 2 ? 'teach' : 'learn'} change={update} />
        <Feedback error={action.error} />
        <div className="actions"><button className="secondary" onClick={() => setBackStep(step - 1)}>Voltar</button>
          <button className="primary" disabled={action.busy} onClick={() => action.run(advance)}>{step === 3 ? 'Ver sugestões' : 'Continuar'}</button>
        </div>
      </>}
    </article>
  </main>;
}
