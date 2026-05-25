import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GlitchText from '../components/GlitchText';
import BuildCard from '../components/BuildCard';
import JunkyardFinder from '../components/JunkyardFinder';
import LoadingGlitch from '../components/LoadingGlitch';
import BuildVisualizer, { DEFAULT_VISUAL_CONFIG } from '../components/BuildVisualizer';

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

const BUILDER_TABS = [
  { key: 'setup', label: 'Setup' },
  { key: 'wheels', label: 'Wheels' },
  { key: 'suspension', label: 'Suspension' },
  { key: 'aero', label: 'Aero' },
  { key: 'paint', label: 'Paint' },
  { key: 'lighting', label: 'Lighting' },
  { key: 'interior', label: 'Interior' },
  { key: 'exhaust', label: 'Exhaust' },
  { key: 'drivetrain', label: 'Drivetrain' },
];

const BUILD_MODES = [
  { value: 'oem-plus', label: 'OEM+' },
  { value: 'street', label: 'Street' },
  { value: 'track', label: 'Track' },
  { value: 'drift', label: 'Drift' },
  { value: 'vip', label: 'VIP' },
  { value: 'drag', label: 'Drag' },
  { value: 'show', label: 'Show Car' },
  { value: 'time-attack', label: 'Time Attack' },
];

const RIDE_HEIGHTS = [
  { value: 'stock', label: 'Stock' },
  { value: 'lowered', label: 'Lowered' },
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'slammed', label: 'Slammed' },
  { value: 'drag', label: 'Drag' },
  { value: 'track', label: 'Track' },
];

const WHEELS = [
  { value: 'auto', label: 'Auto Match' },
  { value: 'bbs-lm', label: 'BBS LM' },
  { value: 'apex-arc8', label: 'Apex ARC-8' },
  { value: 'te37', label: 'TE37' },
  { value: 'work-emotion', label: 'Work Emotion' },
  { value: 'meister', label: 'Meister' },
  { value: 'drag-pack', label: 'Drag Pack' },
  { value: 'deep-dish', label: 'Deep Dish' },
];

const AERO = [
  { value: 'ducktail', label: 'Ducktail' },
  { value: 'gt-wing', label: 'GT Wing' },
  { value: 'lip-kit', label: 'Lip Kit' },
  { value: 'splitter', label: 'Splitter' },
  { value: 'diffuser', label: 'Diffuser' },
  { value: 'hood-vents', label: 'Hood Vents' },
  { value: 'canards', label: 'Canards' },
  { value: 'roof-spoiler', label: 'Roof Spoiler' },
  { value: 'widebody', label: 'Widebody' },
];

const PAINT_FINISHES = ['gloss', 'satin', 'metallic', 'matte', 'pearl'];

export default function BuildGenerator() {
  const [form, setForm] = useState({
    year: '',
    make: '',
    model: '',
    budget: '',
    zip_code: '',
    goals: '',
    notes: '',
    visual_config: DEFAULT_VISUAL_CONFIG,
  });
  const [activePanel, setActivePanel] = useState('setup');
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
  const updateVisual = patch => setForm(f => ({ ...f, visual_config: { ...f.visual_config, ...patch } }));
  const toggleAero = layer => {
    setForm(f => {
      const current = Array.isArray(f.visual_config.aero_layers) ? f.visual_config.aero_layers : [];
      const next = current.includes(layer) ? current.filter(item => item !== layer) : [...current, layer];
      return { ...f, visual_config: { ...f.visual_config, aero_layers: next } };
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!form.year || !form.make.trim() || !form.model.trim() || !form.budget) {
      setError('Year, make, model, and budget are required');
      setActivePanel('setup');
      return;
    }
    if (Number(form.budget) < 100) {
      setError('Budget must be at least $100');
      setActivePanel('setup');
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
        visual_config: form.visual_config,
      });
      setResult(res.data);
      setActiveTier('budget');
      setRemaining(res.data.meta?.buildsRemaining ?? null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.status === 429 ? 'Daily limit reached (2 builds/day). Come back tomorrow!' : err.response?.data?.error || 'Build generation failed');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setResult(null);
    setError('');
    setShowJunkyard(false);
  };

  const vehicle = {
    year: form.year || 'Year',
    make: form.make || 'Make',
    model: form.model || 'Model',
    budget: form.budget,
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
    const resultVehicle = {
      year: build.vehicle?.year || form.year,
      make: build.vehicle?.make || form.make,
      model: build.vehicle?.model || form.model,
      budget: form.budget,
    };

    return (
      <main className="page-build">
        <div className="container">
          <div className="results-header garage-results-header">
            <div>
              <GlitchText text="BUILD PLANS" tag="h2" className="results-title" />
              <p className="results-subtitle">
                {build.vehicle?.year} {build.vehicle?.make} {build.vehicle?.model} / ${Number(form.budget).toLocaleString()} budget
              </p>
            </div>
            <button className="btn btn-outline" onClick={resetForm}>New Build</button>
          </div>

          {result.meta?.cacheHit && <div className="cache-badge">Cached response</div>}

          <BuildVisualizer
            vehicle={resultVehicle}
            value={result.visual_config || form.visual_config}
            editable={false}
            title="Saved Digital Build"
          />

          <div className="tier-tabs">
            {tiers.map(t => (
              <button
                key={t.key}
                className={`tier-tab tier-tab-${t.key} ${activeTier === t.key ? 'active' : ''}`}
                onClick={() => setActiveTier(t.key)}
              >
                {t.label}
                {t.data?.total_cost && <span className="tier-tab-cost">${t.data.total_cost.toLocaleString()}</span>}
              </button>
            ))}
          </div>

          <BuildCard tier={activeTier} data={activeData} />

          {build.notes && (
            <div className="build-notes">
              <h4>NOTES FROM THE GARAGE</h4>
              <p>{build.notes}</p>
            </div>
          )}

          <div className="junkyard-toggle">
            <button className="btn btn-outline btn-full" onClick={() => setShowJunkyard(v => !v)}>
              {showJunkyard ? 'Hide Junkyards' : 'Find Junkyards Near You'}
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
    <main className="page-build garage-builder-page">
      <div className="container">
        <div className="build-form-header builder-hero">
          <div>
            <span className="garage-kicker">DIGITAL BUILD BAY</span>
            <GlitchText text="NEW BUILD" tag="h2" className="page-title" />
            <p className="page-subtitle">Shape the car first, then let the AI build planner generate the parts strategy.</p>
          </div>
          {remaining !== null && (
            <div className={`remaining-badge ${remaining === 0 ? 'remaining-zero' : ''}`}>
              {remaining > 0 ? `${remaining} build${remaining !== 1 ? 's' : ''} left today` : 'Daily limit reached'}
            </div>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form className="garage-builder-shell" onSubmit={handleSubmit}>
          <div className="builder-visual-stage">
            <BuildVisualizer
              vehicle={vehicle}
              value={form.visual_config}
              editable={false}
              title="Live Garage Preview"
            />
          </div>

          <div className="builder-console">
            <div className="builder-tabs" role="tablist" aria-label="Build categories">
              {BUILDER_TABS.map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  className={`builder-tab ${activePanel === tab.key ? 'active' : ''}`}
                  onClick={() => setActivePanel(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="builder-panel">
              {activePanel === 'setup' && (
                <div className="builder-panel-grid">
                  <div className="form-group">
                    <label className="label">Year *</label>
                    <select name="year" className="input" value={form.year} onChange={handleChange} required>
                      <option value="">Select year</option>
                      {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Make *</label>
                    <input type="text" name="make" className="input" placeholder="Honda" value={form.make} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="label">Model *</label>
                    <input type="text" name="model" className="input" placeholder="Civic Si" value={form.model} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="label">Budget *</label>
                    <input type="number" name="budget" className="input" placeholder="5000" value={form.budget} onChange={handleChange} min={100} max={500000} required />
                  </div>
                  <div className="form-group">
                    <label className="label">ZIP Code</label>
                    <input type="text" name="zip_code" className="input" placeholder="90210" value={form.zip_code} onChange={handleChange} maxLength={5} pattern="[0-9]{5}" />
                  </div>
                </div>
              )}

              {activePanel === 'wheels' && (
                <>
                  <label className="label">Wheel Style</label>
                  <div className="builder-chip-grid">
                    {WHEELS.map(wheel => (
                      <button key={wheel.value} type="button" className={`builder-chip ${form.visual_config.wheel_style === wheel.value ? 'active' : ''}`} onClick={() => updateVisual({ wheel_style: wheel.value })}>
                        {wheel.label}
                      </button>
                    ))}
                  </div>
                  <div className="builder-color-row">
                    <div className="form-group">
                      <label className="label">Wheel Color</label>
                      <input className="color-input" type="color" value={form.visual_config.wheel_color} onChange={e => updateVisual({ wheel_color: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {activePanel === 'suspension' && (
                <>
                  <label className="label">Ride Height</label>
                  <div className="builder-chip-grid">
                    {RIDE_HEIGHTS.map(height => (
                      <button key={height.value} type="button" className={`builder-chip ${form.visual_config.ride_height === height.value ? 'active' : ''}`} onClick={() => updateVisual({ ride_height: height.value })}>
                        {height.label}
                      </button>
                    ))}
                  </div>
                  <label className="label">Build Identity</label>
                  <div className="builder-chip-grid">
                    {BUILD_MODES.map(mode => (
                      <button key={mode.value} type="button" className={`builder-chip ${form.visual_config.build_style === mode.value ? 'active' : ''}`} onClick={() => updateVisual({ build_style: mode.value })}>
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {activePanel === 'aero' && (
                <>
                  <label className="label">Aero / Body Layers</label>
                  <div className="builder-chip-grid">
                    {AERO.map(layer => (
                      <button key={layer.value} type="button" className={`builder-chip ${form.visual_config.aero_layers?.includes(layer.value) ? 'active' : ''}`} onClick={() => toggleAero(layer.value)}>
                        {layer.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {activePanel === 'paint' && (
                <div className="builder-panel-grid">
                  <div className="form-group">
                    <label className="label">Paint Color</label>
                    <input className="color-input" type="color" value={form.visual_config.paint_color} onChange={e => updateVisual({ paint_color: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="label">Finish</label>
                    <div className="builder-chip-grid compact">
                      {PAINT_FINISHES.map(finish => (
                        <button key={finish} type="button" className={`builder-chip ${form.visual_config.paint_finish === finish ? 'active' : ''}`} onClick={() => updateVisual({ paint_finish: finish })}>
                          {finish}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {['lighting', 'interior', 'exhaust', 'drivetrain'].includes(activePanel) && (
                <>
                  <label className="label">Build Goal</label>
                  <div className="builder-chip-grid">
                    {GOALS.map(goal => (
                      <button key={goal} type="button" className={`builder-chip ${form.goals === goal ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, goals: goal }))}>
                        {goal}
                      </button>
                    ))}
                  </div>
                  <div className="form-group">
                    <label className="label">Notes For AI Planner</label>
                    <textarea
                      name="notes"
                      className="input textarea"
                      placeholder={`Tell the AI what you want for ${activePanel}: tone, constraints, brands, already-owned parts, or daily-driver needs.`}
                      value={form.notes}
                      onChange={handleChange}
                      rows={4}
                      maxLength={500}
                    />
                  </div>
                </>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={remaining === 0}>
              {remaining === 0 ? 'Daily Limit Reached' : 'Generate Build Plans'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
