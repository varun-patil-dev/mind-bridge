import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebaseClient';
import { ensureUserProfile } from './utils/profileHelpers';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import CreateProblem from './pages/CreateProblem';
import ProblemPage from './pages/ProblemPage';
import Profile from './pages/Profile';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        ensureUserProfile(currentUser).catch((error) => {
          console.error('Error ensuring Firebase profile:', error);
        });
      }
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading MindBridge...</p>
      </div>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="app-config-error">
        <div className="app-config-card">
          <h1>MindBridge needs Firebase setup</h1>
          <p>
            Add your Firebase web app config to `.env`, enable Email/Password Auth,
            create a Firestore database, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} />
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route 
            path="/auth" 
            element={user ? <Navigate to="/" /> : <Auth />} 
          />
          <Route 
            path="/create" 
            element={user ? <CreateProblem user={user} /> : <Navigate to="/auth" />} 
          />
          <Route path="/problem/:id" element={<ProblemPage user={user} />} />
          <Route 
            path="/profile" 
            element={user ? <Profile user={user} /> : <Navigate to="/auth" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
