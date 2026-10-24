const router = require('express').Router();
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/notificationController');

router.use(protect);
router.get('/', c.list);
router.patch('/read-all', c.markAllRead);
router.patch('/:id/read', param('id').isMongoId().withMessage('Invalid ID'), validate, c.markRead);

module.exports = router;
