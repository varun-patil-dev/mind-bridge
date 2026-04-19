import React from 'react';
import { useNavigate } from 'react-router-dom';
import { timeAgo } from '../utils/timeAgo';
import './ProblemCard.css';

const ProblemCard = ({ problem }) => {
  const navigate = useNavigate();

  return (
    <div className="problem-card" onClick={() => navigate(`/problem/${problem.id}`)}>
      <div className="problem-header">
        <span className="problem-username">
          <span className="problem-username-dot" />
          {problem.profiles?.username || 'Anonymous'}
        </span>
        <span className="problem-time">{timeAgo(problem.created_at)}</span>
      </div>

      <p className="problem-content">{problem.content}</p>

      <div className="problem-footer">
        <span className="response-count">
          💬 {problem.response_count || 0} {problem.response_count === 1 ? 'response' : 'responses'}
        </span>
        <span className="problem-read-more">Read more →</span>
      </div>
    </div>
  );
};

export default ProblemCard;
