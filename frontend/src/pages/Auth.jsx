import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Users, Sparkles } from 'lucide-react';
import { api } from '../api.js';
import { AffiliationField, Brand, Feedback, Field, useAction } from '../components.jsx';

export function Auth({ mode, onUser }) {
  const navigate = useNavigate();
  const action = useAction();
  const register = mode === 'register';
  const recover = mode === 'recover';
  async function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    await action.run(async () => {
      if (register && body.password !== body.confirmation) throw new Error('As senhas precisam ser iguais.');
      const user = await api(`/auth/${mode}`, { method: 'POST', body });
      onUser(user);
      navigate('/', { replace: true });
    });
  }

  return <main className="auth-layout">
    <aside className="auth-story">
      <Brand />
      <div className="auth-story-content">
        <span className="story-icon"><Sparkles size={28} aria-hidden="true" /></span>
        <h1>Ensine o que sabe.<br />Aprenda em troca.</h1>
        <p>Encontre pessoas com quem trocar habilidades na comunidade do IFSP Campus Barretos.</p>
        <div className="story-topics"><span><BookOpen size={17} /> Aprendizagem colaborativa</span><span><Users size={17} /> Comunidade IFSP</span></div>
      </div>
      <small>IFSP Campus Barretos · Projeto Integrador</small>
    </aside>
    <section className="auth-panel">
      <div className="auth-form">
        <div className="mobile-brand"><Brand /></div>
        <h2>{recover ? 'Esqueci minha senha' : register ? 'Crie sua conta' : 'Boas-vindas ao IF Swap'}</h2>
        {recover ? <>
          <p className="muted">A recuperação de senha é demonstrativa nesta versão local. O IF Swap não envia e-mails de recuperação.</p>
          <Link className="button primary" to="/entrar">Voltar para o login</Link>
        </> : <>
          <p className="muted">{register ? 'Preencha seus dados para começar.' : 'Entre para encontrar sua próxima troca.'}</p>
          <form className="form-stack" onSubmit={submit}>
            {register && <Field label="Nome completo" name="name" autoComplete="name" required minLength={2} maxLength={100} />}
            <Field label="E-mail" name="email" type="email" autoComplete="email" required />
            <Field label="Senha" name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={8} maxLength={128} />
            {register && <>
              <Field label="Confirme sua senha" name="confirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={128} />
              <Field label="Curso ou setor" name="department" required minLength={2} maxLength={100} />
              <AffiliationField />
            </>}
            {!register && <Link className="inline-link forgot" to="/recuperar">Esqueci minha senha</Link>}
            <Feedback error={action.error} />
            <button className="primary" disabled={action.busy}>{register ? 'Criar conta' : 'Entrar'}</button>
          </form>
          <p className="auth-switch">{register ? 'Já tem conta?' : 'Ainda não tem conta?'} <Link className="inline-link" to={register ? '/entrar' : '/cadastro'}>{register ? 'Entrar' : 'Criar conta'}</Link></p>
        </>}
      </div>
    </section>
  </main>;
}
