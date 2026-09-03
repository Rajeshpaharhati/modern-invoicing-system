/**
 * Strict server-side tier gate middleware
 * Enforces that only users with role === 'premium' can access custom branding endpoints.
 * Returns HTTP 403 Forbidden if accessed by free tier users.
 */
const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (req.user.role !== 'premium') {
    return res.status(403).json({
      success: false,
      error: 'Feature Restricted: Custom branding (logo upload and positioning) is exclusively available to Premium tier subscribers.',
      upgradeRequired: true
    });
  }

  next();
};

module.exports = requirePremium;
