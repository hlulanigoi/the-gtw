import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchWithAuth } from '../lib/api'
import { useToast } from '../contexts/ToastContext'
import Table from '../components/Table'
import { Trash2, Star } from 'lucide-react'
import { format } from 'date-fns'

export default function Reviews() {
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reviews', page],
    queryFn: () => fetchWithAuth(`/admin/reviews?page=${page}&limit=20`),
  })

  const deleteReviewMutation = useMutation({
    mutationFn: (id: string) =>
      fetchWithAuth(`/admin/reviews/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      showToast('Review deleted successfully', 'success')
    },
    onError: () => {
      showToast('Failed to delete review', 'error')
    },
  })

  const columns = [
    {
      key: 'reviewerName',
      label: 'Reviewer',
      render: (value: string, row: any) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-gray-500">{row.reviewerEmail}</p>
        </div>
      ),
    },
    {
      key: 'reviewType',
      label: 'Type',
      render: (value: string) => (
        <span className="px-2 py-1 text-xs bg-gray-100 rounded capitalize">
          {value}
        </span>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < value ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
              }`}
            />
          ))}
          <span className="ml-2 font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: 'comment',
      label: 'Comment',
      render: (value: string) => (
        <p className="max-w-md truncate">{value || 'No comment'}</p>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value: string) => format(new Date(value), 'MMM dd, yyyy'),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (value: string) => (
        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this review?')) {
              deleteReviewMutation.mutate(value)
            }
          }}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Delete Review"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-600 mt-2">Moderate reviews and ratings</p>
      </div>

      <Table 
        columns={columns} 
        data={data?.reviews || []} 
        loading={isLoading}
        exportFilename="reviews"
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
