import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

interface WalletTransaction {
  id: string
  userId: string
  amount: number
  type: 'credit' | 'debit' | 'refund' | 'topup'
  balanceBefore: number
  balanceAfter: number
  description: string
  reference: string
  userName: string
  userEmail: string
  createdAt: string
}

export default function Wallet() {
  const { getToken } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [adjustData, setAdjustData] = useState({
    userId: '',
    amount: '',
    type: 'credit',
    description: '',
  })
  const [refundData, setRefundData] = useState({
    userId: '',
    amount: '',
    description: '',
    parcelId: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-wallet-transactions', typeFilter],
    queryFn: async () => {
      const token = await getToken()
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      
      const res = await fetch(`/api/admin/wallet/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch transactions')
      return res.json()
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['admin-wallet-stats'],
    queryFn: async () => {
      const token = await getToken()
      const res = await fetch('/api/admin/wallet/stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch stats')
      return res.json()
    },
  })

  const adjustMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken()
      const res = await fetch('/api/admin/wallet/adjust', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to adjust wallet')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallet-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['admin-wallet-stats'] })
      setShowAdjustModal(false)
      setAdjustData({ userId: '', amount: '', type: 'credit', description: '' })
      showToast('Wallet adjusted successfully', 'success')
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to adjust wallet', 'error')
    },
  })

  const refundMutation = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken()
      const res = await fetch('/api/admin/wallet/refund', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to issue refund')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallet-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['admin-wallet-stats'] })
      setShowRefundModal(false)
      setRefundData({ userId: '', amount: '', description: '', parcelId: '' })
      showToast('Refund issued successfully', 'success')
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to issue refund', 'error')
    },
  })

  const handleAdjust = () => {
    if (!adjustData.userId || !adjustData.amount) {
      showToast('User ID and amount are required', 'error')
      return
    }
    adjustMutation.mutate({
      userId: adjustData.userId,
      amount: parseInt(adjustData.amount),
      type: adjustData.type,
      description: adjustData.description,
    })
  }

  const handleRefund = () => {
    if (!refundData.userId || !refundData.amount) {
      showToast('User ID and amount are required', 'error')
      return
    }
    refundMutation.mutate({
      userId: refundData.userId,
      amount: parseInt(refundData.amount),
      description: refundData.description,
      parcelId: refundData.parcelId || undefined,
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'credit': return 'bg-green-100 text-green-800'
      case 'debit': return 'bg-red-100 text-red-800'
      case 'refund': return 'bg-blue-100 text-blue-800'
      case 'topup': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Wallet Management</h1>
        <div className="space-x-2">
          <button
            onClick={() => setShowAdjustModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Manual Adjustment
          </button>
          <button
            onClick={() => setShowRefundModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Issue Refund
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Total Balance</div>
          <div className="text-2xl font-bold">
            ₦{(stats?.totalWalletBalance || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Total Credits</div>
          <div className="text-2xl font-bold text-green-600">
            ₦{(stats?.totalCredits || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Total Debits</div>
          <div className="text-2xl font-bold text-red-600">
            ₦{(stats?.totalDebits || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Total Top-ups</div>
          <div className="text-2xl font-bold text-purple-600">
            ₦{(stats?.totalTopups || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-gray-600 text-sm">Total Refunds</div>
          <div className="text-2xl font-bold text-blue-600">
            ₦{(stats?.totalRefunds || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Types</option>
          <option value="credit">Credits</option>
          <option value="debit">Debits</option>
          <option value="refund">Refunds</option>
          <option value="topup">Top-ups</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Balance Before
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Balance After
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.transactions?.map((transaction: WalletTransaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{transaction.userName}</div>
                    <div className="text-sm text-gray-500">{transaction.userEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(transaction.type)}`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    ₦{transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    ₦{transaction.balanceBefore.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    ₦{transaction.balanceAfter.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Manual Wallet Adjustment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">User ID</label>
                <input
                  type="text"
                  value={adjustData.userId}
                  onChange={(e) => setAdjustData({ ...adjustData, userId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter user ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={adjustData.type}
                  onChange={(e) => setAdjustData({ ...adjustData, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (NGN)</label>
                <input
                  type="number"
                  value={adjustData.amount}
                  onChange={(e) => setAdjustData({ ...adjustData, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={adjustData.description}
                  onChange={(e) => setAdjustData({ ...adjustData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Reason for adjustment..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdjust}
                  disabled={adjustMutation.isPending}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Adjust Wallet
                </button>
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Issue Refund to Wallet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">User ID</label>
                <input
                  type="text"
                  value={refundData.userId}
                  onChange={(e) => setRefundData({ ...refundData, userId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter user ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (NGN)</label>
                <input
                  type="number"
                  value={refundData.amount}
                  onChange={(e) => setRefundData({ ...refundData, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Parcel ID (Optional)</label>
                <input
                  type="text"
                  value={refundData.parcelId}
                  onChange={(e) => setRefundData({ ...refundData, parcelId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Related parcel ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={refundData.description}
                  onChange={(e) => setRefundData({ ...refundData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Reason for refund..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRefund}
                  disabled={refundMutation.isPending}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Issue Refund
                </button>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
