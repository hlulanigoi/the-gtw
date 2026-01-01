import { useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '../lib/api'
import StatsCard from '../components/StatsCard'
import { Users, Package, Route, CreditCard, TrendingUp, Activity } from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => fetchWithAuth('/admin/stats'),
  })

  const { data: activityData } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: () => fetchWithAuth('/admin/activity?limit=10'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to ParcelPeer Admin Dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.users?.total || 0}
          change={`+${stats?.users?.recent || 0} this month`}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-blue-500"
        />
        <StatsCard
          title="Active Parcels"
          value={stats?.parcels?.pending || 0}
          icon={<Package className="w-6 h-6 text-white" />}
          color="bg-green-500"
        />
        <StatsCard
          title="Active Routes"
          value={stats?.routes?.active || 0}
          icon={<Route className="w-6 h-6 text-white" />}
          color="bg-purple-500"
        />
        <StatsCard
          title="Total Revenue"
          value={`₦${(stats?.payments?.revenue || 0).toLocaleString()}`}
          icon={<CreditCard className="w-6 h-6 text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parcel Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Parcel Status</h3>
          <div className="space-y-3">
            {stats?.parcels?.statusBreakdown?.map((item: any) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-gray-600">{item.status}</span>
                <span className="font-semibold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
          <div className="space-y-3">
            {stats?.payments?.statusBreakdown?.map((item: any) => (
              <div key={item.status} className="flex items-center justify-between">
                <span className="text-gray-600 capitalize">{item.status}</span>
                <span className="font-semibold text-gray-900">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
        </div>
        <div className="divide-y">
          {activityData?.activities?.slice(0, 10).map((activity: any) => (
            <div key={`${activity.type}-${activity.id}`} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{activity.userName}</span>
                    <span>•</span>
                    <span>{format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    activity.status === 'Pending' || activity.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : activity.status === 'Active' || activity.status === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
