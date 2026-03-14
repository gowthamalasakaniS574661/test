const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');
const { calculateTrustScore, recalculateAndSave } = require('../services/trustScoreService');

const getTrustScore = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    const userRes = await query(
      'SELECT id, first_name, last_name, role, trust_score, total_ratings, trust_score_updated_at FROM users WHERE id = $1',
      [userId]
    );
    if (userRes.rows.length === 0) throw new AppError('User not found', 404);

    const result = await calculateTrustScore(userId);
    const user = userRes.rows[0];

    res.json({
      userId,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      currentScore: user.trust_score,
      totalRatings: user.total_ratings,
      lastUpdated: user.trust_score_updated_at,
      breakdown: result,
    });
  } catch (err) {
    next(err);
  }
};

const getMyTrustScore = async (req, res, next) => {
  try {
    const result = await calculateTrustScore(req.user.id);
    if (!result) throw new AppError('Could not calculate trust score', 500);

    const userRes = await query(
      'SELECT trust_score, total_ratings, trust_score_updated_at FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      currentScore: userRes.rows[0].trust_score,
      totalRatings: userRes.rows[0].total_ratings,
      lastUpdated: userRes.rows[0].trust_score_updated_at,
      breakdown: result,
    });
  } catch (err) {
    next(err);
  }
};

const recalculate = async (req, res, next) => {
  try {
    const result = await recalculateAndSave(req.user.id);
    if (!result) throw new AppError('Could not recalculate trust score', 500);

    res.json({
      message: 'Trust score recalculated',
      newScore: result.overallScore,
      breakdown: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTrustScore, getMyTrustScore, recalculate };
