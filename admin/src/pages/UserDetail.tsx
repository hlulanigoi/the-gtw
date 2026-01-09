import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  Star, 
  Package, 
  Route, 
  MessageSquare,
  CheckCircle,
  XCircle,
  Shield,
  Ban
} from 'lucide-react'
import { format } from 'date-fns'

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => fetchWithAuth(`/admin/users/${id}`),
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ updates }: { updates: any }) =>
      fetchWithAuth(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', id] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      showToast('User updated successfully', 'success')
    },
    onError: () => {
      showToast('Failed to update user', 'error')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found</p>
        <Link to="/users" className="text-primary hover:underline mt-4 inline-block">
          Back to Users
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/users')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600 mt-1">User Details</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">User Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-start space-x-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Joined</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(user.createdAt), 'MMMM dd, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Star className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Rating</p>
                <p className="font-medium text-gray-900">{user.rating?.toFixed(1) || '5.0'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Status & Actions Card */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Status & Actions</h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Status Badges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Role</span>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verified</span>
                {user.verified ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Suspended</span>
                {user.suspended ? (
                  <XCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 space-y-2">
              {!user.verified && (
                <button
                  onClick={() => updateUserMutation.mutate({ updates: { verified: true } })}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  data-testid="verify-user-btn"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Verify User</span>
                </button>
              )}

              {user.role !== 'admin' && (
                <button
                  onClick={() => updateUserMutation.mutate({ updates: { role: 'admin' } })}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                  data-testid="make-admin-btn"
                >
                  <Shield className="w-4 h-4" />
                  <span>Make Admin</span>
                </button>
              )}

              <button
                onClick={() =>
                  updateUserMutation.mutate({ updates: { suspended: !user.suspended } })
                }
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  user.suspended
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
                data-testid="suspend-user-btn"
              >
                <Ban className="w-4 h-4" />
                <span>{user.suspended ? 'Unsuspend User' : 'Suspend User'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sent Parcels</p>
              <p className="text-2xl font-bold text-gray-900">{user.stats?.sentParcels || 0}</p>
            </div>
            <Package className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transported</p>
              <p className="text-2xl font-bold text-gray-900">
                {user.stats?.transportedParcels || 0}
              </p>
            </div>
            <Package className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Routes</p>
              <p className="text-2xl font-bold text-gray-900">{user.stats?.routes || 0}</p>
            </div>
            <Route className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{user.stats?.reviews || 0}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
