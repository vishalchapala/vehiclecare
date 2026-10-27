const BreakdownRequest = require('../models/BreakdownRequest');
const Vehicle = require('../models/Vehicle');
const ServiceCategory = require('../models/ServiceCategory');
const Review = require('../models/Review');
const { AppError, asyncHandler, getPagination } = require('../utils/helpers');
const { HIGH_PRIORITY, TRANSITIONS } = require('../utils/statusRules');
const { notify, notifyAdmins } = require('../utils/notify');
const { autoAssign, notifyOpenRequest, label } = require('../utils/dispatch');

const populateAll = (q) =>
  q
    .populate('vehicle', 'type make model registrationNumber fuelType')
    .populate('customer', 'name phone email')
    .populate('provider', 'name phone');

// Returns the request only if this user is allowed to see it. Otherwise 404 (we don't reveal it exists).
// Admins can see every request (view only).
async function findAccessible(id, user) {
  const filter = { _id: id };
  if (user.role === 'customer') filter.customer = user._id;
  if (user.role === 'provider') filter.provider = user._id;
  const request = await BreakdownRequest.findOne(filter);
  if (!request) throw new AppError('Request not found', 404);
  return request;
}

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

  // Try automatic assignment. If nobody is available, the request becomes an open request.
  const assigned = await autoAssign(request);
  if (!assigned) await notifyOpenRequest(request);

  res.status(201).json({ success: true, data: { request, autoAssigned: !!assigned } });
});

// GET /api/requests  (each role sees only its own records; admin sees all)
exports.list = asyncHandler(async (req, res) => {
  const filter = {};
  const openScope = req.user.role === 'provider' && req.query.scope === 'open';

  if (req.user.role === 'customer') filter.customer = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.type = req.query.type;

  if (req.user.role === 'provider') {
    if (openScope) {
      // Open requests: nobody has them yet.
      filter.status = 'Reported';
      filter.provider = null;
    } else {
      filter.provider = req.user._id;
    }
  }

  const { page, limit, skip } = getPagination(req.query);
  let query = BreakdownRequest.find(filter).sort('-createdAt').skip(skip).limit(limit);
  if (openScope) {
    // Customer contact details stay hidden until a provider accepts the job.
    query = query
      .select('type category vehicle address description priority preferredDate createdAt status')
      .populate('vehicle', 'type make model registrationNumber');
  } else {
    query = populateAll(query);
  }

  const [requests, total] = await Promise.all([query, BreakdownRequest.countDocuments(filter)]);
  res.json({
    success: true,
    data: { requests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } },
  });
});

// GET /api/requests/:id
exports.getOne = asyncHandler(async (req, res) => {
  await findAccessible(req.params.id, req.user);
  const request = await populateAll(BreakdownRequest.findById(req.params.id)).populate('statusHistory.by', 'name role');
  const review = await Review.findOne({ request: request._id }).populate('customer', 'name');
  res.json({ success: true, data: { request, review } });
});

// PATCH /api/requests/:id/claim  (provider takes an open request)
exports.claim = asyncHandler(async (req, res) => {
  // One atomic step: only one provider can win if two click at the same moment.
  const request = await BreakdownRequest.findOneAndUpdate(
    { _id: req.params.id, status: 'Reported', provider: null },
    {
      $set: { provider: req.user._id, status: 'Accepted' },
      $unset: { distanceKm: '', etaMinutes: '' },
      $push: { statusHistory: { status: 'Accepted', by: req.user._id, note: 'Accepted from open requests', at: new Date() } },
    },
    { new: true }
  );
  if (!request) throw new AppError('This request is no longer available', 409);

  await notify(request.customer, `${req.user.name} accepted your ${label(request)}`, request._id);
  res.json({ success: true, data: { request } });
});

// PATCH /api/requests/:id/status  (customer or provider, depending on the transition)
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, note, notes, estimatedCost, finalCost } = req.body;
  const role = req.user.role;

  const request = await findAccessible(req.params.id, req.user);

  const allowedRoles = TRANSITIONS[request.status] && TRANSITIONS[request.status][status];
  if (!allowedRoles || !allowedRoles.includes(role)) {
    throw new AppError(`A ${role} cannot change a request from "${request.status}" to "${status}"`, 400);
  }

  const previousProvider = request.provider;
  const isReject = role === 'provider' && status === 'Reported';
  if (isReject) {
    request.rejectedBy.push(req.user._id);
    request.provider = undefined;
    request.distanceKm = undefined;
    request.etaMinutes = undefined;
  }

  if (role === 'provider') {
    if (notes !== undefined) request.providerNotes = notes;
    if (estimatedCost !== undefined) request.estimatedCost = estimatedCost;
    if (finalCost !== undefined && status === 'Resolved') request.finalCost = finalCost;
  }

  request.status = status;
  request.statusHistory.push({ status, by: req.user._id, note: note || (isReject ? 'Rejected by provider' : undefined) });
  await request.save();

  if (isReject) {
    // Try the next available provider. If nobody is left, it becomes an open request.
    const next = await autoAssign(request);
    if (!next) {
      await notifyOpenRequest(request);
      await notify(request.customer, `Your ${label(request)} is open to all available providers`, request._id);
    }
  } else if (role === 'provider') {
    await notify(request.customer, `Your ${label(request)} is now ${status}`, request._id);
  } else if (status === 'Cancelled') {
    await notify(previousProvider, `The ${label(request)} was cancelled by the customer`, request._id);
  }

  res.json({ success: true, data: { request } });
});
