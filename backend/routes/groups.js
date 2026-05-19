const express = require('express');
const crypto = require('crypto');
const { getDB, rowToObject, rowsToObjects } = require('../db/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function generateInviteCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// GET /api/groups/mine
router.get('/mine', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.execute({
      sql: `SELECT g.id, g.name, g.description, g.invite_code, g.created_by, g.created_at,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
            FROM groups g
            INNER JOIN group_members gm ON gm.group_id = g.id
            WHERE gm.user_id = ?
            ORDER BY gm.joined_at DESC`,
      args: [req.user.id]
    });
    res.json({ groups: rowsToObjects(result) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load groups' });
  }
});

// POST /api/groups/create
router.post('/create', authenticate, async (req, res) => {
  const { name, description } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Group name is required' });
  if (name.trim().length > 50) return res.status(400).json({ error: 'Name too long (50 chars max)' });

  try {
    const db = getDB();
    const invite_code = generateInviteCode();
    const result = await db.execute({
      sql: 'INSERT INTO groups (name, description, invite_code, created_by) VALUES (?, ?, ?, ?)',
      args: [name.trim(), description?.trim() || null, invite_code, req.user.id]
    });
    const groupId = Number(result.lastInsertRowid);
    await db.execute({
      sql: 'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      args: [groupId, req.user.id]
    });
    res.json({ id: groupId, name: name.trim(), invite_code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// POST /api/groups/join
router.post('/join', authenticate, async (req, res) => {
  const { invite_code } = req.body;
  if (!invite_code?.trim()) return res.status(400).json({ error: 'Invite code required' });

  try {
    const db = getDB();
    const groupResult = await db.execute({
      sql: 'SELECT * FROM groups WHERE invite_code = ?',
      args: [invite_code.trim().toUpperCase()]
    });
    const group = rowToObject(groupResult);
    if (!group) return res.status(404).json({ error: 'Invalid invite code' });

    const memberCheck = await db.execute({
      sql: 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      args: [group.id, req.user.id]
    });
    if (rowToObject(memberCheck)) {
      return res.json({ id: group.id, name: group.name, already_member: true });
    }
    await db.execute({
      sql: 'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      args: [group.id, req.user.id]
    });
    res.json({ id: group.id, name: group.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// GET /api/groups/preview/:code — group info by invite code (no join)
router.get('/preview/:code', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.execute({
      sql: `SELECT g.id, g.name, g.description,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
            FROM groups g WHERE g.invite_code = ?`,
      args: [req.params.code.toUpperCase()]
    });
    const group = rowToObject(result);
    if (!group) return res.status(404).json({ error: 'Invalid invite code' });
    res.json({ group });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load group' });
  }
});

// GET /api/groups/:id — group detail with leaderboard
router.get('/:id', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const memberCheck = await db.execute({
      sql: 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });
    if (!rowToObject(memberCheck)) return res.status(403).json({ error: 'Not a member of this group' });

    const groupResult = await db.execute({
      sql: 'SELECT * FROM groups WHERE id = ?',
      args: [req.params.id]
    });
    const group = rowToObject(groupResult);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const membersResult = await db.execute({
      sql: `SELECT gm.user_id, gm.active_build_id, gm.active_tier, gm.joined_at,
              u.username,
              b.year, b.make, b.model, b.budget, b.result as build_result
            FROM group_members gm
            JOIN users u ON u.id = gm.user_id
            LEFT JOIN builds b ON b.id = gm.active_build_id
            WHERE gm.group_id = ?
            ORDER BY gm.joined_at ASC`,
      args: [req.params.id]
    });
    const membersRaw = rowsToObjects(membersResult);

    const members = await Promise.all(membersRaw.map(async m => {
      let total_mods = 0;
      let completed_mods = 0;
      let completion = 0;

      if (m.active_build_id && m.build_result) {
        try {
          const buildData = JSON.parse(m.build_result);
          total_mods = buildData[m.active_tier]?.modifications?.length || 0;
          if (total_mods > 0) {
            const progressResult = await db.execute({
              sql: 'SELECT COUNT(*) as count FROM build_progress WHERE build_id = ? AND user_id = ? AND tier = ?',
              args: [m.active_build_id, m.user_id, m.active_tier]
            });
            completed_mods = rowToObject(progressResult)?.count || 0;
            completion = Math.round((completed_mods / total_mods) * 100);
          }
        } catch {}
      }

      return {
        user_id: m.user_id,
        username: m.username,
        joined_at: m.joined_at,
        active_build_id: m.active_build_id,
        active_tier: m.active_tier,
        car: m.active_build_id ? `${m.year} ${m.make} ${m.model}` : null,
        budget: m.budget,
        total_mods,
        completed_mods,
        completion,
      };
    }));

    members.sort((a, b) => b.completion - a.completion);
    res.json({ group, members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load group' });
  }
});

// PUT /api/groups/:id/active-build
router.put('/:id/active-build', authenticate, async (req, res) => {
  const { build_id, tier } = req.body;
  const validTiers = ['budget', 'midrange', 'fullsend'];
  if (!validTiers.includes(tier)) return res.status(400).json({ error: 'Invalid tier' });

  try {
    const db = getDB();
    const memberCheck = await db.execute({
      sql: 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });
    if (!rowToObject(memberCheck)) return res.status(403).json({ error: 'Not a member' });

    if (build_id) {
      const buildCheck = await db.execute({
        sql: 'SELECT id FROM builds WHERE id = ? AND user_id = ?',
        args: [build_id, req.user.id]
      });
      if (!rowToObject(buildCheck)) return res.status(403).json({ error: 'Build not found' });
    }

    await db.execute({
      sql: 'UPDATE group_members SET active_build_id = ?, active_tier = ? WHERE group_id = ? AND user_id = ?',
      args: [build_id || null, tier, req.params.id, req.user.id]
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update active build' });
  }
});

// POST /api/groups/:id/progress — toggle a mod completion
router.post('/:id/progress', authenticate, async (req, res) => {
  const { build_id, tier, mod_index } = req.body;
  if (build_id === undefined || !tier || mod_index === undefined) {
    return res.status(400).json({ error: 'build_id, tier, mod_index required' });
  }

  try {
    const db = getDB();
    const memberCheck = await db.execute({
      sql: 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });
    if (!rowToObject(memberCheck)) return res.status(403).json({ error: 'Not a member' });

    const buildCheck = await db.execute({
      sql: 'SELECT id FROM builds WHERE id = ? AND user_id = ?',
      args: [build_id, req.user.id]
    });
    if (!rowToObject(buildCheck)) return res.status(403).json({ error: 'Build not found' });

    const existing = await db.execute({
      sql: 'SELECT id FROM build_progress WHERE build_id = ? AND user_id = ? AND tier = ? AND mod_index = ?',
      args: [build_id, req.user.id, tier, mod_index]
    });

    if (rowToObject(existing)) {
      await db.execute({
        sql: 'DELETE FROM build_progress WHERE build_id = ? AND user_id = ? AND tier = ? AND mod_index = ?',
        args: [build_id, req.user.id, tier, mod_index]
      });
      res.json({ completed: false });
    } else {
      await db.execute({
        sql: 'INSERT INTO build_progress (build_id, user_id, tier, mod_index) VALUES (?, ?, ?, ?)',
        args: [build_id, req.user.id, tier, mod_index]
      });
      res.json({ completed: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// GET /api/groups/:id/progress/:buildId
router.get('/:id/progress/:buildId', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const result = await db.execute({
      sql: 'SELECT tier, mod_index FROM build_progress WHERE build_id = ? AND user_id = ?',
      args: [req.params.buildId, req.user.id]
    });
    res.json({ progress: rowsToObjects(result) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load progress' });
  }
});

// GET /api/groups/:id/build/:buildId — view a group member's build
router.get('/:id/build/:buildId', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const memberCheck = await db.execute({
      sql: 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });
    if (!rowToObject(memberCheck)) return res.status(403).json({ error: 'Not a member' });

    const buildResult = await db.execute({
      sql: `SELECT b.*, u.username FROM builds b
            JOIN users u ON u.id = b.user_id
            WHERE b.id = ? AND b.user_id IN (
              SELECT user_id FROM group_members WHERE group_id = ?
            )`,
      args: [req.params.buildId, req.params.id]
    });
    const build = rowToObject(buildResult);
    if (!build) return res.status(404).json({ error: 'Build not found' });

    try { build.result = JSON.parse(build.result); } catch {}
    res.json({ build });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load build' });
  }
});

// POST /api/groups/:id/comments
router.post('/:id/comments', authenticate, async (req, res) => {
  const { build_id, content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
  if (content.trim().length > 500) return res.status(400).json({ error: 'Max 500 characters' });

  try {
    const db = getDB();
    const memberCheck = await db.execute({
      sql: 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });
    if (!rowToObject(memberCheck)) return res.status(403).json({ error: 'Not a member' });

    const result = await db.execute({
      sql: 'INSERT INTO group_comments (group_id, build_id, user_id, content) VALUES (?, ?, ?, ?)',
      args: [req.params.id, build_id, req.user.id, content.trim()]
    });
    res.json({
      id: Number(result.lastInsertRowid),
      content: content.trim(),
      username: req.user.username,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// GET /api/groups/:id/comments/:buildId
router.get('/:id/comments/:buildId', authenticate, async (req, res) => {
  try {
    const db = getDB();
    const memberCheck = await db.execute({
      sql: 'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });
    if (!rowToObject(memberCheck)) return res.status(403).json({ error: 'Not a member' });

    const result = await db.execute({
      sql: `SELECT gc.id, gc.content, gc.created_at, u.username
            FROM group_comments gc
            JOIN users u ON u.id = gc.user_id
            WHERE gc.group_id = ? AND gc.build_id = ?
            ORDER BY gc.created_at ASC`,
      args: [req.params.id, req.params.buildId]
    });
    res.json({ comments: rowsToObjects(result) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

// DELETE /api/groups/:id/leave
router.delete('/:id/leave', authenticate, async (req, res) => {
  try {
    const db = getDB();
    await db.execute({
      sql: 'DELETE FROM group_members WHERE group_id = ? AND user_id = ?',
      args: [req.params.id, req.user.id]
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to leave group' });
  }
});

module.exports = router;
