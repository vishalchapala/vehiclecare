const User = require('../models/User');
const BreakdownRequest = require('../models/BreakdownRequest');
const { notify } = require('./notify');

const ACTIVE = ['Assigned', 'Accepted', 'En Route', 'In Progress'];

const label = (r) => (r.type === 'maintenance' ? `service "${r.category}"` : `breakdown "${r.category}"`);

// Asks the Python dispatch service to rank providers by distance and workload.
// Returns { provider, distanceKm } or null when the service is not configured, too slow, or down.
async function rankWithPython(request, providers, load) {
  const base = process.env.PYTHON_SERVICE_URL;
  const key = process.env.INTERNAL_KEY;
  if (!base || !key || request.latitude == null || request.longitude == null) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000); // never make the customer wait long
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/rank`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', 'x-internal-key': key },
      body: JSON.stringify({
        lat: request.latitude,
        lng: request.longitude,
        providers: providers.map((p) => ({
          id: String(p._id),
          name: p.name,
          active_jobs: load.get(String(p._id)) || 0,
          lat: p.providerProfile?.location?.lat ?? null,
          lng: p.providerProfile?.location?.lng ?? null,
        })),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const first = data.ranking && data.ranking[0];
    const provider = first && providers.find((p) => String(p._id) === first.id);
    return provider ? { provider, distanceKm: first.distance_km, etaMinutes: first.eta_minutes } : null;
  } catch (err) {
    console.warn('Dispatch service unavailable, using the fallback rule:', err.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Chooses a provider. Preferred: Python service (distance + workload). Fallback: fewest active jobs.
async function pickProvider(request) {
  const providers = await User.find({
    role: 'provider',
    isActive: true,
    'providerProfile.isAvailable': { $ne: false },
    _id: { $nin: request.rejectedBy || [] },
  }).select('_id name providerProfile.location');
  if (!providers.length) return null;

  const counts = await BreakdownRequest.aggregate([
    { $match: { provider: { $in: providers.map((p) => p._id) }, status: { $in: ACTIVE } } },
    { $group: { _id: '$provider', n: { $sum: 1 } } },
  ]);
  const load = new Map(counts.map((c) => [String(c._id), c.n]));

  const ranked = await rankWithPython(request, providers, load);
  if (ranked && ranked.distanceKm != null) {
    return {
      provider: ranked.provider,
      method: `nearest available, ${ranked.distanceKm} km away, about ${ranked.etaMinutes} min`,
      distanceKm: ranked.distanceKm,
      etaMinutes: ranked.etaMinutes,
    };
  }

  providers.sort((a, b) => (load.get(String(a._id)) || 0) - (load.get(String(b._id)) || 0));
  return { provider: providers[0], method: 'least busy' };
}

// Automatic assignment. Returns the provider, or null when nobody is available (the request stays open).
async function autoAssign(request) {
  const choice = await pickProvider(request);
  if (!choice) return null;
  const { provider, method, distanceKm, etaMinutes } = choice;

  request.provider = provider._id;
  request.distanceKm = distanceKm; // undefined when the fallback rule was used
  request.etaMinutes = etaMinutes;
  request.status = 'Assigned';
  request.statusHistory.push({ status: 'Assigned', note: `Automatically assigned to ${provider.name} (${method})` });
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
