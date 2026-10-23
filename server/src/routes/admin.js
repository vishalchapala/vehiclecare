const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/users', c.listUsers);
router.get('/stats', c.stats);
router.patch(
  '/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid ID'),
    body('isApproved').optional().isBoolean().withMessage('isApproved must be true or false'),
    body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
  ],
  validate,
  c.updateUser
);

module.exports = router;
