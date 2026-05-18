import React, { useState } from 'react';
import axios from 'axios';

export default function JunkyardFinder({ zip: initialZip }) {
  const [zip, setZip] = useState(initialZip || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const search = async (e) => {
    e.preventDefault();
    if (!zip.match(/^\d{5}$/)) {
      setError('Enter a valid 5-digit ZIP code');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`/api/junkyards?zip=${zip}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to find junkyards');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="junkyard-section">
      <h3 className="section-title">🔩 JUNKYARD FINDER</h3>
      <p className="section-subtitle">Find salvage yards near you for cheap used parts</p>

      <form className="junkyard-form" onSubmit={search}>
        <input
          type="text"
          className="input"
          placeholder="ZIP CODE"
          value={zip}
          onChange={e => setZip(e.target.value)}
          maxLength={5}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'SEARCHING...' : 'FIND YARDS'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {result && (
        <div className="junkyard-results">
          {result.junkyards?.length > 0 ? (
            <>
              <p className="results-count">{result.junkyards.length} salvage yards found within 50 miles</p>
              <div className="junkyard-grid">
                {result.junkyards.map((yard, i) => (
                  <div key={i} className="junkyard-card">
                    <div className="junkyard-name">{yard.name}</div>
                    {yard.distance && (
                      <div className="junkyard-distance">{yard.distance.toFixed(1)} mi away</div>
                    )}
                    {yard.address && <div className="junkyard-address">{yard.address}</div>}
                    {yard.phone && <div className="junkyard-phone">📞 {yard.phone}</div>}
                    {yard.lat && yard.lon && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${yard.lat},${yard.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline"
                      >
                        DIRECTIONS
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="no-results">No salvage yards found nearby via OpenStreetMap. Try the chains below.</p>
          )}

          {result.chains?.length > 0 && (
            <div className="chains-section">
              <h4>MAJOR CHAINS NEAR YOU</h4>
              <div className="chains-grid">
                {result.chains.map((chain, i) => (
                  <a
                    key={i}
                    href={chain.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chain-card"
                  >
                    <span className="chain-name">{chain.name}</span>
                    <span className="chain-arrow">→</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {result.googleSearchUrl && (
            <a
              href={result.googleSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-full"
            >
              🔍 SEARCH GOOGLE MAPS FOR MORE
            </a>
          )}
        </div>
      )}
    </div>
  );
}
