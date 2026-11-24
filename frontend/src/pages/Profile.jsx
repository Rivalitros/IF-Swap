import { useId, useRef, useState } from 'react';
import { LogOut, Plus, X } from 'lucide-react';
import { api } from '../api.js';
import { AffiliationField, Avatar, Brand, Feedback, Field, useAction } from '../components.jsx';

const stepTitles = ['Vamos configurar seu perfil', 'O que você sabe ensinar?', 'O que você quer aprender?'];
const stepDescriptions = ['Comece com sua foto, seu nome e seu curso ou setor.',
  'Adicione até 5 habilidades para compartilhar com a comunidade.',
  'Adicione até 5 habilidades que você gostaria de aprender.'];
const examples = { teach: ['Desenho', 'Edição de vídeo', 'Programação', 'Matemática', 'Violão'], learn: ['Programação', 'Matemática', 'Violão', 'Desenho', 'Edição de vídeo'] };

function SkillEditor({ user, kind, change }) {
  const action = useAction();
  const [name, setName] = useState('');
  const items = user.skills[kind];
  const add = value => action.run(async () => {
    change(await api('/profile/skills', { method: 'POST', body: { name: value, kind } }));
    setName('');
  });
  const recommended = examples[kind].filter(value => !items.some(skill => skill.name === value)).slice(0, 3);
  return <section className="skill-editor">
    <div className="section-heading"><h3>{kind === 'teach' ? 'Eu ensino' : 'Eu quero aprender'}</h3><span className="tag">{items.length} de 5</span></div>
    {items.length > 0 && <div className="tags">{items.map(skill => <span className={`tag ${kind === 'learn' ? 'outlined' : ''}`} key={skill.id}>{skill.name}
      <button type="button" className="icon-button" disabled={action.busy} aria-label={`Remover ${skill.name}`} onClick={() => action.run(async () => change(await api(`/profile/skills/${kind}/${skill.id}`, { method: 'DELETE' })))}><X size={13} /></button>
    </span>)}</div>}
    <form className="field-row add-skill" onSubmit={event => { event.preventDefault(); add(name); }}>
      <Field label="Nova habilidade" placeholder="Digite uma habilidade" value={name} onChange={event => setName(event.target.value)} maxLength={60} required disabled={items.length >= 5} />
      <button type="submit" className="subtle" disabled={action.busy || items.length >= 5}>Adicionar</button>
    </form>
    {recommended.length > 0 && <div className="recommended"><p>Sugestões</p>
      <div className="tags example-tags">{recommended.map(value => <button type="button" className="secondary" key={value} disabled={action.busy || items.length >= 5} onClick={() => add(value)}><Plus size={13} /> {value}</button>)}</div>
    </div>}
    <Feedback error={action.error} />
  </section>;
}

function PhotoField({ user, update }) {
  const input = useRef();
  const action = useAction();
  return <div className="photo-field">
    <div className="photo-avatar"><Avatar person={user} size="large" /><span aria-hidden="true"><Plus size={16} /></span></div>
    <input hidden type="file" ref={input} accept="image/png,image/jpeg,image/webp" aria-label="Foto de perfil" onChange={event => {
      const file = event.target.files[0];
      event.target.value = '';
      if (!file) return;
      const body = new FormData();
      body.set('photo', file);
      action.run(async () => update(await api('/profile/photo', { method: 'PUT', body })));
    }} />
    <button type="button" className="subtle" disabled={action.busy} onClick={() => input.current.click()}>{user.photo ? 'Alterar foto' : 'Adicionar foto'}</button>
    <Feedback error={action.error} />
  </div>;
}

function ProfileForm({ user, update, next, formId, onBusy }) {
  const save = useAction();
  return <>
    <PhotoField user={user} update={update} />
    <form id={formId} className="form-stack" onSubmit={event => {
      event.preventDefault();
      if (save.busy) return;
      const fd = new FormData(event.currentTarget);
      const body = { ...Object.fromEntries(fd), affiliation: fd.get('affiliation') || user.affiliation,
        is_public: next ? user.is_public : fd.has('is_public') };
      onBusy?.(true);
      save.run(async () => {
        update(await api('/profile', { method: 'PATCH', body }));
        if (next) await next();
      }).finally(() => onBusy?.(false));
    }}>
      <Field label="Nome" name="name" defaultValue={user.name} required minLength={2} maxLength={100} />
      <Field label="Curso ou setor" name="department" defaultValue={user.department} required minLength={2} maxLength={100} />
      {!next && <>
        <AffiliationField value={user.affiliation} />
        <label className="checkbox"><input type="checkbox" name="is_public" defaultChecked={user.is_public} /> Mostrar meu perfil nas sugestões</label>
      </>}
      <Feedback error={save.error} />
      {!next && <button className="primary" disabled={save.busy}>Salvar perfil</button>}
    </form>
  </>;
}

export function Profile({ user, update, onboarding = false, onLogout }) {
  const formId = useId();
  const [backStep, setBackStep] = useState(null);
  const [saving, setSaving] = useState(false);
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
    <header className="section-heading"><div className="page-heading"><h1>Meu perfil</h1><p>Gerencie seus dados e habilidades.</p></div>
      <button className="secondary" onClick={onLogout}><LogOut size={16} /> Sair</button></header>
    <div className="profile-grid">
      <article className="card"><ProfileForm user={user} update={update} /></article>
      <article className="card"><SkillEditor user={user} kind="teach" change={update} /><SkillEditor user={user} kind="learn" change={update} /></article>
    </div>
  </>;

  return <main className="form-screen setup-screen">
    <div className="setup-frame"><Brand />
      <section className="setup-group">
        <div className="setup-progress" aria-label={`Etapa ${step} de 3`}>
          <span>Etapa {step} de 3</span>
          <div aria-hidden="true">{[1, 2, 3].map(i => <i className={i <= step ? 'done' : ''} key={i} />)}</div>
        </div>
        <div className="setup-content">
          <header><h1>{stepTitles[step - 1]}</h1><p className="muted">{stepDescriptions[step - 1]}</p></header>
          {step === 1 ? <ProfileForm user={user} update={update} next={advance} formId={formId} onBusy={setSaving} />
            : <SkillEditor key={step} user={user} kind={step === 2 ? 'teach' : 'learn'} change={update} />}
          <Feedback error={action.error} />
        </div>
        <div className="setup-actions">
          {step > 1 && <button className="text-button" onClick={() => setBackStep(step - 1)}>Voltar</button>}
          {step === 1 ? <button className="primary" type="submit" form={formId} disabled={saving}>Continuar</button>
            : <button className="primary" disabled={action.busy} onClick={() => action.run(advance)}>{step === 3 ? 'Concluir perfil' : 'Continuar'}</button>}
        </div>
      </section>
    </div>
  </main>;
}
