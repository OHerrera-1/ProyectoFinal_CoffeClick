import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Coffee, LayoutDashboard, Package } from 'lucide-react';
import '../styles/layout.css';

export default function Layout() {
  const fechaHoy = new Date().toLocaleDateString('es-SV', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

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
              <div className="brand-sub">Cafeter\u00eda Artesanal</div>
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
          Sucursal San Salvador \u00b7 Turno Activo
        </div>
      </aside>

      <main className="main-area">
        <header className="floating-bar">
          <div className="welcome-info">
            <h2>Bienvenido a CoffeClick</h2>
            <p style={{ textTransform: 'capitalize' }}>{fechaHoy}</p>
          </div>
          <div className="bar-actions">
            <span className="role-pill">Barra Operativa</span>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
