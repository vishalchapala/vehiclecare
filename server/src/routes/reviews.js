const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/reviewController');

router.get('/summary', protect, authorize('provider'), c.summary);

module.exports = router;
