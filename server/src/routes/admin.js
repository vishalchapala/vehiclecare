const router = require('express').Router();
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/adminController');

router.use(protect, authorize('admin'));

router.get('/users', c.listUsers);
router.get('/vehicles', c.listVehicles);
router.get('/stats', c.stats);
router.patch(
  '/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid ID'),
    body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
  ],
  validate,
  c.updateUser
);

const serviceRules = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Service name must be 2 to 80 characters'),
  body('description').optional().isLength({ max: 300 }).withMessage('Description can be at most 300 characters'),
  body('estimatedPrice').optional().isFloat({ min: 0 }).withMessage('Price must be 0 or more'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
];

router.get('/services', c.listServices);
router.post(
  '/services',
  [body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Service name must be 2 to 80 characters'),
   body('estimatedPrice').isFloat({ min: 0 }).withMessage('Enter the estimated price'),
   ...serviceRules.slice(1, 2)],
  validate,
  c.createService
);
router.patch('/services/:id', [param('id').isMongoId().withMessage('Invalid ID'), ...serviceRules], validate, c.updateService);

module.exports = router;
