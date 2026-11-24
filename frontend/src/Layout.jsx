import { NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { Compass, LogOut, Search, UserRound } from 'lucide-react';
import { Avatar, Brand, Feedback } from './components.jsx';

const navigation = [
  ['/', 'Sugestões', Compass],
  ['/perfil', 'Perfil', UserRound],
];

export function Layout({ user, onLogout, error }) {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const query = search.get('q') || '';
  return <div className="app-layout">
    <aside className="sidebar">
      <NavLink className="brand-link" to="/" aria-label="IF Swap, início"><Brand /></NavLink>
      <nav aria-label="Navegação principal">{navigation.map(([path, label, Icon]) => <NavLink key={path} to={path} end={path === '/'}>
        <Icon size={20} aria-hidden="true" /><span>{label}</span>
      </NavLink>)}</nav>
      <div className="sidebar-user"><Avatar person={user} /><div><strong>{user.name}</strong><small>{user.department}</small></div></div>
    </aside>
    <div className="app-column">
      <header className="topbar">
        <div className="mobile-brand"><Brand /></div>
        <form key={query} className="search" role="search" onSubmit={event => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get('q').trim();
          navigate(value ? `/?q=${encodeURIComponent(value)}` : '/');
        }}>
          <input type="search" name="q" defaultValue={query} maxLength={100} placeholder="Buscar pessoas ou habilidades" aria-label="Buscar pessoas ou habilidades" />
          <button className="icon-button" aria-label="Buscar"><Search size={20} /></button>
        </form>
        <button className="secondary logout" onClick={onLogout}><LogOut size={17} /><span>Sair</span></button>
      </header>
      <main className="workspace"><Feedback error={error} /><Outlet /></main>
    </div>
  </div>;
}
