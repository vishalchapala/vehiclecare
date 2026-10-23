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

const TRANSITIONS = {
  Reported: { Assigned: ['admin'], Cancelled: ['customer', 'admin'] },
  Assigned: { Accepted: ['provider'], Reported: ['provider', 'admin'], Cancelled: ['customer', 'admin'] },
  Accepted: { 'En Route': ['provider'], Cancelled: ['customer', 'admin'] },
  'En Route': { 'In Progress': ['provider'] },
  'In Progress': { Resolved: ['provider'] },
};

module.exports = { CATEGORIES, HIGH_PRIORITY, STATUSES, OPEN_STATUSES, TRANSITIONS };
