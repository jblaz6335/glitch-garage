import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GlitchText from '../components/GlitchText';

export default function JoinGroup() {
  const { code } = useParams();
  const navigate = useNavigate();

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`/api/groups/preview/${code}`)
      .then(res => setPreview(res.data.group))
      .catch(() => setError('Invalid or expired invite link.'))
      .finally(() => setLoading(false));
  }, [code]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const res = await axios.post('/api/groups/join', { invite_code: code });
      navigate(`/groups/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to join group');
      setJoining(false);
    }
  };

  if (loading) return (
    <main className="page-auth">
      <div className="auth-card">
        <div className="loading-text">LOADING...</div>
      </div>
    </main>
  );

  return (
    <main className="page-auth">
      <div className="auth-card">
        <GlitchText text="JOIN CREW" tag="h2" className="auth-title" />

        {error ? (
          <>
            <div className="alert alert-error">{error}</div>
            <button className="btn btn-outline btn-full" onClick={() => navigate('/groups')}>
              ← BACK TO CREWS
            </button>
          </>
        ) : preview ? (
          <>
            <div className="join-preview">
              <div className="join-crew-name">{preview.name}</div>
              {preview.description && <p className="join-crew-desc">{preview.description}</p>}
              <div className="join-crew-members">👥 {preview.member_count} member{preview.member_count !== 1 ? 's' : ''}</div>
            </div>
            <button
              className="btn btn-primary btn-full"
              onClick={handleJoin}
              disabled={joining}
            >
              {joining ? 'JOINING...' : `⚡ JOIN ${preview.name.toUpperCase()}`}
            </button>
            <button className="btn btn-outline btn-full" style={{ marginTop: '0.75rem' }} onClick={() => navigate('/groups')}>
              CANCEL
            </button>
          </>
        ) : null}
      </div>
    </main>
  );
}
