import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api } from './api.js';
import { Brand, Feedback } from './components.jsx';
import { Auth } from './pages/Auth.jsx';
import { Profile } from './pages/Profile.jsx';
import { Layout } from './Layout.jsx';
import { PublicProfile, Suggestions } from './pages/Suggestions.jsx';
import { Chat } from './pages/Chat.jsx';
import { LiveProvider } from './realtime.jsx';

export default function App() {
  const [user, setUser] = useState(undefined);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const clearUser = useCallback(() => setUser(null), []);
  useEffect(() => {
    const controller = new AbortController();
    api('/auth/me', { signal: controller.signal }).then(setUser, failure => {
      if (controller.signal.aborted) return;
      if (failure.status === 401) setUser(null);
      else setError(failure.message);
    });
    return () => controller.abort();
  }, [attempt]);

  if (user === undefined) return <main className="setup-page"><Brand /><Feedback error={error} busy={!error} />
    {error && <button className="primary" onClick={() => { setError(''); setAttempt(value => value + 1); }}>Tentar novamente</button>}
  </main>;

  if (!user) return <Routes>
    <Route path="/entrar" element={<Auth key="login" mode="login" onUser={setUser} />} />
    <Route path="/cadastro" element={<Auth key="register" mode="register" onUser={setUser} />} />
    <Route path="/recuperar" element={<Auth mode="recover" />} />
    <Route path="*" element={<Navigate to="/entrar" replace />} />
  </Routes>;

  if (user.onboarding_step < 4) return <Profile user={user} update={setUser} onboarding />;

  return <LiveProvider key={user.id} userId={user.id} onExpired={clearUser}><Routes>
    <Route element={<Layout user={user} error={error} onLogout={async () => {
      try { await api('/auth/logout', { method: 'POST' }); setUser(null); }
      catch (failure) { setError(failure.message); }
    }} />}>
      <Route index element={<Suggestions />} />
      <Route path="/perfil" element={<Profile user={user} update={setUser} />} />
      <Route path="/pessoas/:id" element={<PublicProfile />} />
      <Route path="/conversas/:id?" element={<Chat user={user} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes></LiveProvider>;
}
