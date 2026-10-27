const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/email');
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

// PATCH /api/auth/provider-location  (provider saves where they work from)
exports.setProviderLocation = asyncHandler(async (req, res) => {
  req.user.set('providerProfile.location', { lat: Number(req.body.lat), lng: Number(req.body.lng) });
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

// POST /api/auth/forgot-password
// Always answers the same way, so nobody can use this form to find out which emails are registered.
exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email, isActive: true });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const base = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, '');
    const sent = await sendEmail({
      to: user.email,
      subject: 'Reset your VehicleCare password',
      text: `Hello ${user.name},\n\nUse this link to choose a new password. It expires in 30 minutes.\n\n${base}/reset-password/${token}\n\nIf you did not ask for this, you can ignore this email.`,
    });
    if (!sent) console.warn('Password reset email was not sent (email service is not configured or failed).');
  }
  res.json({ success: true, message: 'If an account exists for this email, a reset link has been sent.' });
});

// POST /api/auth/reset-password/:token
exports.resetPassword = asyncHandler(async (req, res) => {
  const hash = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ passwordResetToken: hash, passwordResetExpires: { $gt: new Date() } })
    .select('+passwordResetToken +passwordResetExpires');
  if (!user) throw new AppError('This reset link is invalid or has expired', 400);

  user.password = req.body.password; // hashed automatically before saving
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  res.json({ success: true, message: 'Password reset. You can log in now.' });
});
