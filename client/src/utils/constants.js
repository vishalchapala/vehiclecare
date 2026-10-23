export const CATEGORIES = [
  'Flat tyre', 'Battery problem', 'Engine failure', 'Out of fuel',
  'Brake problem', 'Accident', 'Towing needed', 'Other',
]
export const STATUSES = ['Reported', 'Assigned', 'Accepted', 'En Route', 'In Progress', 'Resolved', 'Cancelled']
export const OPEN_STATUSES = ['Reported', 'Assigned', 'Accepted', 'En Route', 'In Progress']

export const formatDate = (d) =>
  new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
