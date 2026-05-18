import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlitchText from '../components/GlitchText';

function StatCard({ label, value, sub }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-value">{value}</div>
      <div className="admin-stat-label">{label}</div>
      {sub && <div className="admin-stat-sub">{sub}</div>}
    </div>
  );
}

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [builds, setBuilds] = useState([]);
  const [tab, setTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/stats'),
      axios.get('/api/admin/users'),
      axios.get('/api/admin/builds'),
    ])
      .then(([s, u, b]) => {
        setStats(s.data);
        setUsers(u.data.users || []);
        setBuilds(b.data.builds || []);
      })
      .catch(() => setError('Failed to load admin data'))
      .finally(() => setLoading(false));
  }, []);

  const toggleUser = async (id, active) => {
    const endpoint = active ? 'deactivate' : 'activate';
    try {
      await axios.patch(`/api/admin/users/${id}/${endpoint}`);
      setUsers(us => us.map(u => u.id === id ? { ...u, is_active: !active } : u));
      setActionMsg(`User ${active ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      setActionMsg('Action failed: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  if (loading) return (
    <main className="page-admin">
      <div className="container">
        <div className="loading-text">LOADING ADMIN DATA...</div>
      </div>
    </main>
  );

  return (
    <main className="page-admin">
      <div className="container">
        <GlitchText text="ADMIN PANEL" tag="h2" className="page-title" />

        {error && <div className="alert alert-error">{error}</div>}
        {actionMsg && <div className="alert alert-success">{actionMsg}</div>}

        <div className="admin-tabs">
          {['stats', 'users', 'builds'].map(t => (
            <button
              key={t}
              className={`admin-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {tab === 'stats' && stats && (
          <div className="admin-section">
            <h3 className="admin-section-title">PLATFORM OVERVIEW</h3>
            <div className="admin-stats-grid">
              <StatCard label="TOTAL USERS" value={stats.totalUsers} />
              <StatCard label="ACTIVE USERS" value={stats.activeUsers} />
              <StatCard label="TOTAL BUILDS" value={stats.totalBuilds} sub={`${stats.todayBuilds} today`} />
              <StatCard
                label="TOTAL TOKENS"
                value={Number(stats.totalTokens || 0).toLocaleString()}
                sub={`${Number(stats.todayTokens || 0).toLocaleString()} today`}
              />
              <StatCard
                label="CACHE READ TOKENS"
                value={Number(stats.cacheReadTokens || 0).toLocaleString()}
                sub="cost savings"
              />
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="admin-section">
            <h3 className="admin-section-title">USER MANAGEMENT ({users.length})</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>USERNAME</th>
                    <th>EMAIL</th>
                    <th>BUILDS</th>
                    <th>TOKENS</th>
                    <th>JOINED</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className={!u.is_active ? 'row-inactive' : ''}>
                      <td>
                        {u.username}
                        {u.is_admin ? <span className="admin-badge">ADMIN</span> : null}
                      </td>
                      <td className="email-cell">{u.email}</td>
                      <td>{u.total_builds}</td>
                      <td>{Number(u.total_tokens || 0).toLocaleString()}</td>
                      <td>{new Date(u.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`status-badge ${u.is_active ? 'status-active' : 'status-inactive'}`}>
                          {u.is_active ? 'ACTIVE' : 'BANNED'}
                        </span>
                      </td>
                      <td>
                        {!u.is_admin && (
                          <button
                            className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => toggleUser(u.id, !!u.is_active)}
                          >
                            {u.is_active ? 'BAN' : 'UNBAN'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'builds' && (
          <div className="admin-section">
            <h3 className="admin-section-title">RECENT BUILDS ({builds.length})</h3>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>USER</th>
                    <th>VEHICLE</th>
                    <th>BUDGET</th>
                    <th>TOKENS</th>
                    <th>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {builds.map(b => (
                    <tr key={b.id}>
                      <td>{b.username || b.email}</td>
                      <td>{b.year} {b.make} {b.model}</td>
                      <td>${Number(b.budget).toLocaleString()}</td>
                      <td>{Number(b.tokens_used || 0).toLocaleString()}</td>
                      <td>{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
