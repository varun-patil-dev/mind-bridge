import React, { useCallback, useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { ensureUserProfile } from '../utils/profileHelpers';
import './UsernameEditor.css';

const UsernameEditor = ({ user }) => {
  const [username, setUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!user) return;

    try {
      const data = await ensureUserProfile(user);
      if (data) {
        setCurrentUsername(data.username);
        setUsername(data.username);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Could not load your profile. Please refresh and try again.');
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        username: username.trim(),
      });

      setCurrentUsername(username.trim());
      setSuccess('✅ Username updated successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating username:', err);
      setError('Failed to update username. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="username-editor">
      <h3 className="editor-title">Your Username</h3>
      <p className="current-username">Current: <strong>{currentUsername}</strong></p>
      
      <form onSubmit={handleUpdate} className="username-form">
        <input
          type="text"
          className="username-input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter new username"
          disabled={loading}
        />
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <button 
          type="submit" 
          className="update-btn"
          disabled={loading || username === currentUsername || !username.trim()}
        >
          {loading ? 'Updating...' : 'Update Username'}
        </button>
      </form>
    </div>
  );
};

export default UsernameEditor;
