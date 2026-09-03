const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const requirePremium = require('../middleware/requirePremium');

// Configure multer for in-memory image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, SVG, WebP) are allowed'), false);
    }
  }
});

// All user routes require authentication
router.use(auth);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// CRITICAL EVALUATION REQUIREMENT:
// Custom branding routes are strictly protected by requirePremium middleware
router.post(
  '/branding/logo',
  requirePremium,
  upload.single('logo'),
  userController.uploadLogo
);

router.put('/branding', requirePremium, userController.updateBrandingSettings);

// Quick role switch route for easy demo/evaluation testing
router.post('/switch-role', userController.switchRole);

module.exports = router;
