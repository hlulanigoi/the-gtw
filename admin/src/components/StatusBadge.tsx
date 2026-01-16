interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
}

const statusColors = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
}

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
}

const statusToVariant: Record<string, 'success' | 'error' | 'warning' | 'info'> = {
  // Success statuses
  'active': 'success',
  'success': 'success',
  'completed': 'success',
  'delivered': 'success',
  'verified': 'success',
  'resolved': 'success',

  // Error statuses
  'failed': 'error',
  'error': 'error',
  'cancelled': 'error',
  'expired': 'error',
  'rejected': 'error',
  'closed': 'error',

  // Warning statuses
  'pending': 'warning',
  'warning': 'warning',
  'in_transit': 'info',
  'in_review': 'warning',
  'past_due': 'warning',

  // Info statuses
  'info': 'info',
  'processing': 'info',
}

export default function StatusBadge({
  status,
  variant,
  size = 'md',
}: StatusBadgeProps) {
  const displayVariant = variant || statusToVariant[status.toLowerCase()] || 'default'
  const displayStatus = status.replace(/_/g, ' ').toUpperCase()

  return (
    <span className={`inline-block font-semibold rounded-full ${sizeClasses[size]} ${statusColors[displayVariant]}`}>
      {displayStatus}
    </span>
  )
}
