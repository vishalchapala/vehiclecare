const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/vehicleController');

const rules = [
  body('type').isIn(['car', 'bike', 'auto', 'truck', 'bus', 'other']).withMessage('Choose a valid vehicle type'),
  body('make').trim().isLength({ min: 1, max: 50 }).withMessage('Manufacturer is required'),
  body('model').trim().isLength({ min: 1, max: 50 }).withMessage('Model is required'),
  body('registrationNumber').trim().isLength({ min: 4, max: 20 }).withMessage('Enter a valid registration number'),
  body('fuelType').isIn(['petrol', 'diesel', 'electric', 'cng', 'hybrid']).withMessage('Choose a valid fuel type'),
  body('year').optional({ values: 'falsy' }).isInt({ min: 1950, max: new Date().getFullYear() + 1 }).withMessage('Enter a valid year'),
  body('notes').optional().isLength({ max: 300 }).withMessage('Notes can be at most 300 characters'),
];

const id = param('id').isMongoId().withMessage('Invalid ID');

router.use(protect, authorize('customer'));

router.get('/', c.list);
router.post('/', rules, validate, c.create);
router.put('/:id', id, rules, validate, c.update);
router.delete('/:id', id, validate, c.remove);

module.exports = router;
