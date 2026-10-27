import React, { useRef, useState } from 'react';
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

const MAX_RESPONSE_CHARS = 1000;

const ResponseInput = ({ problemId, onResponseAdded, user }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [moderationWarning, setModerationWarning] = useState(null);
  const [moderationNotice, setModerationNotice] = useState('');
  const [warnedContent, setWarnedContent] = useState('');
  const textareaRef = useRef(null);

  const saveResponse = async (responseText) => {
    setLoading(true);
    setError('');

    try {
      const responsePayload = {
        problem_id: problemId,
        content: responseText.trim(),
        user_id: user.uid,
        created_at: serverTimestamp(),
      };
      const responseRef = await addDoc(collection(db, 'responses'), responsePayload);
      await updateDoc(doc(db, 'problems', problemId), { response_count: increment(1) });
      const [responseWithProfile] = await attachProfiles([{
        ...responsePayload,
        id: responseRef.id,
        created_at: new Date().toISOString(),
      }]);

      setSuccess('Your response has been posted.');
      setContent('');
      setModerationWarning(null);
      setWarnedContent('');
      if (onResponseAdded) onResponseAdded(responseWithProfile);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error posting response:', err);
      setError(err.message || 'Failed to post response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) { setError('Please write something first.'); return; }
    if (!user) { setError('You must be logged in to respond.'); return; }

    setLoading(true);
    setError('');
    setSuccess('');
    setModerationWarning(null);
    setModerationNotice('');

    try {
      const moderationResult = await moderateResponse(content, user);
      if (moderationResult.source === 'local-fallback') {
        setModerationNotice('OpenRouter could not provide a result, so a basic local phrase check was used. It only catches common terms.');
      }

      if (moderationResult.label === 'NEGATIVE') {
        setWarnedContent(content);
        setModerationWarning(moderationResult);
        return;
      }

      if (!isResponseAllowed(moderationResult)) {
        setError(getBlockedMessage(moderationResult));
        return;
      }

      await saveResponse(content);
    } catch (err) {
      console.error('Error checking response:', err);
      setError(err.message || 'Could not check this response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostAfterWarning = () => {
    if (warnedContent === content) saveResponse(content);
  };

  return (
    <div className="response-input-container">
      <div className="response-input-header">
        <h3 className="response-input-title">Offer Support 💚</h3>
        <p className="response-input-sub">Your kind words can make a difference</p>
      </div>

      <form onSubmit={handleSubmit} className="response-form">
        <textarea
          ref={textareaRef}
          className="response-textarea"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setModerationWarning(null);
            setWarnedContent('');
            setModerationNotice('');
          }}
          placeholder="Write a supportive, kind message…"
          rows="4"
          maxLength={MAX_RESPONSE_CHARS}
          disabled={loading}
        />

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        {moderationNotice && <div className="moderation-fallback-note" role="status">{moderationNotice}</div>}
        {moderationWarning && (
          <div className="moderation-warning" role="alert">
            <div>
              <strong>This reply may come across as negative.</strong>
              <p>Consider revising it so it feels supportive. You can edit it or choose to post it anyway.</p>
            </div>
            <div className="moderation-warning-actions">
              <button type="button" className="revise-response-btn" onClick={() => {
                setModerationWarning(null);
                textareaRef.current?.focus();
              }}>Edit reply</button>
              <button type="button" className="post-anyway-btn" onClick={handlePostAfterWarning} disabled={loading || warnedContent !== content}>
                {loading ? 'Posting…' : 'Post anyway'}
              </button>
            </div>
          </div>
        )}

        <div className="response-footer">
          <p className="moderation-note">Reply text is sent to OpenRouter for a tone check. Avoid including sensitive personal details; automated checks can make mistakes.</p>
          <button
            type="submit"
            className="response-submit-btn"
            disabled={loading || !content.trim() || Boolean(moderationWarning)}
          >
            {loading ? 'Checking…' : 'Post Response'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResponseInput;
