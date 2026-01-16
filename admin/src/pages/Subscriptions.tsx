import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Table from '../components/Table'
import { format } from 'date-fns'
import { Ban } from 'lucide-react'

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
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', statusFilter, tierFilter, page],
    queryFn: async () => {
      const token = await getToken()
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (tierFilter !== 'all') params.append('tier', tierFilter)
      params.append('page', String(page))
      params.append('limit', '20')
      
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

  const columns = [
    {
      key: 'userName',
      label: 'User',
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-gray-500">{row.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'tier',
      label: 'Tier',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTierColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value: number, row: any) => (
        <span className="font-medium">{row.currency} {value.toLocaleString()}</span>
      ),
    },
    {
      key: 'nextBillingDate',
      label: 'Next Billing',
      render: (value: string) => value ? format(new Date(value), 'MMM dd, yyyy') : 'N/A',
    },
    {
      key: 'id',
      label: 'Actions',
      render: (value: string, row: any) => (
        row.status === 'active' && (
          <button
            onClick={() => handleCancel(value)}
            className="flex items-center space-x-1 p-1 text-red-600 hover:bg-red-50 rounded"
            title="Cancel Subscription"
          >
            <Ban className="w-4 h-4" />
          </button>
        )
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
        <p className="text-gray-600 mt-2">Manage all user subscriptions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-primary">
          <div className="text-gray-600 text-sm font-medium">Total Subscriptions</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{stats?.total || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <div className="text-gray-600 text-sm font-medium">Active</div>
          <div className="text-3xl font-bold text-green-600 mt-2">{stats?.active || 0}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <div className="text-gray-600 text-sm font-medium">Monthly Revenue</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">₦{(stats?.monthlyRevenue || 0).toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-purple-500">
          <div className="text-gray-600 text-sm font-medium">Tier Breakdown</div>
          <div className="text-sm space-y-1 mt-2">
            {stats?.tierBreakdown?.map((tier: any) => (
              <div key={tier.tier} className="flex justify-between">
                <span className="capitalize text-gray-600">{tier.tier}:</span>
                <span className="font-semibold">{tier.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="all">All Tiers</option>
            <option value="premium">Premium</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <Table
        columns={columns}
        data={data?.subscriptions || []}
        loading={isLoading}
        exportFilename="subscriptions"
        pagination={
          data?.pagination && data.pagination.totalPages > 1
            ? {
                page: data.pagination.page,
                totalPages: data.pagination.totalPages,
                onPageChange: setPage,
              }
            : undefined
        }
      />
    </div>
  )
}
