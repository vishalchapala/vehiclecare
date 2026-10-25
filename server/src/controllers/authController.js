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

// PATCH /api/auth/availability  (provider switches Available / Not available)
exports.setAvailability = asyncHandler(async (req, res) => {
  req.user.set('providerProfile.isAvailable', req.body.isAvailable === true || req.body.isAvailable === 'true');
  await req.user.save();
  res.json({ success: true, data: { user: req.user } });
});

// PATCH /api/auth/profile  (change own name and phone)
exports.updateProfile = asyncHandler(async (req, res) => {
  req.user.name = req.body.name;
  req.user.phone = req.body.phone;
  await req.user.save();
  res.json({ success: true, data: { user: req.user } });
});

// PATCH /api/auth/password  (needs the current password)
exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }
  user.password = req.body.newPassword; // hashed automatically before saving
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});
