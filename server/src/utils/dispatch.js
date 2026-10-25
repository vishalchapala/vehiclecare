const User = require('../models/User');
const BreakdownRequest = require('../models/BreakdownRequest');
const { notify } = require('./notify');

const ACTIVE = ['Assigned', 'Accepted', 'En Route', 'In Progress'];

const label = (r) => (r.type === 'maintenance' ? `service "${r.category}"` : `breakdown "${r.category}"`);

// Picks the available provider with the fewest active jobs (ties: the first found).
async function pickProvider(excludeIds = []) {
  const providers = await User.find({
    role: 'provider',
    isActive: true,
    'providerProfile.isAvailable': { $ne: false },
    _id: { $nin: excludeIds },
  }).select('_id name');
  if (!providers.length) return null;

  const counts = await BreakdownRequest.aggregate([
    { $match: { provider: { $in: providers.map((p) => p._id) }, status: { $in: ACTIVE } } },
    { $group: { _id: '$provider', n: { $sum: 1 } } },
  ]);
  const load = new Map(counts.map((c) => [String(c._id), c.n]));
  providers.sort((a, b) => (load.get(String(a._id)) || 0) - (load.get(String(b._id)) || 0));
  return providers[0];
}

// Automatic assignment. Returns the provider, or null when nobody is available (the request stays open).
async function autoAssign(request) {
  const provider = await pickProvider(request.rejectedBy || []);
  if (!provider) return null;

  request.provider = provider._id;
  request.status = 'Assigned';
  request.statusHistory.push({ status: 'Assigned', note: `Automatically assigned to ${provider.name}` });
  await request.save();

  await notify(provider._id, `A new ${label(request)} was assigned to you`, request._id);
  await notify(request.customer, `${provider.name} was assigned to your ${label(request)}`, request._id);
  return provider;
}

// Tells every available provider that an open request is waiting.
async function notifyOpenRequest(request) {
  const providers = await User.find({
    role: 'provider',
    isActive: true,
    'providerProfile.isAvailable': { $ne: false },
  }).select('_id');
  await notify(providers.map((p) => p._id), `A new open ${label(request)} is waiting for a provider`, request._id, 'open');
}

module.exports = { autoAssign, notifyOpenRequest, label };
