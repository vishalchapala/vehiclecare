const ContactMessage = require('../models/ContactMessage');
const { asyncHandler, getPagination } = require('../utils/helpers');

// POST /api/contact  (public)
exports.create = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;
  await ContactMessage.create({ name, email, message });
  res.status(201).json({ success: true, message: 'Thank you. Your message has been sent.' });
});

// GET /api/admin/messages  (admin)
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, 20);
  const [messages, total] = await Promise.all([
    ContactMessage.find().sort('-createdAt').skip(skip).limit(limit),
    ContactMessage.countDocuments(),
  ]);
  res.json({ success: true, data: { messages, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});
