import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseClient';
import './Navbar.css';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="url(#nav-brand-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="brand-icon"
            width="24"
            height="24"
            style={{ display: 'inline-flex', verticalAlign: 'middle' }}
          >
            <defs>
              <linearGradient id="nav-brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="100%" stopColor="#2979ff" />
              </linearGradient>
            </defs>
            <path d="M22 20L2 20" />
            <path d="M4 20L4 12" />
            <path d="M20 20L20 12" />
            <path d="M20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12" />
            <path d="M12 10L12 20" />
            <path d="M8 11.5L8 20" />
            <path d="M16 11.5L16 20" />
          </svg>
          <span className="brand-name">MindBridge</span>
        </Link>

        <div className="navbar-links">
          {user ? (
            <>
              <Link to="/" className={isActive('/')}>Home</Link>
              <Link to="/create" className="nav-link nav-link-cta">+ Share</Link>
              <Link to="/profile" className={isActive('/profile')}>Profile</Link>
              <button onClick={handleLogout} className="nav-link logout-btn">
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="nav-link nav-link-cta">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
