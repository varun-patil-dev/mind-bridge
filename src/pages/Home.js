import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebaseClient';
import { attachProfiles } from '../utils/profileHelpers';
import ProblemCard from '../components/ProblemCard';
import { TOPICS, getProblemTopic } from '../utils/topics';
import { timeAgo } from '../utils/timeAgo';
import './Home.css';

const formatFirestoreTimestamp = (value) => {
  if (value?.toDate) return value.toDate().toISOString();
  return value || new Date().toISOString();
};

const Home = ({ user }) => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All topics');
  const [sortBy, setSortBy] = useState('new');
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  const goToSearch = () => {
    searchInputRef.current?.focus();
    document.querySelector('.home-feed')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visibleProblems = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase();
    return problems
      .filter((problem) => {
        const topicMatches = selectedTopic === 'All topics' || getProblemTopic(problem) === selectedTopic;
        const searchableText = `${problem.content || ''} ${problem.profiles?.username || ''}`.toLocaleLowerCase();
        return topicMatches && (!normalizedSearch || searchableText.includes(normalizedSearch));
      })
      .sort((a, b) => {
        if (sortBy === 'supported') {
          return (b.response_count || 0) - (a.response_count || 0)
            || new Date(b.created_at) - new Date(a.created_at);
        }
        return new Date(b.created_at) - new Date(a.created_at);
      });
  }, [problems, searchText, selectedTopic, sortBy]);

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
      <aside className="home-sidebar" aria-label="Feed navigation">
        <div className="sidebar-section">
          <button className={`sidebar-link ${selectedTopic === 'All topics' && sortBy === 'new' ? 'active' : ''}`} onClick={() => { setSelectedTopic('All topics'); setSortBy('new'); }}>
            <span className="sidebar-icon">⌂</span> Home
          </button>
          <button className={`sidebar-link ${sortBy === 'supported' ? 'active' : ''}`} onClick={() => setSortBy('supported')}>
            <span className="sidebar-icon">✦</span> Most responses
          </button>
          <button className="sidebar-link" onClick={goToSearch}>
            <span className="sidebar-icon">⌕</span> Explore stories
          </button>
          <button className="sidebar-link" onClick={() => navigate(user ? '/create' : '/auth')}>
            <span className="sidebar-icon">＋</span> Share a story
          </button>
        </div>
        <div className="sidebar-section topic-sidebar-section">
          <div className="sidebar-heading">SUPPORT TOPICS</div>
          <button className={`sidebar-topic ${selectedTopic === 'All topics' ? 'selected' : ''}`} onClick={() => setSelectedTopic('All topics')}>All topics</button>
          {TOPICS.map((topic) => (
            <button key={topic} className={`sidebar-topic ${selectedTopic === topic ? 'selected' : ''}`} onClick={() => setSelectedTopic(topic)}>{topic}</button>
          ))}
        </div>
        <div className="sidebar-note">A thoughtful space to share and support one another.</div>
      </aside>

      <main className="home-feed">
        <div className="feed-search-row">
          <span className="feed-search-icon" aria-hidden="true">⌕</span>
          <input
            ref={searchInputRef}
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search stories and people"
            aria-label="Search stories and usernames"
          />
          {searchText && <button type="button" className="clear-search" onClick={() => setSearchText('')} aria-label="Clear search">×</button>}
        </div>

        <div className="feed-toolbar">
          <div>
            <h1 className="feed-page-title">Community feed</h1>
            <p className="feed-page-subtitle">Listen, share, and offer a little support.</p>
          </div>
          <label className="feed-sort-control">
            <span className="sr-only">Sort stories</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort stories">
              <option value="new">Newest</option>
              <option value="supported">Most responses</option>
            </select>
          </label>
        </div>

        {selectedTopic !== 'All topics' && (
          <div className="active-topic-filter">
            <span>Showing {selectedTopic}</span>
            <button onClick={() => setSelectedTopic('All topics')}>Clear</button>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading stories…</div>
        ) : error ? (
          <div className="no-problems"><p>{error}</p></div>
        ) : (
          <>
            <div className="feed-result-count">{visibleProblems.length} {visibleProblems.length === 1 ? 'story' : 'stories'}</div>
            <div className="problems-list">
              {visibleProblems.length === 0 ? (
                <div className="no-problems">
                  <p>{problems.length === 0 ? 'No stories shared yet.' : 'No stories match those filters.'}</p>
                  {problems.length === 0 && <p>Start a conversation when you’re ready.</p>}
                </div>
              ) : visibleProblems.map((problem) => <ProblemCard key={problem.id} problem={problem} />)}
            </div>
          </>
        )}
      </main>

      <aside className="home-rightbar" aria-label="Recent stories">
        <div className="rightbar-card">
          <div className="rightbar-heading"><span>RECENT STORIES</span><button onClick={() => { setSelectedTopic('All topics'); setSortBy('new'); setSearchText(''); }}>Reset</button></div>
          {problems.slice(0, 6).map((problem) => (
            <button key={problem.id} className="recent-story" onClick={() => navigate(`/problem/${problem.id}`)}>
              <span className="recent-story-topic">{getProblemTopic(problem)}</span>
              <span className="recent-story-content">{problem.content}</span>
              <span className="recent-story-meta">{problem.response_count || 0} {problem.response_count === 1 ? 'response' : 'responses'} · {timeAgo(problem.created_at)}</span>
            </button>
          ))}
          {!loading && problems.length === 0 && <p className="rightbar-empty">New stories will appear here.</p>}
        </div>
        <p className="rightbar-disclaimer">MindBridge is a peer-support community, not a crisis service.</p>
      </aside>
    </div>
  );
};

export default Home;
