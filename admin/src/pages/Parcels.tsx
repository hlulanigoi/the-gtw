import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '../lib/api'
import Table from '../components/Table'
import { Search, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function Parcels() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'parcels', page, search, statusFilter],
    queryFn: () =>
      fetchWithAuth(
        `/admin/parcels?page=${page}&limit=20&search=${search}&status=${statusFilter}`
      ),
  })

  const updateParcelMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      fetchWithAuth(`/admin/parcels/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'parcels'] })
    },
  })

  const deleteParcelMutation = useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/admin/parcels/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'parcels'] })
    },
  })

  const columns = [
    {
      key: 'origin',
      label: 'Route',
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-gray-500">→ {row.destination}</p>
        </div>
      ),
    },
    {
      key: 'senderName',
      label: 'Sender',
    },
    {
      key: 'size',
      label: 'Size',
      render: (value: string) => (
        <span className="px-2 py-1 text-xs bg-gray-100 rounded capitalize">
          {value}
        </span>
      ),
    },
    {
      key: 'compensation',
      label: 'Compensation',
      render: (value: number) => `₦${value.toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string, row: any) => (
        <select
          value={value}
          onChange={(e) =>
            updateParcelMutation.mutate({
              id: row.id,
              updates: { status: e.target.value },
            })
          }
          className={`px-3 py-1 text-xs font-medium rounded-full border-0 focus:ring-2 focus:ring-primary ${
            value === 'Pending'
              ? 'bg-yellow-100 text-yellow-800'
              : value === 'In Transit'
              ? 'bg-blue-100 text-blue-800'
              : value === 'Delivered'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          <option value="Pending">Pending</option>
          <option value="In Transit">In Transit</option>
          <option value="Delivered">Delivered</option>
          <option value="Expired">Expired</option>
        </select>
      ),
    },
    {
      key: 'pickupDate',
      label: 'Pickup Date',
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (value: string) => (
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this parcel?')) {
              deleteParcelMutation.mutate(value)
            }
          }}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Delete Parcel"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parcels</h1>
        <p className="text-gray-600 mt-2">Manage all parcels on the platform</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by origin, destination, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      <Table columns={columns} data={data?.parcels || []} loading={isLoading} />

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
          <p className="text-sm text-gray-600">
            Showing {data.pagination.page} of {data.pagination.totalPages} pages
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.pagination.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
