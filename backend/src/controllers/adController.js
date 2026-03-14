const { query } = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

const createAd = async (req, res, next) => {
  try {
    const { advertiserName, title, description, imageUrl, linkUrl, placement,
            routeOriginLat, routeOriginLng, routeDestLat, routeDestLng,
            routeRadiusKm, budgetCents, costPerImpressionCents, startsAt, endsAt } = req.body;

    const result = await query(
      `INSERT INTO ads (advertiser_name, title, description, image_url, link_url, placement,
        route_origin_lat, route_origin_lng, route_dest_lat, route_dest_lng,
        route_radius_km, budget_cents, cost_per_impression_cents, starts_at, ends_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [advertiserName, title, description || null, imageUrl || null, linkUrl || null,
       placement || 'search', routeOriginLat || null, routeOriginLng || null,
       routeDestLat || null, routeDestLng || null, routeRadiusKm || 50,
       budgetCents || 0, costPerImpressionCents || 1, startsAt || new Date(), endsAt || null]
    );
    res.status(201).json({ ad: formatAd(result.rows[0]) });
  } catch (err) { next(err); }
};

const getAdsForPlacement = async (req, res, next) => {
  try {
    const { placement, lat, lng, limit: lim = 3 } = req.query;
    let where = `WHERE is_active = TRUE AND (starts_at <= NOW()) AND (ends_at IS NULL OR ends_at > NOW())
                 AND (budget_cents = 0 OR spent_cents < budget_cents)`;
    const values = [];
    let idx = 1;

    if (placement && placement !== 'all') {
      where += ` AND (placement = $${idx} OR placement = 'all')`;
      values.push(placement);
      idx++;
    }

    values.push(parseInt(lim, 10));
    const result = await query(
      `SELECT * FROM ads ${where} ORDER BY RANDOM() LIMIT $${idx}`, values
    );

    if (result.rows.length > 0) {
      const ids = result.rows.map((a) => a.id);
      await query(
        `UPDATE ads SET impressions = impressions + 1,
         spent_cents = spent_cents + cost_per_impression_cents
         WHERE id = ANY($1)`,
        [ids]
      );
    }

    res.json({ ads: result.rows.map(formatAd) });
  } catch (err) { next(err); }
};

const recordClick = async (req, res, next) => {
  try {
    await query('UPDATE ads SET clicks = clicks + 1 WHERE id = $1', [req.params.id]);
    res.json({ message: 'Click recorded' });
  } catch (err) { next(err); }
};

const getAdStats = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM ads WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) throw new AppError('Ad not found', 404);
    const ad = result.rows[0];
    res.json({
      ad: formatAd(ad),
      stats: {
        impressions: ad.impressions,
        clicks: ad.clicks,
        ctr: ad.impressions > 0 ? parseFloat(((ad.clicks / ad.impressions) * 100).toFixed(2)) : 0,
        spent: (ad.spent_cents / 100).toFixed(2),
        budgetRemaining: ((ad.budget_cents - ad.spent_cents) / 100).toFixed(2),
      },
    });
  } catch (err) { next(err); }
};

const updateAd = async (req, res, next) => {
  try {
    const { isActive, title, description, imageUrl, endsAt, budgetCents } = req.body;
    const sets = [];
    const values = [];
    let idx = 1;
    if (isActive !== undefined) { sets.push(`is_active = $${idx++}`); values.push(isActive); }
    if (title) { sets.push(`title = $${idx++}`); values.push(title); }
    if (description !== undefined) { sets.push(`description = $${idx++}`); values.push(description); }
    if (imageUrl !== undefined) { sets.push(`image_url = $${idx++}`); values.push(imageUrl); }
    if (endsAt !== undefined) { sets.push(`ends_at = $${idx++}`); values.push(endsAt); }
    if (budgetCents !== undefined) { sets.push(`budget_cents = $${idx++}`); values.push(budgetCents); }
    if (sets.length === 0) throw new AppError('No fields to update', 400);
    sets.push('updated_at = NOW()');
    values.push(req.params.id);

    await query(`UPDATE ads SET ${sets.join(', ')} WHERE id = $${idx}`, values);
    res.json({ message: 'Ad updated' });
  } catch (err) { next(err); }
};

function formatAd(a) {
  return {
    id: a.id, advertiserName: a.advertiser_name, title: a.title,
    description: a.description, imageUrl: a.image_url, linkUrl: a.link_url,
    placement: a.placement, isActive: a.is_active,
    impressions: a.impressions, clicks: a.clicks,
  };
}

module.exports = { createAd, getAdsForPlacement, recordClick, getAdStats, updateAd };
