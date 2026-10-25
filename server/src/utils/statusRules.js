// Who may move a breakdown request from one status to another.
// Anything not listed here is rejected by the server.
const CATEGORIES = [
  'Flat tyre', 'Battery problem', 'Engine failure', 'Out of fuel',
  'Brake problem', 'Accident', 'Towing needed', 'Other',
];

// Priority rule: these categories are urgent, everything else is normal.
const HIGH_PRIORITY = ['Accident', 'Brake problem'];

const STATUSES = ['Reported', 'Assigned', 'Accepted', 'En Route', 'In Progress', 'Resolved', 'Cancelled'];
const OPEN_STATUSES = ['Reported', 'Assigned', 'Accepted', 'En Route', 'In Progress'];

// Who may move a request from one status to another through the status endpoint.
// Two moves happen outside this table, on purpose:
//   Reported -> Assigned   done by the system (automatic assignment, see utils/dispatch.js)
//   Reported -> Accepted   done by a provider who takes an open request (claim endpoint)
// Admins only view, so they have no transitions.
const TRANSITIONS = {
  Reported: { Cancelled: ['customer'] },
  Assigned: { Accepted: ['provider'], Reported: ['provider'], Cancelled: ['customer'] },
  Accepted: { 'En Route': ['provider'], Cancelled: ['customer'] },
  'En Route': { 'In Progress': ['provider'] },
  'In Progress': { Resolved: ['provider'] },
};

module.exports = { CATEGORIES, HIGH_PRIORITY, STATUSES, OPEN_STATUSES, TRANSITIONS };
