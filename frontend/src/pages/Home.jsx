import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PLATFORM_TAGS = ['OEM+', 'Track', 'Street', 'Drift', 'Show'];

export default function Home() {
  const { user } = useAuth();

  return (
    <main className="page-home garage-landing">
      <section className="landing-hero">
        <div className="landing-copy">
          <span className="landing-kicker">MIDNIGHT BUILD PLANNING PLATFORM</span>
          <h1>Glitch Garage</h1>
          <p>
            Build a digital identity card for your car, plan the next phase with AI,
            and keep your garage, crew, chat, and Garage Doc in one polished workspace.
          </p>
          <div className="landing-actions">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-primary btn-lg">Open My Garage</Link>
                <Link to="/build" className="btn btn-outline btn-lg">New Build</Link>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-lg">Login</Link>
                <Link to="/register" className="btn btn-primary btn-lg">Sign Up</Link>
              </>
            )}
          </div>
          <div className="landing-metrics">
            <span>AI build plans</span>
            <span>Digital build cards</span>
            <span>Garage Doc ready</span>
          </div>
        </div>

        <div className="landing-stage" aria-label="Stylized enthusiast car render">
          <div className="landing-light landing-light-a" />
          <div className="landing-light landing-light-b" />
          <div className="hero-car-render">
            <div className="hero-car-glass" />
            <div className="hero-car-body" />
            <div className="hero-car-highlight" />
            <div className="hero-car-lip" />
            <div className="hero-wheel hero-wheel-front" />
            <div className="hero-wheel hero-wheel-rear" />
            <div className="hero-floor-reflection" />
          </div>
          <div className="platform-tags">
            {PLATFORM_TAGS.map(tag => <span key={tag}>{tag}</span>)}
          </div>
        </div>
      </section>

      <section className="landing-feature-band">
        <div>
          <span>01</span>
          <strong>Visualize</strong>
          <p>Set paint, stance, wheels, aero, and build style before the parts list starts.</p>
        </div>
        <div>
          <span>02</span>
          <strong>Generate</strong>
          <p>Get budget, mid-range, and full-send plans without losing your garage context.</p>
        </div>
        <div>
          <span>03</span>
          <strong>Share</strong>
          <p>Keep saved builds, crew progress, global chat, and Garage Doc close by.</p>
        </div>
      </section>
    </main>
  );
}
