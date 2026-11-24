import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Coffee, LayoutDashboard, Package, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/layout.css';
import '../styles/login.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fechaHoy = new Date().toLocaleDateString('es-SV', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="brand-box">
            <div className="brand-icon">
              <Coffee size={22} />
            </div>
            <div>
              <div className="brand-title">CoffeClick</div>
              <div className="brand-sub">Cafetería Artesanal</div>
            </div>
          </div>

          <nav className="nav-list">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>

            <NavLink
              to="/inventario"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Package size={18} />
              <span>Inventario</span>
            </NavLink>
          </nav>
        </div>

        <div className="sidebar-footer">
          Sucursal San Salvador · {user?.email}
        </div>
      </aside>

      <main className="main-area">
        <header className="floating-bar">
          <div className="welcome-info">
            <h2>Hola, {user?.nombre || 'Equipo'}</h2>
            <p style={{ textTransform: 'capitalize' }}>{fechaHoy}</p>
          </div>
          <div className="bar-actions">
            <span className="role-pill">{user?.rol || 'Staff'}</span>
            <button type="button" className="btn-logout" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Salir</span>
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}