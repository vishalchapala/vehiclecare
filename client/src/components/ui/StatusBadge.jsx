import Badge from './Badge.jsx'

const tones = {
  Reported: 'neutral',
  Assigned: 'info',
  Accepted: 'info',
  'En Route': 'warning',
  'In Progress': 'warning',
  Resolved: 'success',
  Cancelled: 'danger',
}

export default function StatusBadge({ status }) {
  return <Badge tone={tones[status] || 'neutral'}>{status}</Badge>
}
