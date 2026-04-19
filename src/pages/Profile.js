import React from 'react';
import { useNavigate } from 'react-router-dom';
import UsernameEditor from '../components/UsernameEditor';
import './Profile.css';

const Profile = ({ user }) => {
  const navigate = useNavigate();

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="profile-wrapper">
      <div className="profile-container">
        <div className="profile-header">
          <h1 className="profile-title">Your Profile</h1>
          <p className="profile-subtitle">Manage your account settings</p>
        </div>

        <UsernameEditor user={user} />

        <div className="account-info">
          <h3>Account Information</h3>
          <div className="info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{user.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Member since</span>
            <span className="info-value">
              {new Date(user.metadata?.creationTime || Date.now()).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
