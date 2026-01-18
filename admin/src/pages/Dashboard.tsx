import { useQuery } from '@tanstack/react-query'
import { fetchWithAuth } from '../lib/api'
import StatsCard from '../components/StatsCard'
import { SkeletonCard, SkeletonChart } from '../components/Skeleton'
import { Users, Package, Route, CreditCard, TrendingUp, Activity, AlertTriangle, Sparkles, Wallet, Download, ArrowUp, ArrowDown } from 'lucide-react'
import { format } from 'date-fns'
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { memo } from 'react'

// Memoized chart components for performance
const MemoizedPieChart = memo(({ data, colors }: { data: any[], colors: string[] }) => (
  <ResponsiveContainer width="100%" height={250}>
    <PieChart>
      <Pie
        data={data}
        dataKey="count"
        nameKey="status"
        cx="50%"
        cy="50%"
        outerRadius={80}
        label
      >
        {data.map((entry: any, index: number) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
))

MemoizedPieChart.displayName = 'MemoizedPieChart'

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
      <div className="space-y-8">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonChart />
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8" data-testid="dashboard">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary via-[#0A5A80] to-primary dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-[2rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
            Dashboard
          </h1>
          <p className="text-white/80 text-xl font-medium max-w-2xl leading-relaxed">
            Welcome back! Here's a high-level overview of your platform's performance and recent activity.
          </p>
        </div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" aria-hidden="true"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-secondary/10 rounded-full blur-3xl" aria-hidden="true"></div>
      </div>

      {/* Stats Grid - Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="region" aria-label="Key metrics">
        <StatsCard
          title="Total Users"
          value={stats?.users?.total || 0}
          change={stats?.users?.recent ? `+${stats.users.recent} this month` : undefined}
          icon={<Users className="w-8 h-8 text-white" aria-hidden="true" />}
          color="bg-blue-500"
          trend={stats?.users?.recent > 0 ? 'up' : 'neutral'}
          data-testid="stat-total-users"
        />
        <StatsCard
          title="Active Parcels"
          value={stats?.parcels?.pending || 0}
          icon={<Package className="w-8 h-8 text-white" aria-hidden="true" />}
          color="bg-green-500"
          trend="neutral"
          data-testid="stat-active-parcels"
        />
        <StatsCard
          title="Active Routes"
          value={stats?.routes?.active || 0}
          icon={<Route className="w-8 h-8 text-white" aria-hidden="true" />}
          color="bg-purple-500"
          trend="neutral"
          data-testid="stat-active-routes"
        />
        <StatsCard
          title="Total Revenue"
          value={`$${(stats?.payments?.revenue || 0).toLocaleString()}`}
          icon={<CreditCard className="w-8 h-8 text-white" aria-hidden="true" />}
          color="bg-orange-500"
          trend="neutral"
          data-testid="stat-total-revenue"
        />
      </div>

      {/* Stats Grid - Row 2 (New Features) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Open Disputes"
          value={stats?.disputes?.open || 0}
          change={stats?.disputes?.total ? `${stats.disputes.total} total` : undefined}
          icon={<AlertTriangle className="w-8 h-8 text-white" aria-hidden="true" />}
          color="bg-red-500"
          trend="down"
          data-testid="stat-open-disputes"
        />
        <StatsCard
          title="Active Subscriptions"
          value={stats?.subscriptions?.active || 0}
          icon={<Sparkles className="w-8 h-8 text-white" aria-hidden="true" />}
          color="bg-indigo-500"
          trend="up"
          data-testid="stat-active-subscriptions"
        />
        <StatsCard
          title="Total Wallet Balance"
          value={`$${(stats?.wallet?.totalBalance || 0).toLocaleString()}`}
          icon={<Wallet className="w-8 h-8 text-white" aria-hidden="true" />}
          color="bg-teal-500"
          trend="neutral"
          data-testid="stat-wallet-balance"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" role="region" aria-label="Data visualizations">
        {/* Parcel Status Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center">
            <div className="w-1 h-6 bg-primary rounded-full mr-3" aria-hidden="true"></div>
            Parcel Status Distribution
          </h3>
          <div className="flex justify-center">
            {stats?.parcels?.statusBreakdown && stats.parcels.statusBreakdown.length > 0 ? (
              <MemoizedPieChart 
                data={stats.parcels.statusBreakdown} 
                colors={['#0EA5E9', '#10B981', '#F59E0B', '#EF4444']}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 py-16">No data available</p>
            )}
          </div>
        </div>

        {/* Payment Status Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center">
            <div className="w-1 h-6 bg-secondary rounded-full mr-3" aria-hidden="true"></div>
            Payment Status Distribution
          </h3>
          <div className="flex justify-center">
            {stats?.payments?.statusBreakdown && stats.payments.statusBreakdown.length > 0 ? (
              <MemoizedPieChart 
                data={stats.payments.statusBreakdown} 
                colors={['#06B6D4', '#8B5CF6', '#EC4899', '#6B7280']}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 py-16">No data available</p>
            )}
          </div>
        </div>

        {/* Dispute Status Pie Chart */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-5 flex items-center">
            <div className="w-1 h-6 bg-red-500 rounded-full mr-3" aria-hidden="true"></div>
            Dispute Status Distribution
          </h3>
          <div className="flex justify-center">
            {stats?.disputes?.statusBreakdown && stats.disputes.statusBreakdown.length > 0 ? (
              <MemoizedPieChart 
                data={stats.disputes.statusBreakdown} 
                colors={['#EF4444', '#F97316', '#FCD34D', '#94A3B8']}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 py-16">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" role="region" aria-label="Detailed statistics">
        {stats?.parcels?.statusBreakdown?.map((item: any) => (
          <div key={item.status} className="card p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{item.status}</p>
            <p className="text-2xl font-bold text-primary dark:text-primary mt-2">{item.count}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="card" role="region" aria-label="Recent activity">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Recent Activity</h3>
          </div>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {activityData?.activities?.slice(0, 10).map((activity: any) => (
            <div key={`${activity.type}-${activity.id}`} className="p-6 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-medium">{activity.userName}</span>
                    <span className="text-gray-300 dark:text-gray-600" aria-hidden="true">•</span>
                    <time dateTime={activity.createdAt}>{format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm')}</time>
                  </div>
                </div>
                <span
                  className={`px-4 py-1 text-xs font-bold rounded-full whitespace-nowrap ml-4 ${
                    activity.status === 'Pending' || activity.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : activity.status === 'Active' || activity.status === 'success'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                  role="status"
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
