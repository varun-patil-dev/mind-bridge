import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebaseClient';
import { attachProfiles } from '../utils/profileHelpers';
import ResponseList from '../components/ResponseList';
import ResponseInput from '../components/ResponseInput';
import { timeAgo } from '../utils/timeAgo';
import './ProblemPage.css';

const formatFirestoreTimestamp = (value) => {
  if (value?.toDate) return value.toDate().toISOString();
  return value || new Date().toISOString();
};

const ProblemPage = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProblem();
    fetchResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchProblem = async () => {
    try {
      setError('');
      const problemSnapshot = await getDoc(doc(db, 'problems', id));
      if (!problemSnapshot.exists()) {
        setProblem(null);
        return;
      }
      const problemData = {
        id: problemSnapshot.id,
        ...problemSnapshot.data(),
        created_at: formatFirestoreTimestamp(problemSnapshot.data().created_at),
      };
      const [problemWithProfile] = await attachProfiles([problemData]);
      setProblem(problemWithProfile);
    } catch (error) {
      console.error('Error fetching problem:', error);
      if (error.message?.includes('Cloud Firestore API') || error.message?.includes('firestore.googleapis.com')) {
        setError('Cloud Firestore is disabled for this Firebase project. Enable Firestore Database in Firebase Console, then wait a few minutes and refresh.');
      } else if (error.code === 'permission-denied') {
        setError('Firestore rules are blocking this story. Publish firestore.rules in Firebase Console.');
      } else if (error.code === 'unavailable' || error.code === 'not-found') {
        setError('Firestore is not ready yet. Create the Firestore database in Firebase Console.');
      } else {
        setError(error.message || 'Could not load this story.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchResponses = async () => {
    try {
      const snapshot = await getDocs(query(
        collection(db, 'responses'),
        where('problem_id', '==', id)
      ));
      const rows = snapshot.docs
        .map((responseDoc) => ({
          id: responseDoc.id,
          ...responseDoc.data(),
          created_at: formatFirestoreTimestamp(responseDoc.data().created_at),
        }))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setResponses(await attachProfiles(rows));
    } catch (error) {
      console.error('Error fetching responses:', error);
    }
  };

  const handleResponseAdded = (newResponse) => {
    setResponses(prev => [...prev, newResponse]);
  };

  const handleDeleteStory = async () => {
    if (!user || user.uid !== problem.user_id) return;

    const confirmed = window.confirm('Delete this story and all of its responses? This cannot be undone.');
    if (!confirmed) return;

    setDeleteLoading(true);
    setError('');

    try {
      const batch = writeBatch(db);
      const responseSnapshot = await getDocs(query(
        collection(db, 'responses'),
        where('problem_id', '==', id)
      ));

      responseSnapshot.forEach((responseDoc) => {
        batch.delete(responseDoc.ref);
      });
      batch.delete(doc(db, 'problems', id));
      await batch.commit();
      navigate('/');
    } catch (err) {
      console.error('Error deleting story:', err);
      if (err.code === 'permission-denied') {
        setError('Firestore rules blocked deleting this story. Publish the updated firestore.rules file.');
      } else {
        setError(err.message || 'Could not delete this story. Please try again.');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteResponse = async (response) => {
    if (!user || user.uid !== response.user_id) return;

    const confirmed = window.confirm('Delete this response? This cannot be undone.');
    if (!confirmed) return;

    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'responses', response.id));
      batch.update(doc(db, 'problems', id), {
        response_count: increment(-1),
      });
      await batch.commit();
      setResponses(prev => prev.filter(item => item.id !== response.id));
    } catch (err) {
      console.error('Error deleting response:', err);
      if (err.code === 'permission-denied') {
        setError('Firestore rules blocked deleting this response. Publish the updated firestore.rules file.');
      } else {
        setError(err.message || 'Could not delete this response. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="problem-page-wrapper">
        <div className="problem-page-container">
          <div className="loading">Loading…</div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="problem-page-wrapper">
        <div className="problem-page-container">
          <div className="not-found">
            <h2>{error || 'Story not found'}</h2>
            <button onClick={() => navigate('/')} className="back-btn">← Go back home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="problem-page-wrapper">
      <div className="problem-page-container">
        <button onClick={() => navigate('/')} className="back-btn">← Back to all stories</button>

        <div className="problem-detail-card">
          <div className="problem-detail-header">
            <span className="problem-detail-username">
              <span className="problem-detail-dot" />
              {problem.profiles?.username || 'Anonymous'}
            </span>
            <div className="problem-detail-meta">
              <span className="problem-detail-time">{timeAgo(problem.created_at)}</span>
              {user?.uid === problem.user_id && (
                <button
                  type="button"
                  className="danger-text-btn"
                  onClick={handleDeleteStory}
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Story'}
                </button>
              )}
            </div>
          </div>
          {error && <div className="error-message problem-error">{error}</div>}
          <p className="problem-detail-content">{problem.content}</p>
        </div>

        <ResponseList
          responses={responses}
          currentUser={user}
          onDeleteResponse={handleDeleteResponse}
        />

        {user ? (
          <ResponseInput
            problemId={id}
            onResponseAdded={handleResponseAdded}
            user={user}
          />
        ) : (
          <div className="login-prompt">
            <p>Please <a href="/auth">log in</a> to offer support to this person.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemPage;
