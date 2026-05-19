import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import GlitchText from '../components/GlitchText';

const TIER_LABELS = { budget: 'BUDGET', midrange: 'MID-RANGE', fullsend: 'FULL SEND' };
const TIER_COLORS = { budget: 'var(--cyan)', midrange: '#c44cff', fullsend: 'var(--orange)' };

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [expanded, setExpanded] = useState(null); // user_id
  const [buildCache, setBuildCache] = useState({});   // { [userId]: { build, comments, tier } }
  const [myProgress, setMyProgress] = useState({});   // { 'tier_idx': true }
  const [loadingExpand, setLoadingExpand] = useState(null);

  const [commentText, setCommentText] = useState({});  // { [buildId]: text }
  const [postingComment, setPostingComment] = useState(null);

  const [showSetBuild, setShowSetBuild] = useState(false);
  const [myBuilds, setMyBuilds] = useState([]);
  const [activeBuildForm, setActiveBuildForm] = useState({ build_id: '', tier: 'budget' });
  const [settingBuild, setSettingBuild] = useState(false);
  const [setBuildError, setSetBuildError] = useState('');

  const [copied, setCopied] = useState(false);

  const loadGroup = useCallback(async () => {
    try {
      const res = await axios.get(`/api/groups/${id}`);
      setGroup(res.data.group);
      setMembers(res.data.members);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('You are not a member of this group.');
      } else {
        setError('Failed to load group.');
      }
    }
  }, [id]);

  useEffect(() => {
    loadGroup().finally(() => setLoading(false));
  }, [loadGroup]);

  const expandMember = async (member) => {
    if (expanded === member.user_id) {
      setExpanded(null);
      return;
    }
    setExpanded(member.user_id);
    if (!member.active_build_id) return;

    if (buildCache[member.user_id]) return; // already loaded

    setLoadingExpand(member.user_id);
    try {
      const [buildRes, commentsRes] = await Promise.all([
        axios.get(`/api/groups/${id}/build/${member.active_build_id}`),
        axios.get(`/api/groups/${id}/comments/${member.active_build_id}`)
      ]);
      const newCache = {
        build: buildRes.data.build,
        comments: commentsRes.data.comments,
        tier: member.active_tier
      };

      // If viewing own build, also load progress
      if (member.user_id === user.id) {
        const progressRes = await axios.get(`/api/groups/${id}/progress/${member.active_build_id}`);
        const map = {};
        progressRes.data.progress.forEach(p => { map[`${p.tier}_${p.mod_index}`] = true; });
        setMyProgress(map);
      }

      setBuildCache(prev => ({ ...prev, [member.user_id]: newCache }));
    } catch {
      // silently fail, show "couldn't load"
    } finally {
      setLoadingExpand(null);
    }
  };

  const toggleMod = async (buildId, tier, modIndex) => {
    const key = `${tier}_${modIndex}`;
    const willComplete = !myProgress[key];
    setMyProgress(prev => ({ ...prev, [key]: willComplete }));
    try {
      await axios.post(`/api/groups/${id}/progress`, { build_id: buildId, tier, mod_index: modIndex });
      loadGroup(); // refresh leaderboard
    } catch {
      setMyProgress(prev => ({ ...prev, [key]: !willComplete })); // revert
    }
  };

  const postComment = async (buildId, userId) => {
    const content = commentText[buildId]?.trim();
    if (!content) return;
    setPostingComment(buildId);
    try {
      const res = await axios.post(`/api/groups/${id}/comments`, { build_id: buildId, content });
      setBuildCache(prev => ({
        ...prev,
        [userId]: {
          ...prev[userId],
          comments: [...(prev[userId]?.comments || []), res.data]
        }
      }));
      setCommentText(prev => ({ ...prev, [buildId]: '' }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post comment');
    } finally {
      setPostingComment(null);
    }
  };

  const openSetBuild = async () => {
    if (myBuilds.length === 0) {
      try {
        const res = await axios.get('/api/builds/history');
        setMyBuilds(res.data.builds || []);
      } catch {}
    }
    // Pre-fill with current active build
    const me = members.find(m => m.user_id === user.id);
    if (me?.active_build_id) {
      setActiveBuildForm({ build_id: String(me.active_build_id), tier: me.active_tier || 'budget' });
    }
    setShowSetBuild(true);
    setSetBuildError('');
  };

  const saveActiveBuild = async () => {
    if (!activeBuildForm.build_id) { setSetBuildError('Select a build'); return; }
    setSettingBuild(true);
    try {
      await axios.put(`/api/groups/${id}/active-build`, {
        build_id: Number(activeBuildForm.build_id),
        tier: activeBuildForm.tier
      });
      // Clear cached build for self so it reloads on next expand
      setBuildCache(prev => { const n = { ...prev }; delete n[user.id]; return n; });
      setMyProgress({});
      setExpanded(null);
      setShowSetBuild(false);
      await loadGroup();
    } catch (err) {
      setSetBuildError(err.response?.data?.error || 'Failed to save');
    } finally {
      setSettingBuild(false);
    }
  };

  const copyInvite = () => {
    const link = `${window.location.origin}/groups/join/${group.invite_code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const leaveGroup = async () => {
    if (!confirm('Leave this crew?')) return;
    try {
      await axios.delete(`/api/groups/${id}/leave`);
      navigate('/groups');
    } catch {}
  };

  if (loading) return (
    <main className="page-groups">
      <div className="container">
        <div className="loading-text">LOADING CREW...</div>
      </div>
    </main>
  );

  if (error) return (
    <main className="page-groups">
      <div className="container">
        <div className="alert alert-error">{error}</div>
      </div>
    </main>
  );

  const myMember = members.find(m => m.user_id === user.id);

  return (
    <main className="page-groups">
      <div className="container">

        {/* Group Header */}
        <div className="group-detail-header">
          <div>
            <GlitchText text={group?.name?.toUpperCase()} tag="h2" className="page-title" />
            {group?.description && <p className="group-detail-desc">{group.description}</p>}
          </div>
          <div className="group-detail-actions">
            <button className="btn btn-outline btn-sm" onClick={copyInvite}>
              {copied ? '✓ COPIED!' : '🔗 SHARE INVITE'}
            </button>
            <button className="btn btn-sm btn-danger" onClick={leaveGroup}>LEAVE</button>
          </div>
        </div>

        <div className="group-invite-bar">
          <span className="group-invite-label">INVITE CODE:</span>
          <span className="group-invite-code">{group?.invite_code}</span>
          <span className="group-invite-hint">— share this code or the invite link with friends</span>
        </div>

        {/* Your Setup */}
        <div className="group-my-setup card">
          <div className="group-my-setup-row">
            <div>
              <span className="group-section-label">YOUR ACTIVE BUILD</span>
              {myMember?.car ? (
                <span className="group-my-car">
                  {myMember.car}
                  <span className="group-my-tier" style={{ color: TIER_COLORS[myMember.active_tier] }}>
                    {' '}— {TIER_LABELS[myMember.active_tier]}
                  </span>
                  <span className="group-my-progress"> · {myMember.completed_mods}/{myMember.total_mods} mods</span>
                </span>
              ) : (
                <span className="group-my-car text-muted">Not set — pick a build to track</span>
              )}
            </div>
            <button className="btn btn-outline btn-sm" onClick={openSetBuild}>
              {myMember?.active_build_id ? '✎ CHANGE BUILD' : '+ SET BUILD'}
            </button>
          </div>
        </div>

        {/* Set Active Build Modal */}
        {showSetBuild && (
          <div className="group-form-panel card">
            <h3 className="group-form-title">SET ACTIVE BUILD</h3>
            <p className="group-form-sub">Choose which build the crew can see your progress on.</p>
            {setBuildError && <div className="alert alert-error">{setBuildError}</div>}
            <div className="form-group">
              <label className="label">BUILD</label>
              <select
                className="input"
                value={activeBuildForm.build_id}
                onChange={e => setActiveBuildForm(f => ({ ...f, build_id: e.target.value }))}
              >
                <option value="">— select a build —</option>
                {myBuilds.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.year} {b.make} {b.model} (${Number(b.budget).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">TIER TO TRACK</label>
              <select
                className="input"
                value={activeBuildForm.tier}
                onChange={e => setActiveBuildForm(f => ({ ...f, tier: e.target.value }))}
              >
                <option value="budget">Budget</option>
                <option value="midrange">Mid-Range</option>
                <option value="fullsend">Full Send</option>
              </select>
            </div>
            <div className="group-form-actions">
              <button className="btn btn-primary" onClick={saveActiveBuild} disabled={settingBuild}>
                {settingBuild ? 'SAVING...' : '✓ SAVE'}
              </button>
              <button className="btn btn-outline" onClick={() => setShowSetBuild(false)}>CANCEL</button>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="group-leaderboard card">
          <h3 className="group-section-title">🏆 CREW LEADERBOARD</h3>
          {members.length === 0 ? (
            <p className="text-muted">No members yet.</p>
          ) : (
            <div className="leaderboard-list">
              {members.map((m, i) => {
                const isExpanded = expanded === m.user_id;
                const isMe = m.user_id === user.id;
                const cached = buildCache[m.user_id];
                const tierColor = TIER_COLORS[m.active_tier] || 'var(--cyan)';

                return (
                  <div key={m.user_id} className={`leaderboard-row ${isMe ? 'leaderboard-row-me' : ''}`}>
                    <div
                      className="leaderboard-row-header"
                      onClick={() => expandMember(m)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === 'Enter' && expandMember(m)}
                    >
                      <div className="leaderboard-rank">
                        {i === 0 && m.completion > 0 ? '🥇' : i === 1 && m.completion > 0 ? '🥈' : i === 2 && m.completion > 0 ? '🥉' : `#${i + 1}`}
                      </div>
                      <div className="leaderboard-user">
                        <span className="leaderboard-username">
                          {m.username}{isMe && <span className="leaderboard-you"> (you)</span>}
                        </span>
                        {m.car ? (
                          <span className="leaderboard-car">
                            {m.car}
                            <span className="leaderboard-tier" style={{ color: tierColor }}>
                              {' '}· {TIER_LABELS[m.active_tier]}
                            </span>
                          </span>
                        ) : (
                          <span className="leaderboard-car text-muted">no build set</span>
                        )}
                      </div>
                      <div className="leaderboard-progress-wrap">
                        <div className="leaderboard-pct" style={{ color: tierColor }}>
                          {m.completion}%
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${m.completion}%`, background: `linear-gradient(90deg, ${tierColor}, var(--purple))` }}
                          />
                        </div>
                        <div className="leaderboard-mods">{m.completed_mods}/{m.total_mods} mods</div>
                      </div>
                      <div className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</div>
                    </div>

                    {isExpanded && (
                      <div className="leaderboard-expanded">
                        {loadingExpand === m.user_id ? (
                          <div className="loading-text" style={{ padding: '1rem' }}>LOADING BUILD...</div>
                        ) : !m.active_build_id ? (
                          <div className="group-no-build">
                            {isMe ? (
                              <p>Set your active build above so the crew can see your progress.</p>
                            ) : (
                              <p>{m.username} hasn't set a build yet.</p>
                            )}
                          </div>
                        ) : cached ? (
                          <BuildViewer
                            build={cached.build}
                            tier={cached.tier}
                            isMe={isMe}
                            myProgress={isMe ? myProgress : null}
                            onToggleMod={isMe ? toggleMod : null}
                            groupId={id}
                            comments={cached.comments}
                            commentText={commentText[cached.build?.id] || ''}
                            onCommentChange={text => setCommentText(prev => ({ ...prev, [cached.build?.id]: text }))}
                            onPostComment={() => postComment(cached.build?.id, m.user_id)}
                            postingComment={postingComment === cached.build?.id}
                            currentUser={user}
                          />
                        ) : (
                          <div className="loading-text" style={{ padding: '1rem' }}>LOADING...</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function BuildViewer({ build, tier, isMe, myProgress, onToggleMod, comments, commentText, onCommentChange, onPostComment, postingComment, currentUser }) {
  const [activeTier, setActiveTier] = useState(tier);

  if (!build) return null;

  const result = typeof build.result === 'string' ? JSON.parse(build.result) : build.result;
  const tierData = result?.[activeTier];
  const tiers = [
    { key: 'budget', label: 'BUDGET' },
    { key: 'midrange', label: 'MID-RANGE' },
    { key: 'fullsend', label: 'FULL SEND' },
  ];

  return (
    <div className="build-viewer">
      <div className="build-viewer-title">
        {build.year} {build.make} {build.model} — ${Number(build.budget).toLocaleString()} budget
      </div>

      <div className="tier-tabs" style={{ marginBottom: '1rem' }}>
        {tiers.map(t => (
          <button
            key={t.key}
            className={`tier-tab tier-tab-${t.key} ${activeTier === t.key ? 'active' : ''}`}
            onClick={() => setActiveTier(t.key)}
          >
            {t.label}
            {result?.[t.key]?.total_cost && (
              <span className="tier-tab-cost">${result[t.key].total_cost.toLocaleString()}</span>
            )}
          </button>
        ))}
      </div>

      {tierData ? (
        <div className="build-viewer-mods">
          <p className="build-viewer-summary">{tierData.summary}</p>
          <div className="build-viewer-stats">
            {tierData.estimated_hp_gain && <span>+{tierData.estimated_hp_gain} hp</span>}
            <span>{tierData.time_estimate}</span>
            <span>{tierData.difficulty}</span>
          </div>
          <div className="mods-checklist">
            {tierData.modifications?.map((mod, i) => {
              const key = `${activeTier}_${i}`;
              const done = isMe && myProgress ? !!myProgress[key] : false;
              return (
                <div key={i} className={`mod-check-item ${done ? 'mod-done' : ''}`}>
                  {isMe ? (
                    <button
                      className={`mod-check-btn ${done ? 'checked' : ''}`}
                      onClick={() => onToggleMod(build.id, activeTier, i)}
                      title={done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {done ? '✓' : '○'}
                    </button>
                  ) : (
                    <span className="mod-check-dot">•</span>
                  )}
                  <div className="mod-check-info">
                    <span className="mod-check-name">{mod.name}</span>
                    <span className="mod-check-cost">${mod.cost?.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {isMe && (
            <p className="mod-check-hint">Click the circles to mark mods as complete and update your leaderboard position.</p>
          )}
        </div>
      ) : (
        <p className="text-muted">No data for this tier.</p>
      )}

      {/* Comments */}
      <div className="build-comments">
        <h5 className="build-comments-title">💬 CREW COMMENTS</h5>
        {comments?.length === 0 && <p className="build-comments-empty">No comments yet — be the first!</p>}
        <div className="comments-list">
          {comments?.map(c => (
            <div key={c.id} className={`comment ${c.username === currentUser?.username ? 'comment-mine' : ''}`}>
              <span className="comment-user">{c.username}</span>
              <span className="comment-text">{c.content}</span>
              <span className="comment-time">{new Date(c.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
        <div className="comment-form">
          <input
            className="input comment-input"
            placeholder="Add a comment..."
            value={commentText}
            onChange={e => onCommentChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !postingComment && onPostComment()}
            maxLength={500}
          />
          <button
            className="btn btn-outline btn-sm"
            onClick={onPostComment}
            disabled={postingComment || !commentText?.trim()}
          >
            {postingComment ? '...' : 'POST'}
          </button>
        </div>
      </div>
    </div>
  );
}
