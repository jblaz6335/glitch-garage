import React from 'react';

const DIFFICULTY_CLASS = {
  Easy: 'badge-easy',
  Medium: 'badge-medium',
  Hard: 'badge-hard',
  Pro: 'badge-pro',
};

const SOURCE_CLASS = {
  new: 'source-new',
  used: 'source-used',
  junkyard: 'source-junkyard',
};

export default function BuildCard({ tier, data }) {
  if (!data) return null;

  const tierClass = tier === 'budget' ? 'tier-budget'
    : tier === 'midrange' ? 'tier-midrange'
    : 'tier-fullsend';

  const tierLabel = tier === 'budget' ? 'BUDGET'
    : tier === 'midrange' ? 'MID-RANGE'
    : 'FULL SEND';

  return (
    <div className={`build-card ${tierClass}`}>
      <div className="build-card-header">
        <span className="tier-label">{tierLabel}</span>
        <span className="tier-total">${data.total_cost?.toLocaleString()}</span>
      </div>

      <p className="build-summary">{data.summary}</p>

      <div className="build-stats">
        <div className="stat">
          <span className="stat-label">Est. HP Gain</span>
          <span className="stat-value">+{data.estimated_hp_gain} hp</span>
        </div>
        <div className="stat">
          <span className="stat-label">Time</span>
          <span className="stat-value">{data.time_estimate}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Difficulty</span>
          <span className={`badge ${DIFFICULTY_CLASS[data.difficulty] || 'badge-medium'}`}>
            {data.difficulty}
          </span>
        </div>
      </div>

      <div className="mods-section">
        <h4 className="section-title">MODIFICATIONS</h4>
        <div className="parts-grid">
          {data.modifications?.map((mod, i) => (
            <div key={i} className="part-card">
              <div className="part-header">
                <span className="part-name">{mod.name}</span>
                <span className="part-cost">${mod.cost?.toLocaleString()}</span>
              </div>
              <p className="part-description">{mod.description}</p>
              {mod.sources?.length > 0 && (
                <div className="part-sources">
                  {mod.sources.map((src, j) => (
                    <a
                      key={j}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`source-link ${SOURCE_CLASS[src.type] || 'source-new'}`}
                    >
                      {src.type === 'junkyard' ? '🔧' : src.type === 'used' ? '♻' : '🛒'} {src.name}
                    </a>
                  ))}
                </div>
              )}
              {mod.install_notes && (
                <p className="install-notes">{mod.install_notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {data.pros?.length > 0 && (
        <div className="pros-cons">
          <div className="pros">
            <h5>PROS</h5>
            <ul>{data.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
          </div>
          {data.cons?.length > 0 && (
            <div className="cons">
              <h5>CONS</h5>
              <ul>{data.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
