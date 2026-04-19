import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { attachProfiles } from '../utils/profileHelpers';
import ProblemCard from '../components/ProblemCard';
import './Home.css';

const formatFirestoreTimestamp = (value) => {
  if (value?.toDate) return value.toDate().toISOString();
  return value || new Date().toISOString();
};

const Home = ({ user }) => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setError('');
      const snapshot = await getDocs(query(
        collection(db, 'problems'),
        orderBy('created_at', 'desc')
      ));
      const rows = snapshot.docs.map((problemDoc) => ({
        id: problemDoc.id,
        ...problemDoc.data(),
        created_at: formatFirestoreTimestamp(problemDoc.data().created_at),
      }));
      const problemsWithProfiles = await attachProfiles(rows);
      const problemsWithCount = problemsWithProfiles.map(p => ({
        ...p,
        response_count: p.response_count || 0
      }));
      setProblems(problemsWithCount);
    } catch (error) {
      console.error('Error fetching problems:', error);
      if (error.message?.includes('Cloud Firestore API') || error.message?.includes('firestore.googleapis.com')) {
        setError('Cloud Firestore is disabled for this Firebase project. Enable Firestore Database in Firebase Console, then wait a few minutes and refresh.');
      } else if (error.code === 'permission-denied') {
        setError('Firestore rules are blocking the feed. Publish firestore.rules in Firebase Console.');
      } else if (error.code === 'unavailable' || error.code === 'not-found') {
        setError('Firestore is not ready yet. Create the Firestore database in Firebase Console.');
      } else {
        setError(error.message || 'Could not load stories right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-wrapper">
      {/* Hero */}
      <div className="home-hero">
        <div className="home-hero-badge">Community support</div>
        <h1 className="home-title">
          You're not alone.<br />
          <span>Find your people.</span>
        </h1>
        <p className="home-subtitle">
          A private, anonymous community where you can share what's on your mind and receive genuine support.
        </p>
        <div className="home-proof-row" aria-label="MindBridge community principles">
          <span>Anonymous by default</span>
          <span>Kind replies</span>
          <span>Firebase powered</span>
        </div>
        {user && (
          <button className="home-cta" onClick={() => navigate('/create')}>
            Share Your Story
          </button>
        )}
        {!user && (
          <button className="home-cta" onClick={() => navigate('/auth')}>
            Join the Community
          </button>
        )}
      </div>

      {/* Feed */}
      <div className="home-feed">
        {loading ? (
          <div className="loading">Loading stories…</div>
        ) : error ? (
          <div className="no-problems">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="home-feed-header">
              <span className="home-feed-title">Recent Posts</span>
              <span className="home-feed-count">{problems.length} {problems.length === 1 ? 'story' : 'stories'}</span>
            </div>
            <div className="problems-list">
              {problems.length === 0 ? (
                <div className="no-problems">
                  <p>No stories shared yet.</p>
                  <p>Be the first to start a conversation 💚</p>
                </div>
              ) : (
                problems.map(problem => (
                  <ProblemCard key={problem.id} problem={problem} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
