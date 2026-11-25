import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { AffiliationField, Brand, Feedback, Field, useAction } from '../components.jsx';

export function Auth({ mode, onUser }) {
  const navigate = useNavigate();
  const action = useAction();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const register = mode === 'register';
  const recover = mode === 'recover';
  const passwordAction = passwordVisible ? 'Ocultar senha' : 'Mostrar senha';
  async function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    await action.run(async () => {
      if (register && body.password !== body.confirmation) throw new Error('As senhas precisam ser iguais.');
      onUser(await api(`/auth/${mode}`, { method: 'POST', body }));
      navigate('/', { replace: true });
    });
  }

  return <main className="form-screen">
    <div className={`auth-frame ${register ? 'registration-frame' : ''}`}>
      <Brand />
      <section className="card auth-form">
        <header><h1>{recover ? 'Esqueci minha senha' : register ? 'Criar conta' : 'Entrar'}</h1>
          {!recover && <p className="muted">{register ? 'Preencha seus dados para começar.' : 'Troque habilidades com a comunidade escolar.'}</p>}
        </header>
        {recover ? <>
          <p className="muted">A recuperação de senha é demonstrativa nesta versão local. O IF Swap não envia e-mails de recuperação.</p>
          <Link className="button primary" to="/entrar">Voltar para o login</Link>
        </> : <>
          <form className="form-stack" onSubmit={submit}>
            {register && <Field label="Nome" name="name" placeholder="Seu nome completo" autoComplete="name" required minLength={2} maxLength={100} />}
            <Field label="E-mail" name="email" type="email" placeholder="seu@email.com" autoComplete="email" required />
            <Field label="Senha">{id => <div className={register ? undefined : 'password-input'}>
              <input id={id} name="password" type={passwordVisible ? 'text' : 'password'}
                placeholder={register ? 'Crie uma senha' : 'Digite sua senha'}
                autoComplete={register ? 'new-password' : 'current-password'} required minLength={8} maxLength={128} />
              {!register && <button type="button" className="icon-button password-toggle" aria-controls={id}
                aria-label={passwordAction} title={passwordAction} onClick={() => setPasswordVisible(visible => !visible)}>
                {passwordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>}
            </div>}</Field>
            {register && <>
              <Field label="Confirmar senha" name="confirmation" type="password" placeholder="Repita a senha" autoComplete="new-password" required minLength={8} maxLength={128} />
              <Field label="Curso ou setor" name="department" placeholder="Seu curso ou setor" required minLength={2} maxLength={100} />
              <AffiliationField />
            </>}
            {!register && <Link className="inline-link forgot" to="/recuperar">Esqueci minha senha</Link>}
            <Feedback error={action.error} />
            <button className="primary" disabled={action.busy}>{register ? 'Continuar' : 'Entrar'}</button>
          </form>
          <p className="auth-switch">{register ? 'Já tem conta?' : 'Ainda não tem conta?'} <Link className="inline-link" to={register ? '/entrar' : '/cadastro'}>{register ? 'Entrar' : 'Criar conta'}</Link></p>
        </>}
      </section>
    </div>
  </main>;
}
