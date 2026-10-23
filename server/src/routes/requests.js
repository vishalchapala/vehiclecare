const router = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/requestController');
const { CATEGORIES, STATUSES } = require('../utils/statusRules');

const id = param('id').isMongoId().withMessage('Invalid ID');

router.use(protect);

router.post(
  '/',
  authorize('customer'),
  [
    body('vehicle').isMongoId().withMessage('Select a vehicle'),
    body('category').isIn(CATEGORIES).withMessage('Choose a valid breakdown category'),
    body('description').trim().isLength({ min: 10, max: 500 }).withMessage('Describe the problem in 10 to 500 characters'),
    body('address').trim().isLength({ min: 5, max: 250 }).withMessage('Enter the location or address'),
    body('latitude').optional({ values: 'falsy' }).isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('longitude').optional({ values: 'falsy' }).isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
    body('contactPhone').trim().matches(/^[0-9]{10}$/).withMessage('Contact number must be 10 digits'),
  ],
  validate,
  c.create
);

router.get(
  '/',
  [query('status').optional().isIn(STATUSES).withMessage('Invalid status')],
  validate,
  c.list
);

router.get('/:id', id, validate, c.getOne);

router.patch(
  '/:id/assign',
  authorize('admin'),
  [id, body('providerId').isMongoId().withMessage('Select a provider')],
  validate,
  c.assign
);

router.patch(
  '/:id/status',
  [
    id,
    body('status').isIn(STATUSES).withMessage('Invalid status'),
    body('note').optional().isLength({ max: 300 }).withMessage('Note can be at most 300 characters'),
    body('notes').optional().isLength({ max: 500 }).withMessage('Notes can be at most 500 characters'),
    body('estimatedCost').optional().isFloat({ min: 0 }).withMessage('Estimated cost must be 0 or more'),
    body('finalCost').optional().isFloat({ min: 0 }).withMessage('Final cost must be 0 or more'),
  ],
  validate,
  c.updateStatus
);

module.exports = router;
