const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const BreakdownRequest = require('../models/BreakdownRequest');
const { AppError, asyncHandler, getPagination } = require('../utils/helpers');

// GET /api/admin/users?role=provider&approved=false
exports.listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.approved !== undefined) filter.isApproved = req.query.approved === 'true';

  const { page, limit, skip } = getPagination(req.query, 20);
  const [users, total] = await Promise.all([
    User.find(filter).sort('-createdAt').skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data: { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

// PATCH /api/admin/users/:id  (approve providers, enable or disable accounts)
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be changed here', 400);

  if (req.body.isApproved !== undefined) user.isApproved = req.body.isApproved;
  if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
  await user.save();

  res.json({ success: true, data: { user } });
});

// GET /api/admin/stats  (real counts from the database)
exports.stats = asyncHandler(async (req, res) => {
  const [byStatus, byRole, vehicles] = await Promise.all([
    BreakdownRequest.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Vehicle.countDocuments(),
  ]);

  const toObject = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));
  res.json({
    success: true,
    data: {
      requestsByStatus: toObject(byStatus),
      usersByRole: toObject(byRole),
      totalVehicles: vehicles,
      pendingProviders: await User.countDocuments({ role: 'provider', isApproved: false }),
    },
  });
});
