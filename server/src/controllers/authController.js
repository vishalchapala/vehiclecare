const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError, asyncHandler } = require('../utils/helpers');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register  (public: only customer or provider, never admin)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role, // already limited to customer/provider by the route validation
    isApproved: true, // providers are approved automatically
  });

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { token: signToken(user._id), user },
  });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');

  // Same message for "no such email" and "wrong password" so attackers learn nothing.
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) throw new AppError('This account has been disabled', 403);

  res.json({ success: true, data: { token: signToken(user._id), user } });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});
