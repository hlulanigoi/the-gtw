import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { fetchWithAuth } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import Table from '../components/Table'
import { Search, CheckCircle, XCircle, Shield, Ban, Eye } from 'lucide-react'
import { format } from 'date-fns'

export default function Users() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search, roleFilter],
    queryFn: () =>
      fetchWithAuth(
        `/admin/users?page=${page}&limit=20&search=${search}&role=${roleFilter}`
      ),
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      fetchWithAuth(`/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-gray-500">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value: string) => value || 'N/A',
    },
    {
      key: 'role',
      label: 'Role',
      render: (value: string) => (
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            value === 'admin'
              ? 'bg-purple-100 text-purple-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'verified',
      label: 'Verified',
      render: (value: boolean) =>
        value ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (value: number) => (
        <span className="font-medium">{value?.toFixed(1) || '5.0'}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex space-x-2">
          {!row.verified && (
            <button
              onClick={() =>
                updateUserMutation.mutate({ id: row.id, updates: { verified: true } })
              }
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Verify User"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {row.role !== 'admin' && (
            <button
              onClick={() =>
                updateUserMutation.mutate({ id: row.id, updates: { role: 'admin' } })
              }
              className="p-1 text-purple-600 hover:bg-purple-50 rounded"
              title="Make Admin"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() =>
              updateUserMutation.mutate({
                id: row.id,
                updates: { suspended: !row.suspended },
              })
            }
            className={`p-1 rounded ${
              row.suspended
                ? 'text-green-600 hover:bg-green-50'
                : 'text-red-600 hover:bg-red-50'
            }`}
            title={row.suspended ? 'Unsuspend' : 'Suspend'}
          >
            <Ban className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <p className="text-gray-600 mt-2">Manage all platform users</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      <Table columns={columns} data={data?.users || []} loading={isLoading} />

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
