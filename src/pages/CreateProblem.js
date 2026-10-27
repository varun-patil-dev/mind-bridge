import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { TOPICS } from '../utils/topics';
import './CreateProblem.css';

const MAX_CHARS = 1000;

const getFirestoreErrorMessage = (err) => {
  if (err.message?.includes('Cloud Firestore API') || err.message?.includes('firestore.googleapis.com')) {
    return 'Cloud Firestore is disabled for this Firebase project. Enable Firestore Database in Firebase Console, then wait a few minutes and try again.';
  }

  if (err.code === 'permission-denied') {
    return 'Firestore blocked this write. Publish the rules from firestore.rules in Firebase Console, then try again.';
  }

  if (err.code === 'unavailable' || err.code === 'not-found') {
    return 'Firestore is not ready for this Firebase project. Create a Firestore database in Firebase Console first.';
  }

  if (err.code === 'unauthenticated') {
    return 'Your login session expired. Please log in again before sharing.';
  }

  return err.message || 'Failed to share. Please try again.';
};

const CreateProblem = ({ user }) => {
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) { setError('Please write something before sharing.'); return; }
    if (!user) { navigate('/auth'); return; }

    setLoading(true);
    setError('');

    try {
      const problemRef = await addDoc(collection(db, 'problems'), {
        content: content.trim(),
        topic,
        user_id: user.uid,
        response_count: 0,
        created_at: serverTimestamp(),
      });
      navigate(`/problem/${problemRef.id}`);
    } catch (err) {
      console.error('Error creating problem:', err);
      setError(getFirestoreErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-wrapper">
      <div className="create-container">
        <button className="create-back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>

        <div className="create-card">
          <div className="create-card-header">
            <h1 className="create-title">Share Your Story</h1>
            <p className="create-subtitle">
              You're not alone. Share what's on your mind and receive support from people who care.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="create-form">
            <div>
              <label className="create-label" htmlFor="create-topic">Choose a topic</label>
              <select
                id="create-topic"
                className="create-topic-select"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                disabled={loading}
              >
                {TOPICS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="create-label" htmlFor="create-textarea">What's on your mind?</label>
              <textarea
                id="create-textarea"
                className="create-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Share your thoughts, feelings, or challenges. This is a safe space…"
                disabled={loading}
              />
              <div className="char-count">{content.length}/{MAX_CHARS}</div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="safe-space-notice">
              💚 This is a safe, anonymous space. Your story matters.
            </div>

            <div className="create-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate('/')} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="submit-btn" disabled={loading || !content.trim()}>
                {loading ? 'Sharing…' : 'Share Story'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProblem;
