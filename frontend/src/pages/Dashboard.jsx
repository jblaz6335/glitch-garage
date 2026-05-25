import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import GlitchText from '../components/GlitchText';
import BuildCard from '../components/BuildCard';
import BuildVisualizer, { DEFAULT_VISUAL_CONFIG } from '../components/BuildVisualizer';

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
        <div className="loading-text">LOADING BUILD HISTORY...</div>
      </div>
    </main>
  );

  return (
    <main className="page-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <GlitchText text="MY BUILDS" tag="h2" className="page-title" />
          <Link to="/build" className="btn btn-primary">
            ⚡ NEW BUILD
          </Link>
        </div>

        <div className="dashboard-user">
          <span>Logged in as <strong>{user?.username}</strong></span>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {builds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔧</div>
            <h3>NO BUILDS YET</h3>
            <p>Generate your first build plan to get started.</p>
            <Link to="/build" className="btn btn-primary">
              ⚡ GENERATE BUILD
            </Link>
          </div>
        ) : (
          <div className="builds-list">
            {builds.map(b => {
              const result = typeof b.result === 'string' ? JSON.parse(b.result) : b.result;
              const isExpanded = expanded === b.id;
              const tier = activeTier[b.id] || 'budget';
              const tiers = [
                { key: 'budget', label: 'BUDGET', data: result?.budget },
                { key: 'midrange', label: 'MID-RANGE', data: result?.midrange },
                { key: 'fullsend', label: 'FULL SEND', data: result?.fullsend },
              ];

              return (
                <div key={b.id} className="build-history-item">
                  <div
                    className="build-history-header"
                    onClick={() => toggleExpand(b.id, b)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && toggleExpand(b.id, b)}
                  >
                    <div className="build-history-info">
                      <span className="build-history-car">
                        {b.year} {b.make} {b.model}
                      </span>
                      <span className="build-history-budget">
                        ${Number(b.budget).toLocaleString()} budget
                      </span>
                      <span className="build-history-date">
                        {new Date(b.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="build-history-meta">
                      {b.tokens_used && (
                        <span className="token-badge">{b.tokens_used.toLocaleString()} tokens</span>
                      )}
                      <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                    </div>
                  </div>

                  {isExpanded && result && (
                    <div className="build-history-expanded">
                      <div className="dashboard-visual-tools">
                        <BuildVisualizer
                          vehicle={{ year: b.year, make: b.make, model: b.model, budget: b.budget }}
                          value={visualDrafts[b.id] || parseVisualConfig(b.visual_config)}
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
                            {t.data?.total_cost && (
                              <span className="tier-tab-cost">${t.data.total_cost.toLocaleString()}</span>
                            )}
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
        )}
      </div>
    </main>
  );
}
