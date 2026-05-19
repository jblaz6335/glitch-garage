import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GlitchText from '../components/GlitchText';

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    axios.get('/api/groups/mine')
      .then(res => setGroups(res.data.groups || []))
      .catch(() => setError('Failed to load groups'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async e => {
    e.preventDefault();
    setCreateError('');
    if (!createForm.name.trim()) { setCreateError('Name is required'); return; }
    setCreating(true);
    try {
      const res = await axios.post('/api/groups/create', createForm);
      navigate(`/groups/${res.data.id}`);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async e => {
    e.preventDefault();
    setJoinError('');
    if (!joinCode.trim()) { setJoinError('Enter an invite code'); return; }
    setJoining(true);
    try {
      const res = await axios.post('/api/groups/join', { invite_code: joinCode.trim() });
      navigate(`/groups/${res.data.id}`);
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Invalid invite code');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return (
    <main className="page-groups">
      <div className="container">
        <div className="loading-text">LOADING CREWS...</div>
      </div>
    </main>
  );

  return (
    <main className="page-groups">
      <div className="container">
        <div className="groups-header">
          <GlitchText text="MY CREWS" tag="h2" className="page-title" />
          <div className="groups-header-actions">
            <button className="btn btn-outline" onClick={() => { setShowJoin(v => !v); setShowCreate(false); }}>
              🔗 JOIN CREW
            </button>
            <button className="btn btn-primary" onClick={() => { setShowCreate(v => !v); setShowJoin(false); }}>
              + CREATE CREW
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="group-form-panel card">
            <h3 className="group-form-title">CREATE A CREW</h3>
            {createError && <div className="alert alert-error">{createError}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="label">CREW NAME *</label>
                <input
                  className="input"
                  placeholder="e.g. Weekend Warriors"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  maxLength={50}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">DESCRIPTION <span className="label-optional">(optional)</span></label>
                <input
                  className="input"
                  placeholder="e.g. Local track day crew"
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  maxLength={120}
                />
              </div>
              <div className="group-form-actions">
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'CREATING...' : '⚡ CREATE'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowCreate(false)}>
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {showJoin && (
          <div className="group-form-panel card">
            <h3 className="group-form-title">JOIN A CREW</h3>
            <p className="group-form-sub">Paste the invite code your crew shared with you.</p>
            {joinError && <div className="alert alert-error">{joinError}</div>}
            <form onSubmit={handleJoin}>
              <div className="form-group">
                <label className="label">INVITE CODE</label>
                <input
                  className="input input-mono"
                  placeholder="e.g. A1B2C3D4"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  required
                />
              </div>
              <div className="group-form-actions">
                <button type="submit" className="btn btn-primary" disabled={joining}>
                  {joining ? 'JOINING...' : '🔗 JOIN'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowJoin(false)}>
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        {groups.length === 0 && !showCreate && !showJoin ? (
          <div className="empty-state">
            <div className="empty-icon">🏁</div>
            <h3>NO CREWS YET</h3>
            <p>Create a crew and invite your friends, or join one with an invite code.</p>
            <div className="empty-actions">
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                + CREATE CREW
              </button>
              <button className="btn btn-outline" onClick={() => setShowJoin(true)}>
                🔗 JOIN CREW
              </button>
            </div>
          </div>
        ) : (
          <div className="groups-list">
            {groups.map(g => (
              <Link key={g.id} to={`/groups/${g.id}`} className="group-card">
                <div className="group-card-left">
                  <div className="group-card-name">{g.name}</div>
                  {g.description && <div className="group-card-desc">{g.description}</div>}
                </div>
                <div className="group-card-right">
                  <div className="group-card-members">
                    👥 {g.member_count} member{g.member_count !== 1 ? 's' : ''}
                  </div>
                  <div className="group-card-code">CODE: {g.invite_code}</div>
                  <span className="group-card-arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
