import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import GlitchText from '../components/GlitchText';
import BuildCard from '../components/BuildCard';
import BuildVisualizer, { CarPreview, DEFAULT_VISUAL_CONFIG } from '../components/BuildVisualizer';

function parseVisualConfig(value) {
  if (!value) return DEFAULT_VISUAL_CONFIG;
  if (typeof value === 'object') return { ...DEFAULT_VISUAL_CONFIG, ...value };
  try {
    return { ...DEFAULT_VISUAL_CONFIG, ...JSON.parse(value) };
  } catch {
    return DEFAULT_VISUAL_CONFIG;
  }
}

export default function Dashboard() {
  const { user } = useAuth();
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [activeTier, setActiveTier] = useState({});
  const [visualDrafts, setVisualDrafts] = useState({});
  const [savingVisual, setSavingVisual] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gg_favorite_builds') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    axios.get('/api/builds/history')
      .then(res => setBuilds(res.data.builds || []))
      .catch(() => setError('Failed to load build history'))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id, build) => {
    setExpanded(e => e === id ? null : id);
    setActiveTier(t => ({ ...t, [id]: t[id] || 'budget' }));
    if (build) {
      setVisualDrafts(d => ({ ...d, [id]: d[id] || parseVisualConfig(build.visual_config) }));
    }
  };

  const setTier = (id, tier) => setActiveTier(t => ({ ...t, [id]: tier }));
  const setVisualDraft = (id, config) => setVisualDrafts(d => ({ ...d, [id]: config }));
  const toggleFavorite = (id) => {
    setFavorites(current => {
      const next = current.includes(id) ? current.filter(item => item !== id) : [...current, id];
      localStorage.setItem('gg_favorite_builds', JSON.stringify(next));
      return next;
    });
  };

  const saveVisual = async (id) => {
    setSavingVisual(id);
    try {
      const res = await axios.patch(`/api/builds/${id}/visual`, {
        visual_config: visualDrafts[id] || DEFAULT_VISUAL_CONFIG,
      });
      const saved = res.data.visual_config;
      setBuilds(bs => bs.map(b => b.id === id ? { ...b, visual_config: JSON.stringify(saved) } : b));
      setVisualDrafts(d => ({ ...d, [id]: saved }));
    } catch {
      setError('Failed to save visual settings');
    } finally {
      setSavingVisual(null);
    }
  };

  if (loading) return (
    <main className="page-dashboard">
      <div className="container">
        <div className="loading-text">LOADING MY GARAGE...</div>
      </div>
    </main>
  );

  return (
    <main className="page-dashboard my-garage-page">
      <div className="container">
        <div className="garage-hero">
          <div>
            <span className="garage-kicker">Welcome back, {user?.username}</span>
            <GlitchText text="MY GARAGE" tag="h2" className="page-title" />
            <p className="page-subtitle">Saved builds, favorite specs, and digital identity cards.</p>
          </div>
          <Link to="/build" className="btn btn-primary">New Build</Link>
        </div>

        <div className="garage-stats">
          <div><span>{builds.length}</span><small>Saved Builds</small></div>
          <div><span>{favorites.length}</span><small>Favorites</small></div>
          <div><span>{builds[0] ? new Date(builds[0].created_at).toLocaleDateString() : '--'}</span><small>Most Recent</small></div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {builds.length === 0 ? (
          <div className="empty-state garage-empty">
            <div className="empty-icon">GG</div>
            <h3>NO BUILDS YET</h3>
            <p>Create your first garage card and AI build plan.</p>
            <Link to="/build" className="btn btn-primary">New Build</Link>
          </div>
        ) : (
          <>
            <div className="garage-section-label">
              <span>Recent Builds</span>
              <small>Open a build to tune the garage card and view AI build plans</small>
            </div>
            <div className="garage-grid">
              {builds.map(b => {
                const result = typeof b.result === 'string' ? JSON.parse(b.result) : b.result;
                const isExpanded = expanded === b.id;
                const tier = activeTier[b.id] || 'budget';
                const visualConfig = visualDrafts[b.id] || parseVisualConfig(b.visual_config);
                const vehicle = { year: b.year, make: b.make, model: b.model, budget: b.budget };
                const tiers = [
                  { key: 'budget', label: 'BUDGET', data: result?.budget },
                  { key: 'midrange', label: 'MID-RANGE', data: result?.midrange },
                  { key: 'fullsend', label: 'FULL SEND', data: result?.fullsend },
                ];

                return (
                  <div key={b.id} className={`build-history-item garage-build-card ${isExpanded ? 'expanded' : ''}`}>
                    <div
                      className="build-history-header"
                      onClick={() => toggleExpand(b.id, b)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && toggleExpand(b.id, b)}
                    >
                      <div className="garage-card-preview">
                        <CarPreview vehicle={vehicle} config={visualConfig} compact />
                      </div>
                      <div className="build-history-info">
                        <span className="build-history-car">{b.year} {b.make} {b.model}</span>
                        <span className="build-history-budget">${Number(b.budget).toLocaleString()} budget</span>
                        <span className="build-history-date">{new Date(b.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="build-history-meta garage-card-actions">
                        <span className={`garage-status ${isExpanded ? 'active' : ''}`}>
                          {isExpanded ? 'Open' : 'Saved'}
                        </span>
                        <button
                          type="button"
                          className={`favorite-btn ${favorites.includes(b.id) ? 'active' : ''}`}
                          onClick={e => {
                            e.stopPropagation();
                            toggleFavorite(b.id);
                          }}
                          aria-label="Favorite build"
                        >
                          {favorites.includes(b.id) ? 'Favorited' : 'Favorite'}
                        </button>
                        {b.tokens_used && <span className="token-badge">{b.tokens_used.toLocaleString()} tokens</span>}
                        <button
                          type="button"
                          className="open-build-btn"
                          onClick={e => {
                            e.stopPropagation();
                            toggleExpand(b.id, b);
                          }}
                        >
                          {isExpanded ? 'Close Build' : 'Open Build'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && result && (
                      <div className="build-history-expanded">
                        <div className="dashboard-visual-tools">
                          <BuildVisualizer
                            vehicle={vehicle}
                            value={visualConfig}
                            onChange={config => setVisualDraft(b.id, config)}
                            title="Garage Identity Card"
                          />
                          <button
                            className="btn btn-outline btn-full"
                            onClick={() => saveVisual(b.id)}
                            disabled={savingVisual === b.id}
                          >
                            {savingVisual === b.id ? 'SAVING...' : 'SAVE DIGITAL BUILD'}
                          </button>
                        </div>

                        <div className="tier-tabs">
                          {tiers.map(t => (
                            <button
                              key={t.key}
                              className={`tier-tab tier-tab-${t.key} ${tier === t.key ? 'active' : ''}`}
                              onClick={() => setTier(b.id, t.key)}
                            >
                              {t.label}
                              {t.data?.total_cost && <span className="tier-tab-cost">${t.data.total_cost.toLocaleString()}</span>}
                            </button>
                          ))}
                        </div>
                        <BuildCard tier={tier} data={tiers.find(t => t.key === tier)?.data} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
