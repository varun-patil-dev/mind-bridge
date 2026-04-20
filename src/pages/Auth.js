import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebaseClient';
import { ensureUserProfile } from '../utils/profileHelpers';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserProfile(userCredential.user);
        navigate('/');
      }
    } catch (err) {
      console.error('Auth error:', err);
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Wrong email or password. Please try again.');
      } else if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try logging in.');
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (code === 'auth/network-request-failed') {
        setError('Connection error. Please check your internet and try again.');
      } else if (code === 'auth/configuration-not-found') {
        setError('Firebase Authentication is not enabled for this project. In Firebase Console, enable Authentication and turn on Email/Password sign-in.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (toLogin) => {
    setIsLogin(toLogin);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="url(#auth-brand-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="48"
              height="48"
              style={{ display: 'inline-block' }}
            >
              <defs>
                <linearGradient id="auth-brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
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
          </span>
          <span className="auth-logo-text">MindBridge</span>
        </div>

        <p className="auth-subtitle">
          {isLogin
            ? 'Welcome back. A community that cares is waiting for you.'
            : 'You\'re not alone. Join a safe space for honest conversations.'}
        </p>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => switchTab(true)}
          >
            Log In
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => switchTab(false)}
          >
            Sign Up
          </button>
        </div>

        {/* Success message */}
        {successMsg && <div className="auth-success">{successMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className="auth-input"
              placeholder={isLogin ? '••••••••' : 'At least 6 characters'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            id="auth-submit-btn"
            className={`auth-submit-btn${loading ? ' loading-state' : ''}`}
            disabled={loading}
          >
            {loading ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Log In' : 'Create Account')}
          </button>
        </form>

        <p className="auth-footer-text">
          By continuing, you agree to keep this a safe and supportive space. 💚
        </p>
      </div>
    </div>
  );
};

export default Auth;
