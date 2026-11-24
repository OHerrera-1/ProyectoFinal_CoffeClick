import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

const ROLES = ['Administrador', 'Barista', 'Cajero'];

export default function Login() {
  const [rol, setRol] = useState('Administrador');
  const [email, setEmail] = useState('admin@coffeclick.sv');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Completa tu correo y contraseña para ingresar.');
      return;
    }

    const nombreBase = email.split('@')[0];
    const nombreFormateado = nombreBase.charAt(0).toUpperCase() + nombreBase.slice(1);

    login({
      nombre: nombreFormateado,
      email,
      rol,
    });
    navigate('/', { replace: true });
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Coffee size={28} />
          </div>
          <h1>CoffeClick</h1>
          <p>Selecciona tu rol e inicia turno</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="role-selector">
            {ROLES.map((item) => (
              <button
                key={item}
                type="button"
                className={`role-btn ${rol === item ? 'selected' : ''}`}
                onClick={() => setRol(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo institucional</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@coffeclick.sv"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="btn-submit">
            Ingresar como {rol}
          </button>
        </form>
      </div>
    </div>
  );
}