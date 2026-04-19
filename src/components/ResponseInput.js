import React, { useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseClient';
import { attachProfiles } from '../utils/profileHelpers';
import { moderateResponse, isResponseAllowed, getBlockedMessage } from '../api/llmModeration';
import './ResponseInput.css';

const ResponseInput = ({ problemId, onResponseAdded, user }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) { setError('Please write something first.'); return; }
    if (!user) { setError('You must be logged in to respond.'); return; }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const moderationResult = await moderateResponse(content);

      if (!isResponseAllowed(moderationResult)) {
        setError(getBlockedMessage(moderationResult));
        setLoading(false);
        return;
      }

      const responsePayload = {
        problem_id: problemId,
        content: content.trim(),
        user_id: user.uid,
        created_at: serverTimestamp(),
      };
      const responseRef = await addDoc(collection(db, 'responses'), responsePayload);
      await updateDoc(doc(db, 'problems', problemId), {
        response_count: increment(1),
      });
      const [responseWithProfile] = await attachProfiles([{
        ...responsePayload,
        id: responseRef.id,
        created_at: new Date().toISOString(),
      }]);

      setSuccess('✅ Your response has been posted!');
      setContent('');
      if (onResponseAdded) onResponseAdded(responseWithProfile);
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('Error posting response:', err);
      setError('Failed to post response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="response-input-container">
      <div className="response-input-header">
        <h3 className="response-input-title">Offer Support 💚</h3>
        <p className="response-input-sub">Your kind words can make a difference</p>
      </div>

      <form onSubmit={handleSubmit} className="response-form">
        <textarea
          className="response-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a supportive, kind message…"
          rows="4"
          disabled={loading}
        />

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="response-footer">
          <p className="moderation-note">ℹ️ Responses are checked by AI to ensure they're safe and supportive.</p>
          <button
            type="submit"
            className="response-submit-btn"
            disabled={loading || !content.trim()}
          >
            {loading ? 'Checking…' : 'Post Response'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResponseInput;
