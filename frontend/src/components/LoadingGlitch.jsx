import React, { useEffect, useState } from 'react';

const MESSAGES = [
  'SCANNING PARTS DATABASE...',
  'QUERYING JUNKYARD NETWORKS...',
  'CALCULATING MOD COSTS...',
  'CROSS-REFERENCING BUILD SPECS...',
  'OPTIMIZING POWER CURVES...',
  'ANALYZING BUDGET CONSTRAINTS...',
  'SOURCING AFTERMARKET PARTS...',
  'COMPILING BUILD TIERS...',
];

export default function LoadingGlitch() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMsgIdx(i => (i + 1) % MESSAGES.length);
    }, 800);
    const progInterval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 8, 92));
    }, 400);
    return () => {
      clearInterval(msgInterval);
      clearInterval(progInterval);
    };
  }, []);

  return (
    <div className="loading-container">
      <div className="loading-icon">⚡</div>
      <div className="loading-text">{MESSAGES[msgIdx]}</div>
      <div className="loading-bar">
        <div className="loading-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="loading-subtext">Claude AI is generating your build plans...</div>
    </div>
  );
}
