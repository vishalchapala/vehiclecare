const router = require('express').Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const c = require('../controllers/contactController');

// Public form, so it is rate limited to stop spam.
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages. Please try again later.' },
});

router.post(
  '/',
  limiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your name'),
    body('email').trim().isEmail().withMessage('Enter a valid email address'),
    body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be 10 to 1000 characters'),
  ],
  validate,
  c.create
);

module.exports = router;
