const router = require('express').Router();
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/requestController');
const { CATEGORIES, STATUSES } = require('../utils/statusRules');

const id = param('id').isMongoId().withMessage('Invalid ID');
const isMaintenance = (v, { req }) => req.body.type === 'maintenance';
const isBreakdown = (v, { req }) => req.body.type !== 'maintenance';

router.use(protect);

router.post(
  '/',
  authorize('customer'),
  [
    body('type').optional().isIn(['breakdown', 'maintenance']).withMessage('Invalid request type'),
    body('vehicle').isMongoId().withMessage('Select a vehicle'),
    // Breakdown requests choose a category from our fixed list.
    body('category').if(isBreakdown).isIn(CATEGORIES).withMessage('Choose a valid breakdown category'),
    // Maintenance requests choose a service and a date.
    body('serviceCategory').if(isMaintenance).isMongoId().withMessage('Select a service'),
    body('preferredDate')
      .if(isMaintenance)
      .isISO8601().withMessage('Choose a preferred date')
      .custom((v) => {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        return new Date(v) >= today;
      })
      .withMessage('Preferred date cannot be in the past'),
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
  [
    query('status').optional().isIn(STATUSES).withMessage('Invalid status'),
    query('type').optional().isIn(['breakdown', 'maintenance']).withMessage('Invalid type'),
    query('scope').optional().isIn(['open']).withMessage('Invalid scope'),
  ],
  validate,
  c.list
);

router.get('/:id', id, validate, c.getOne);

router.patch('/:id/claim', authorize('provider'), id, validate, c.claim);

router.patch(
  '/:id/status',
  authorize('customer', 'provider'),
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
