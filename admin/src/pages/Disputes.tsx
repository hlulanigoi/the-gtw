import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

interface Dispute {
  id: string
  parcelId: string
  subject: string
  description: string
  status: 'open' | 'in_review' | 'resolved' | 'closed'
  refundAmount: number | null
  refundedToWallet: boolean
  resolution: string | null
  complainantName: string
  complainantEmail: string
  parcelOrigin: string
  parcelDestination: string
  createdAt: string
}

interface DisputeDetail extends Dispute {
  complainant: any
  respondent: any
  parcel: any
  messages: Array<{
    id: string
    senderId: string
    message: string
    isAdminMessage: boolean
    createdAt: string
  }>
}

export default function Disputes() {
  const { getToken } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetail | null>(null)
  const [resolution, setResolution] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [message, setMessage] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-disputes', statusFilter, searchTerm],
    queryFn: async () => {
      const token = await getToken()
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)
      
      const res = await fetch(`/api/admin/disputes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch disputes')
      return res.json()
    },
  })

  const disputeDetailQuery = useQuery({
    queryKey: ['admin-dispute-detail', selectedDispute?.id],
    queryFn: async () => {
      if (!selectedDispute) return null
      const token = await getToken()
      const res = await fetch(`/api/admin/disputes/${selectedDispute.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to fetch dispute details')
      return res.json()
    },
    enabled: !!selectedDispute,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getToken()
      const res = await fetch(`/api/admin/disputes/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update dispute')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] })
      showToast('Dispute status updated', 'success')
    },
    onError: () => {
      showToast('Failed to update dispute', 'error')
    },
  })

  const resolveDisputeMutation = useMutation({
    mutationFn: async ({ id, refundAmount, resolution }: { id: string; refundAmount: number; resolution: string }) => {
      const token = await getToken()
      const res = await fetch(`/api/admin/disputes/${id}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refundAmount, resolution, refundToWallet: true }),
      })
      if (!res.ok) throw new Error('Failed to resolve dispute')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] })
      setSelectedDispute(null)
      setResolution('')
      setRefundAmount('')
      showToast('Dispute resolved successfully', 'success')
    },
    onError: () => {
      showToast('Failed to resolve dispute', 'error')
    },
  })

  const sendMessageMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const token = await getToken()
      const res = await fetch(`/api/admin/disputes/${id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dispute-detail'] })
      setMessage('')
      showToast('Message sent', 'success')
    },
    onError: () => {
      showToast('Failed to send message', 'error')
    },
  })

  const handleResolve = () => {
    if (!selectedDispute) return
    if (!resolution.trim()) {
      showToast('Please enter a resolution', 'error')
      return
    }
    const amount = parseInt(refundAmount) || 0
    resolveDisputeMutation.mutate({
      id: selectedDispute.id,
      refundAmount: amount,
      resolution,
    })
  }

  const handleSendMessage = () => {
    if (!selectedDispute || !message.trim()) return
    sendMessageMutation.mutate({
      id: selectedDispute.id,
      message,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_review': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dispute Management</h1>
      </div>

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Search disputes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_review">In Review</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disputes List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.disputes?.map((dispute: Dispute) => (
                  <tr key={dispute.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{dispute.subject}</div>
                      <div className="text-sm text-gray-500">
                        {dispute.parcelOrigin} → {dispute.parcelDestination}
                      </div>
                      <div className="text-xs text-gray-400">{dispute.complainantName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(dispute.status)}`}>
                        {dispute.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedDispute(dispute as any)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dispute Details */}
        <div className="bg-white rounded-lg shadow p-6">
          {selectedDispute ? (
            <div>
              <h2 className="text-xl font-bold mb-4">{disputeDetailQuery.data?.subject}</h2>
              
              <div className="mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(disputeDetailQuery.data?.status)}`}>
                    {disputeDetailQuery.data?.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Complainant:</span>
                  <span>{disputeDetailQuery.data?.complainant?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Respondent:</span>
                  <span>{disputeDetailQuery.data?.respondent?.name}</span>
                </div>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{disputeDetailQuery.data?.description}</p>
              </div>

              {/* Messages */}
              <div className="mb-4 max-h-60 overflow-y-auto border rounded p-3">
                <h3 className="font-semibold mb-2">Messages</h3>
                {disputeDetailQuery.data?.messages?.map((msg: any) => (
                  <div key={msg.id} className={`mb-2 p-2 rounded ${msg.isAdminMessage ? 'bg-blue-50' : 'bg-gray-50'}`}>
                    <div className="text-xs text-gray-500">{msg.isAdminMessage ? 'Admin' : 'User'}</div>
                    <div className="text-sm">{msg.message}</div>
                  </div>
                ))}
              </div>

              {/* Send Message */}
              {disputeDetailQuery.data?.status !== 'resolved' && disputeDetailQuery.data?.status !== 'closed' && (
                <div className="mb-4">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your response..."
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending}
                    className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Send Message
                  </button>
                </div>
              )}

              {/* Resolution Form */}
              {disputeDetailQuery.data?.status !== 'resolved' && disputeDetailQuery.data?.status !== 'closed' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Resolve Dispute</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Resolution</label>
                      <textarea
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        placeholder="Describe the resolution..."
                        className="w-full px-3 py-2 border rounded-lg"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Refund Amount (NGN)</label>
                      <input
                        type="number"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        placeholder="0"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <button
                      onClick={handleResolve}
                      disabled={resolveDisputeMutation.isPending}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Resolve & Refund to Wallet
                    </button>
                  </div>
                </div>
              )}

              {disputeDetailQuery.data?.resolution && (
                <div className="mt-4 p-3 bg-green-50 rounded">
                  <h4 className="font-semibold text-green-800">Resolution</h4>
                  <p className="text-green-700">{disputeDetailQuery.data.resolution}</p>
                  {disputeDetailQuery.data.refundAmount > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Refund: ₦{disputeDetailQuery.data.refundAmount.toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Select a dispute to view details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
