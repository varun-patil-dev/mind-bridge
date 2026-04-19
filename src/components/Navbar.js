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
          <span className="brand-icon">🌉</span>
          MindBridge
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
