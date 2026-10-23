const Vehicle = require('../models/Vehicle');
const BreakdownRequest = require('../models/BreakdownRequest');
const { AppError, asyncHandler } = require('../utils/helpers');
const { OPEN_STATUSES } = require('../utils/statusRules');

// Only these fields can be set by the client. The owner always comes from the login token.
const pick = (b) => ({
  type: b.type,
  make: b.make,
  model: b.model,
  registrationNumber: b.registrationNumber,
  fuelType: b.fuelType,
  year: b.year,
  notes: b.notes,
});

exports.list = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ owner: req.user._id }).sort('-createdAt');
  res.json({ success: true, data: { vehicles } });
});

exports.create = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.create({ ...pick(req.body), owner: req.user._id });
  res.status(201).json({ success: true, data: { vehicle } });
});

exports.update = asyncHandler(async (req, res) => {
  // Filtering by owner means nobody can edit another person's vehicle.
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  Object.assign(vehicle, pick(req.body));
  await vehicle.save();
  res.json({ success: true, data: { vehicle } });
});

exports.remove = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findOne({ _id: req.params.id, owner: req.user._id });
  if (!vehicle) throw new AppError('Vehicle not found', 404);

  const hasOpen = await BreakdownRequest.exists({ vehicle: vehicle._id, status: { $in: OPEN_STATUSES } });
  if (hasOpen) throw new AppError('This vehicle has an open request and cannot be removed yet', 409);

  await vehicle.deleteOne();
  res.json({ success: true, message: 'Vehicle removed' });
});
