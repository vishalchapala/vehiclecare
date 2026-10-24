const BreakdownRequest = require('../models/BreakdownRequest');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const ServiceCategory = require('../models/ServiceCategory');
const { AppError, asyncHandler, getPagination } = require('../utils/helpers');
const { HIGH_PRIORITY, TRANSITIONS } = require('../utils/statusRules');
const { notify, notifyAdmins } = require('../utils/notify');

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

const label = (r) => (r.type === 'maintenance' ? `service "${r.category}"` : `breakdown "${r.category}"`);

// POST /api/requests  (customer) - breakdown or maintenance
exports.create = asyncHandler(async (req, res) => {
  const { type = 'breakdown', vehicle, category, serviceCategory, preferredDate, description, address, latitude, longitude, contactPhone } = req.body;

  const ownVehicle = await Vehicle.findOne({ _id: vehicle, owner: req.user._id });
  if (!ownVehicle) throw new AppError('Vehicle not found', 404);

  const data = {
    type,
    customer: req.user._id,
    vehicle,
    description,
    address,
    latitude,
    longitude,
    contactPhone,
    statusHistory: [{ status: 'Reported', by: req.user._id }],
  };

  if (type === 'maintenance') {
    // The price and name come from the database, never from the browser.
    const service = await ServiceCategory.findOne({ _id: serviceCategory, isActive: true });
    if (!service) throw new AppError('Selected service is not available', 400);
    data.category = service.name;
    data.serviceCategory = service._id;
    data.preferredDate = preferredDate;
    data.estimatedCost = service.estimatedPrice;
  } else {
    data.category = category;
    data.priority = HIGH_PRIORITY.includes(category) ? 'High' : 'Normal';
  }

  const request = await BreakdownRequest.create(data);
  await notifyAdmins(`New ${label(request)} from ${req.user.name}`, request._id);

  res.status(201).json({ success: true, data: { request } });
});

// GET /api/requests  (each role sees only its own records)
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'customer') filter.customer = req.user._id;
  if (req.user.role === 'provider') filter.provider = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

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

  await notify(provider._id, `You were assigned a new ${label(request)}`, request._id);
  await notify(request.customer, `${provider.name} was assigned to your ${label(request)}`, request._id);

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

  const previousProvider = request.provider;
  if (status === 'Reported') request.provider = undefined; // reject or unassign: back to the pool

  if (role === 'provider') {
    if (notes !== undefined) request.providerNotes = notes;
    if (estimatedCost !== undefined) request.estimatedCost = estimatedCost;
    if (finalCost !== undefined && status === 'Resolved') request.finalCost = finalCost;
  }

  request.status = status;
  request.statusHistory.push({ status, by: req.user._id, note });
  await request.save();

  // Tell the people affected by this change.
  if (role === 'provider' && status === 'Reported') {
    await notifyAdmins(`${req.user.name} rejected the ${label(request)}. It needs a new provider.`, request._id);
  } else if (role === 'provider') {
    await notify(request.customer, `Your ${label(request)} is now ${status}`, request._id);
  } else if (role === 'admin' && status === 'Reported') {
    await notify(previousProvider, `You were removed from the ${label(request)}`, request._id);
    await notify(request.customer, `Your ${label(request)} is being reassigned`, request._id);
  } else if (status === 'Cancelled') {
    if (role === 'customer') await notifyAdmins(`${req.user.name} cancelled the ${label(request)}`, request._id);
    if (role === 'admin') await notify(request.customer, `Your ${label(request)} was cancelled by the admin`, request._id);
    await notify(previousProvider, `The ${label(request)} was cancelled`, request._id);
  }

  res.json({ success: true, data: { request } });
});
