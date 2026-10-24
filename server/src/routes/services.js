const router = require('express').Router();
const ServiceCategory = require('../models/ServiceCategory');
const { asyncHandler } = require('../utils/helpers');

// GET /api/services  (public price list of active services)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const services = await ServiceCategory.find({ isActive: true }).sort('name');
    res.json({ success: true, data: { services } });
  })
);

module.exports = router;
