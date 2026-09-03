const User = require('../models/User');

// GET /api/users/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, companyName, companyAddress, companyPhone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (!user.branding) user.branding = {};

    if (companyName !== undefined) user.branding.companyName = companyName.trim();
    if (companyAddress !== undefined) user.branding.companyAddress = companyAddress.trim();
    if (companyPhone !== undefined) user.branding.companyPhone = companyPhone.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/branding/logo - STRICTLY GATED TO PREMIUM USERS
exports.uploadLogo = async (req, res, next) => {
  try {
    // Secondary defensive gate in controller
    if (req.user.role !== 'premium') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Custom logo upload is only available to Premium tier accounts.',
        upgradeRequired: true
      });
    }

    let logoDataUrl = null;

    if (req.file) {
      // Buffer from multer memoryStorage converted to base64 Data URL
      const mime = req.file.mimetype;
      const base64 = req.file.buffer.toString('base64');
      logoDataUrl = `data:${mime};base64,${base64}`;
    } else if (req.body.logoBase64) {
      logoDataUrl = req.body.logoBase64;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No image file or logo data provided.'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user.branding) user.branding = {};
    user.branding.logo = logoDataUrl;

    if (req.body.logoPosition && ['top-left', 'top-right'].includes(req.body.logoPosition)) {
      user.branding.logoPosition = req.body.logoPosition;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Brand logo uploaded successfully',
      data: user.branding
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/branding - STRICTLY GATED TO PREMIUM USERS
exports.updateBrandingSettings = async (req, res, next) => {
  try {
    if (req.user.role !== 'premium') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Custom branding positioning is only available to Premium tier accounts.',
        upgradeRequired: true
      });
    }

    const { logoPosition, removeLogo } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.branding) user.branding = {};

    if (logoPosition && ['top-left', 'top-right'].includes(logoPosition)) {
      user.branding.logoPosition = logoPosition;
    }

    if (removeLogo) {
      user.branding.logo = null;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Branding settings updated',
      data: user.branding
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/users/switch-role (Developer / Evaluator sandbox switcher)
exports.switchRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['free', 'premium'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role. Must be 'free' or 'premium'."
      });
    }

    const user = await User.findById(req.user._id);
    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Account tier switched to '${role}'`,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
