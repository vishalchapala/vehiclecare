const BreakdownRequest = require('../models/BreakdownRequest');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { AppError, asyncHandler, getPagination } = require('../utils/helpers');
const { HIGH_PRIORITY, TRANSITIONS } = require('../utils/statusRules');

const populateAll = (q) =>
  q
    .populate('vehicle', 'type make model registrationNumber fuelType')
    .populate('customer', 'name phone email')
    .populate('provider', 'name phone');

// Returns the request only if this user is allowed to see it. Otherwise 404 (we don't reveal it exists).
async function findAccessible(id, user) {
  const filter = { _id: id };
  if (user.role === 'customer') filter.customer = user._id;
  if (user.role === 'provider') filter.provider = user._id;
  const request = await BreakdownRequest.findOne(filter);
  if (!request) throw new AppError('Request not found', 404);
  return request;
}

// POST /api/requests  (customer)
exports.create = asyncHandler(async (req, res) => {
  const { vehicle, category, description, address, latitude, longitude, contactPhone } = req.body;

  const ownVehicle = await Vehicle.findOne({ _id: vehicle, owner: req.user._id });
  if (!ownVehicle) throw new AppError('Vehicle not found', 404);

  const request = await BreakdownRequest.create({
    customer: req.user._id,
    vehicle,
    category,
    description,
    address,
    latitude,
    longitude,
    contactPhone,
    priority: HIGH_PRIORITY.includes(category) ? 'High' : 'Normal',
    statusHistory: [{ status: 'Reported', by: req.user._id }],
  });

  res.status(201).json({ success: true, data: { request } });
});

// GET /api/requests  (each role sees only its own records)
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'customer') filter.customer = req.user._id;
  if (req.user.role === 'provider') filter.provider = req.user._id;
  if (req.query.status) filter.status = req.query.status;

  const { page, limit, skip } = getPagination(req.query);
  const [requests, total] = await Promise.all([
    populateAll(BreakdownRequest.find(filter).sort('-createdAt').skip(skip).limit(limit)),
    BreakdownRequest.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: { requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

// GET /api/requests/:id
exports.getOne = asyncHandler(async (req, res) => {
  await findAccessible(req.params.id, req.user);
  const request = await populateAll(BreakdownRequest.findById(req.params.id)).populate('statusHistory.by', 'name role');
  res.json({ success: true, data: { request } });
});

// PATCH /api/requests/:id/assign  (admin)
exports.assign = asyncHandler(async (req, res) => {
  const request = await BreakdownRequest.findById(req.params.id);
  if (!request) throw new AppError('Request not found', 404);
  if (request.status !== 'Reported') throw new AppError('Only requests with status Reported can be assigned', 400);

  const provider = await User.findOne({ _id: req.body.providerId, role: 'provider', isApproved: true, isActive: true });
  if (!provider) throw new AppError('Provider not found or not approved', 400);

  request.provider = provider._id;
  request.status = 'Assigned';
  request.statusHistory.push({ status: 'Assigned', by: req.user._id, note: `Assigned to ${provider.name}` });
  await request.save();

  res.json({ success: true, data: { request } });
});

// PATCH /api/requests/:id/status  (customer, provider or admin, depending on the transition)
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, note, notes, estimatedCost, finalCost } = req.body;
  const role = req.user.role;

  const request = await findAccessible(req.params.id, req.user);

  const allowedRoles = TRANSITIONS[request.status] && TRANSITIONS[request.status][status];
  if (!allowedRoles || !allowedRoles.includes(role)) {
    throw new AppError(`A ${role} cannot change a request from "${request.status}" to "${status}"`, 400);
  }

  if (status === 'Reported') request.provider = undefined; // reject or unassign: back to the pool

  if (role === 'provider') {
    if (notes !== undefined) request.providerNotes = notes;
    if (estimatedCost !== undefined) request.estimatedCost = estimatedCost;
    if (finalCost !== undefined && status === 'Resolved') request.finalCost = finalCost;
  }

  request.status = status;
  request.statusHistory.push({ status, by: req.user._id, note });
  await request.save();

  res.json({ success: true, data: { request } });
});
