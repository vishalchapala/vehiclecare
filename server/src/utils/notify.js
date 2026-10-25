const Notification = require('../models/Notification');
const User = require('../models/User');

// Creates in-app notifications. A failure here must never break the main action, so errors are only logged.
async function notify(userIds, message, request, kind) {
  try {
    const ids = [].concat(userIds).filter(Boolean);
    if (!ids.length) return;
    await Notification.insertMany(ids.map((user) => ({ user, message, request, kind })));
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

async function notifyAdmins(message, request) {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    await notify(admins.map((a) => a._id), message, request);
  } catch (err) {
    console.error('Notification error:', err.message);
  }
}

module.exports = { notify, notifyAdmins };
