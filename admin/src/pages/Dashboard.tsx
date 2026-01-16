import { useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '../lib/api'
import StatsCard from '../components/StatsCard'
import { Users, Package, Route, CreditCard, TrendingUp, Activity, AlertTriangle, Sparkles, Wallet, Download } from 'lucide-react'
import { format } from 'date-fns'
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

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
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary to-[#0A5A80] rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-white/80 text-lg">Welcome back! Here's what's happening with your platform today.</p>
      </div>

      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.users?.total || 0}
          change={`+${stats?.users?.recent || 0} this month`}
          icon={<Users className="w-8 h-8 text-white" />}
          color="bg-blue-500"
        />
        <StatsCard
          title="Active Parcels"
          value={stats?.parcels?.pending || 0}
          icon={<Package className="w-8 h-8 text-white" />}
          color="bg-green-500"
        />
        <StatsCard
          title="Active Routes"
          value={stats?.routes?.active || 0}
          icon={<Route className="w-8 h-8 text-white" />}
          color="bg-purple-500"
        />
        <StatsCard
          title="Total Revenue"
          value={`${(stats?.payments?.revenue || 0).toLocaleString()}`}
          icon={<CreditCard className="w-8 h-8 text-white" />}
          color="bg-orange-500"
        />
      </div>

      {/* Stats Grid - Row 2 (New Features) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Open Disputes"
          value={stats?.disputes?.open || 0}
          change={`${stats?.disputes?.total || 0} total`}
          icon={<AlertTriangle className="w-8 h-8 text-white" />}
          color="bg-red-500"
        />
        <StatsCard
          title="Active Subscriptions"
          value={stats?.subscriptions?.active || 0}
          icon={<Sparkles className="w-8 h-8 text-white" />}
          color="bg-indigo-500"
        />
        <StatsCard
          title="Total Wallet Balance"
          value={`${(stats?.wallet?.totalBalance || 0).toLocaleString()}`}
          icon={<Wallet className="w-8 h-8 text-white" />}
          color="bg-teal-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parcel Status Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
            <div className="w-1 h-6 bg-primary rounded-full mr-3"></div>
            Parcel Status Distribution
          </h3>
          <div className="flex justify-center">
            {stats?.parcels?.statusBreakdown && stats.parcels.statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.parcels.statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.parcels.statusBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#0EA5E9', '#10B981', '#F59E0B', '#EF4444'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        </div>

        {/* Payment Status Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
            <div className="w-1 h-6 bg-secondary rounded-full mr-3"></div>
            Payment Status Distribution
          </h3>
          <div className="flex justify-center">
            {stats?.payments?.statusBreakdown && stats.payments.statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.payments.statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.payments.statusBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#06B6D4', '#8B5CF6', '#EC4899', '#6B7280'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        </div>

        {/* Dispute Status Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center">
            <div className="w-1 h-6 bg-red-500 rounded-full mr-3"></div>
            Dispute Status Distribution
          </h3>
          <div className="flex justify-center">
            {stats?.disputes?.statusBreakdown && stats.disputes.statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.disputes.statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {stats.disputes.statusBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={['#EF4444', '#F97316', '#FCD34D', '#94A3B8'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats?.parcels?.statusBreakdown?.map((item: any) => (
          <div key={item.status} className="card p-4">
            <p className="text-sm text-gray-600 font-medium">{item.status}</p>
            <p className="text-2xl font-bold text-primary mt-2">{item.count}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {activityData?.activities?.slice(0, 10).map((activity: any) => (
            <div key={`${activity.type}-${activity.id}`} className="p-6 hover:bg-gray-50/50 transition-colors duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span className="font-medium">{activity.userName}</span>
                    <span className="text-gray-300">•</span>
                    <span>{format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                </div>
                <span
                  className={`px-4 py-1 text-xs font-bold rounded-full whitespace-nowrap ml-4 ${
                    activity.status === 'Pending' || activity.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : activity.status === 'Active' || activity.status === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
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
