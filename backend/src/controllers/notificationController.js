const { query } = require('../config/database');

const getMyNotifications = async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    let where = 'WHERE user_id = $1';
    if (unreadOnly === 'true') where += ' AND is_read = FALSE';

    const result = await query(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    const unreadCount = await query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [req.user.id]
    );
    res.json({
      notifications: result.rows.map((n) => ({
        id: n.id, type: n.type, title: n.title, body: n.body,
        data: n.data, isRead: n.is_read, createdAt: n.created_at,
      })),
      unreadCount: parseInt(unreadCount.rows[0].count, 10),
    });
  } catch (err) { next(err); }
};

const markAsRead = async (req, res, next) => {
  try {
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'All marked as read' });
  } catch (err) { next(err); }
};

module.exports = { getMyNotifications, markAsRead, markAllRead };
