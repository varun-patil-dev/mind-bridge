import React from 'react';
import { timeAgo } from '../utils/timeAgo';
import './ResponseList.css';

const ResponseList = ({ responses, currentUser, onDeleteResponse }) => {
  if (!responses || responses.length === 0) {
    return (
      <div className="no-responses">
        <p>No responses yet. Be the first to offer support 💚</p>
      </div>
    );
  }

  return (
    <div className="response-list">
      <div className="response-list-header">
        <span className="response-list-title">Responses</span>
        <span className="response-list-count">{responses.length} {responses.length === 1 ? 'reply' : 'replies'}</span>
      </div>

      {responses.map((response) => (
        <div key={response.id} className="response-item">
          <div className="response-header">
            <span className="response-username">{response.profiles?.username || 'Anonymous'}</span>
            <div className="response-meta">
              <span className="response-time">{timeAgo(response.created_at)}</span>
              {currentUser?.uid === response.user_id && (
                <button
                  type="button"
                  className="response-delete-btn"
                  onClick={() => onDeleteResponse(response)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
          <p className="response-content">{response.content}</p>
        </div>
      ))}
    </div>
  );
};

export default ResponseList;
