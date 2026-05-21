import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const close = () => setMenuOpen(false);
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand" onClick={close}>
        <span className="brand-icon">⚙</span>
        GLITCH<span className="brand-accent">GARAGE</span>
      </Link>

      <button
        className={`hamburger ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        {user ? (
          <>
            <Link to="/build" className={`nav-link ${isActive('/build')}`} onClick={close}>
              BUILD
            </Link>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`} onClick={close}>
              HISTORY
            </Link>
            <Link to="/groups" className={`nav-link ${isActive('/groups')}`} onClick={close}>
              CREWS
            </Link>
            <Link to="/chat" className={`nav-link ${isActive('/chat')}`} onClick={close}>
              CHAT
            </Link>
            {user.is_admin && (
              <Link to="/admin" className={`nav-link nav-link-admin ${isActive('/admin')}`} onClick={close}>
                ADMIN
              </Link>
            )}
            <span className="nav-user">{user.username}</span>
            <button className="btn btn-sm btn-outline" onClick={handleLogout}>
              LOGOUT
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className={`nav-link ${isActive('/login')}`} onClick={close}>
              LOGIN
            </Link>
            <Link to="/register" className="btn btn-sm btn-primary" onClick={close}>
              SIGN UP
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
