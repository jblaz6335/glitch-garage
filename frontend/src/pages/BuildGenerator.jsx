import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlitchText from '../components/GlitchText';
import BuildCard from '../components/BuildCard';
import JunkyardFinder from '../components/JunkyardFinder';
import LoadingGlitch from '../components/LoadingGlitch';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i);

const GOALS = [
  'Daily driver performance upgrade',
  'Track day / autocross build',
  'Drag strip / quarter mile',
  'Stance / show car',
  'Off-road / overland',
  'Fuel economy improvement',
  'Reliability & longevity',
  'All-around street build',
];

export default function BuildGenerator() {
  const [form, setForm] = useState({
    year: '',
    make: '',
    model: '',
    budget: '',
    zip_code: '',
    goals: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [activeTier, setActiveTier] = useState('budget');
  const [remaining, setRemaining] = useState(null);
  const [showJunkyard, setShowJunkyard] = useState(false);

  useEffect(() => {
    axios.get('/api/builds/remaining')
      .then(res => setRemaining(res.data.remaining))
      .catch(() => {});
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!form.year || !form.make.trim() || !form.model.trim() || !form.budget) {
      setError('Year, make, model, and budget are required');
      return;
    }
    if (Number(form.budget) < 100) {
      setError('Budget must be at least $100');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/builds/generate', {
        year: Number(form.year),
        make: form.make.trim(),
        model: form.model.trim(),
        budget: Number(form.budget),
        zip_code: form.zip_code.trim(),
        goals: form.goals,
        notes: form.notes.trim(),
      });
      setResult(res.data);
      setActiveTier('budget');
      setRemaining(res.data.meta?.buildsRemaining ?? null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg = err.response?.data?.error || 'Build generation failed';
      if (err.response?.status === 429) {
        setError('Daily limit reached (2 builds/day). Come back tomorrow!');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setError('');
    setShowJunkyard(false);
  };

  if (loading) {
    return (
      <main className="page-build">
        <LoadingGlitch />
      </main>
    );
  }

  if (result) {
    const build = result.build;
    const tiers = [
      { key: 'budget', label: 'BUDGET', data: build.budget },
      { key: 'midrange', label: 'MID-RANGE', data: build.midrange },
      { key: 'fullsend', label: 'FULL SEND', data: build.fullsend },
    ];
    const activeData = tiers.find(t => t.key === activeTier)?.data;

    return (
      <main className="page-build">
        <div className="container">
          <div className="results-header">
            <div>
              <GlitchText text="BUILD PLANS" tag="h2" className="results-title" />
              <p className="results-subtitle">
                {build.vehicle?.year} {build.vehicle?.make} {build.vehicle?.model} — Budget: ${Number(form.budget).toLocaleString()}
              </p>
            </div>
            <button className="btn btn-outline" onClick={resetForm}>
              ← NEW BUILD
            </button>
          </div>

          {result.meta?.cacheHit && (
            <div className="cache-badge">⚡ CACHED RESPONSE — faster & cheaper</div>
          )}

          <div className="tier-tabs">
            {tiers.map(t => (
              <button
                key={t.key}
                className={`tier-tab tier-tab-${t.key} ${activeTier === t.key ? 'active' : ''}`}
                onClick={() => setActiveTier(t.key)}
              >
                {t.label}
                {t.data?.total_cost && (
                  <span className="tier-tab-cost">${t.data.total_cost.toLocaleString()}</span>
                )}
              </button>
            ))}
          </div>

          <BuildCard tier={activeTier} data={activeData} />

          {build.notes && (
            <div className="build-notes">
              <h4>⚠ NOTES FROM THE GARAGE</h4>
              <p>{build.notes}</p>
            </div>
          )}

          <div className="junkyard-toggle">
            <button
              className="btn btn-outline btn-full"
              onClick={() => setShowJunkyard(v => !v)}
            >
              {showJunkyard ? '▲ HIDE' : '🔧 FIND JUNKYARDS NEAR YOU'}
            </button>
          </div>

          {showJunkyard && <JunkyardFinder zip={form.zip_code} />}

          {remaining !== null && (
            <div className="remaining-builds">
              <span>{remaining} build{remaining !== 1 ? 's' : ''} remaining today</span>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="page-build">
      <div className="container">
        <div className="build-form-header">
          <GlitchText text="BUILD PLANNER" tag="h2" className="page-title" />
          <p className="page-subtitle">Tell Claude your car and budget. Get 3 complete build plans.</p>
          {remaining !== null && (
            <div className={`remaining-badge ${remaining === 0 ? 'remaining-zero' : ''}`}>
              {remaining > 0 ? `${remaining} build${remaining !== 1 ? 's' : ''} left today` : 'Daily limit reached — resets at midnight'}
            </div>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="build-form card" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="form-section-title">YOUR VEHICLE</h3>
            <div className="form-row form-row-3">
              <div className="form-group">
                <label className="label">YEAR *</label>
                <select name="year" className="input" value={form.year} onChange={handleChange} required>
                  <option value="">Select year</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">MAKE *</label>
                <input
                  type="text"
                  name="make"
                  className="input"
                  placeholder="e.g. Honda"
                  value={form.make}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">MODEL *</label>
                <input
                  type="text"
                  name="model"
                  className="input"
                  placeholder="e.g. Civic Si"
                  value={form.model}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">BUILD DETAILS</h3>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="label">TOTAL BUDGET (USD) *</label>
                <input
                  type="number"
                  name="budget"
                  className="input"
                  placeholder="e.g. 5000"
                  value={form.budget}
                  onChange={handleChange}
                  min={100}
                  max={500000}
                  required
                />
              </div>
              <div className="form-group">
                <label className="label">ZIP CODE <span className="label-optional">(for junkyard finder)</span></label>
                <input
                  type="text"
                  name="zip_code"
                  className="input"
                  placeholder="e.g. 90210"
                  value={form.zip_code}
                  onChange={handleChange}
                  maxLength={5}
                  pattern="[0-9]{5}"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="label">BUILD GOAL</label>
              <select name="goals" className="input" value={form.goals} onChange={handleChange}>
                <option value="">Select a goal (optional)</option>
                {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">ADDITIONAL NOTES <span className="label-optional">(optional)</span></label>
              <textarea
                name="notes"
                className="input textarea"
                placeholder="e.g. Already have a short throw shifter, want to keep it street legal, daily driver..."
                value={form.notes}
                onChange={handleChange}
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={remaining === 0}
          >
            {remaining === 0 ? '⛔ DAILY LIMIT REACHED' : '⚡ GENERATE BUILD PLANS'}
          </button>
        </form>
      </div>
    </main>
  );
}
