const router = require('express').Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { register, login, me, setAvailability } = require('../controllers/authController');

// Slows down password-guessing attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});

const email = body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail();

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2 to 80 characters'),
    email,
    body('phone').trim().matches(/^[0-9]{10}$/).withMessage('Phone must be a 10-digit number'),
    body('password')
      .isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters')
      .matches(/[A-Za-z]/).withMessage('Password needs at least one letter')
      .matches(/[0-9]/).withMessage('Password needs at least one number'),
    // Admin can never be chosen here.
    body('role').isIn(['customer', 'provider']).withMessage('Role must be customer or provider'),
  ],
  validate,
  register
);

router.post(
  '/login',
  authLimiter,
  [email, body('password').notEmpty().withMessage('Password is required')],
  validate,
  login
);

router.get('/me', protect, me);
router.patch(
  '/availability',
  protect,
  authorize('provider'),
  body('isAvailable').isBoolean().withMessage('isAvailable must be true or false'),
  validate,
  setAvailability
);

module.exports = router;
