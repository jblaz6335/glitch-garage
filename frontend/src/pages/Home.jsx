import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlitchText from '../components/GlitchText';

const FEATURES = [
  { icon: '🤖', title: 'AI-POWERED BUILDS', desc: 'Claude AI analyzes your car and budget to generate three complete build plans tailored to your exact specs.' },
  { icon: '💰', title: '3 BUDGET TIERS', desc: 'Budget, Mid-Range, and Full Send options — every mod sourced with real parts links and cost estimates.' },
  { icon: '🔧', title: 'JUNKYARD FINDER', desc: 'ZIP-code based salvage yard discovery using live map data. Find used parts cheap near you.' },
  { icon: '📋', title: 'PARTS LISTS', desc: 'Every modification includes install difficulty, time estimate, sourcing links for new, used, and junkyard parts.' },
  { icon: '⚡', title: 'INSTANT RESULTS', desc: 'Get a full build plan in seconds. Save and revisit your builds from your personal dashboard.' },
  { icon: '🔒', title: 'FREE TIER', desc: '2 free builds per day. No credit card required to get started.' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="page-home">
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">AI-POWERED CAR BUILD PLANNER</div>
          <GlitchText text="GLITCH GARAGE" tag="h1" className="hero-title" />
          <p className="hero-subtitle">
            Input your car. Set your budget. Get three complete build plans — Budget, Mid-Range, and Full Send —
            with parts lists, sourcing links, and real costs. Powered by Claude AI.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to="/build" className="btn btn-primary btn-lg">
                ⚡ GENERATE BUILD PLAN
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">
                  GET STARTED FREE
                </Link>
                <Link to="/login" className="btn btn-outline btn-lg">
                  LOGIN
                </Link>
              </>
            )}
          </div>
          <div className="hero-stats">
            <div className="hero-stat"><span>2</span> builds/day free</div>
            <div className="hero-stat"><span>3</span> tier options</div>
            <div className="hero-stat"><span>∞</span> possibilities</div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-car-icon">🚗</div>
          <div className="hero-sparks">
            {[...Array(6)].map((_, i) => <div key={i} className={`spark spark-${i}`} />)}
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-heading">WHY GLITCH GARAGE?</h2>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>READY TO BUILD?</h2>
          <p>Tell Claude your car and budget. Get a full build plan in seconds.</p>
          {user ? (
            <Link to="/build" className="btn btn-primary btn-lg">
              ⚡ START BUILDING
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary btn-lg">
              CREATE FREE ACCOUNT
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
