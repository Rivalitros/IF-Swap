import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, LayoutGrid, Link2, MessageSquare, Search, UserRound, X } from 'lucide-react';
import { Avatar, Brand, Feedback } from './components.jsx';
import { useLive } from './realtime.jsx';

const navigation = [
  ['/', 'Sugestões', Link2],
  ['/conversas', 'Conversas', MessageSquare],
  ['/agenda', 'Agenda', CalendarDays],
  ['/mural', 'Mural de desafios', LayoutGrid, 'Mural'],
  ['/perfil', 'Meu perfil', UserRound, 'Perfil'],
];

export function Layout({ user, error }) {
  const { scheduleEvent, dismissSchedule, messageEvent, dismissMessage } = useLive();
  const { pathname } = useLocation();
  const messageLink = messageEvent ? `/conversas/${messageEvent.match_id}` : null;
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const query = search.get('q') || '';
  return <div className="app-layout">
    <aside className="sidebar">
      <NavLink className="brand-link" to="/" aria-label="IF Swap, início"><Brand /></NavLink>
      <nav aria-label="Navegação principal">{navigation.map(([path, label, Icon, compact]) => <NavLink key={path} to={path} end={path === '/'}>
        <span className="nav-icon"><Icon size={19} aria-hidden="true" /></span><span className="nav-label">{label}</span><span className="nav-compact">{compact || label}</span>
      </NavLink>)}</nav>
    </aside>
    <div className="app-column">
      <header className="topbar">
        <div className="mobile-brand"><Brand /></div>
        <form key={query} className="search" role="search" onSubmit={event => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get('q').trim();
          navigate(value ? `/?q=${encodeURIComponent(value)}` : '/');
        }}>
          <button className="icon-button" aria-label="Buscar"><Search size={20} /></button>
          <input type="search" name="q" defaultValue={query} maxLength={100} placeholder="Buscar habilidades ou pessoas" aria-label="Buscar habilidades ou pessoas" />
        </form>
        <Link className="account-shortcut" to="/perfil" aria-label="Meu perfil"><Avatar person={user} /></Link>
      </header>
      <main className="workspace"><Feedback error={error} />
        {messageLink && pathname !== messageLink && <div className="agenda-notice" role="status">
          <Link to={messageLink} onClick={dismissMessage}>Nova mensagem. Abrir conversa.</Link>
          <button className="icon-button" onClick={dismissMessage} aria-label="Dispensar aviso de mensagem"><X size={16} /></button>
        </div>}
        {scheduleEvent && <div className="agenda-notice" role="status">
          <Link to="/agenda" onClick={dismissSchedule}>{scheduleEvent.status === 'concluido'
            ? 'Encontro concluído. Avalie a sua troca na agenda.' : 'Seu agendamento foi atualizado. Ver agenda.'}</Link>
          <button className="icon-button" onClick={dismissSchedule} aria-label="Dispensar aviso"><X size={16} /></button>
        </div>}
        <Outlet />
      </main>
    </div>
  </div>;
}
