import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

interface Subscription {
  id: string
  userId: string
  tier: 'premium' | 'business'
  status: 'active' | 'cancelled' | 'expired' | 'past_due'
  amount: number
  currency: string
  startDate: string
  endDate: string
  nextBillingDate: string
  userName: string
  userEmail: string
  createdAt: string
}

export default function Subscriptions() {
  const { getToken } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', statusFilter, tierFilter],
    queryFn: async () => {
      const token = await getToken()
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (tierFilter !== 'all') params.append('tier', tierFilter)
      
      const res = await fetch(`/api/admin/subscriptions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch subscriptions')
      return res.json()
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-subscription-stats'],
    queryFn: async () => {
      const token = await getToken()
      const res = await fetch('/api/admin/subscriptions/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const token = await getToken()
      const res = await fetch(`/api/admin/subscriptions/${id}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error('Failed to cancel subscription')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-stats'] })
      showToast('Subscription cancelled', 'success')
    },
    onError: () => {
      showToast('Failed to cancel subscription', 'error')
    },
  })

  const handleCancel = (id: string) => {
    const reason = prompt('Enter cancellation reason:')
    if (reason) {
      cancelMutation.mutate({ id, reason })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'expired': return 'bg-gray-100 text-gray-800'
      case 'past_due': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-purple-100 text-purple-800'
      case 'business': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Subscription Management</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Total Subscriptions</div>
          <div className="text-2xl font-bold">{stats?.total || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Active</div>
          <div className="text-2xl font-bold text-green-600">{stats?.active || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Monthly Revenue</div>
          <div className="text-2xl font-bold text-blue-600">
            ₦{(stats?.monthlyRevenue || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Tier Breakdown</div>
          <div className="text-sm space-y-1">
            {stats?.tierBreakdown?.map((tier: any) => (
              <div key={tier.tier} className="flex justify-between">
                <span className="capitalize">{tier.tier}:</span>
                <span className="font-semibold">{tier.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
          <option value="past_due">Past Due</option>
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Tiers</option>
          <option value="premium">Premium</option>
          <option value="business">Business</option>
        </select>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Next Billing
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.subscriptions?.map((subscription: Subscription) => (
                <tr key={subscription.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{subscription.userName}</div>
                    <div className="text-sm text-gray-500">{subscription.userEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getTierColor(subscription.tier)}`}>
                      {subscription.tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(subscription.status)}`}>
                      {subscription.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {subscription.currency} {subscription.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {subscription.nextBillingDate
                      ? new Date(subscription.nextBillingDate).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {subscription.status === 'active' && (
                      <button
                        onClick={() => handleCancel(subscription.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
