import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatItem {
  label: string
  value: string | number
  change?: number
  icon: React.ReactNode
  color: string
}

interface StatsGridProps {
  stats: StatItem[]
  cols?: number
}

export default function StatsGrid({ stats, cols = 4 }: StatsGridProps) {
  const colsClass = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
  }[cols] || 'md:grid-cols-4'

  return (
    <div className={`grid grid-cols-1 ${colsClass} gap-4`}>
      {stats.map((stat, index) => (
        <div key={index} className={`bg-white rounded-xl shadow p-6 border-l-4 ${stat.color}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 mt-2">
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
              </p>
              {stat.change !== undefined && (
                <div className="flex items-center space-x-1 mt-3">
                  {stat.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : stat.change < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={`text-xs font-semibold ${
                    stat.change > 0
                      ? 'text-green-600'
                      : stat.change < 0
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {stat.change > 0 ? '+' : ''}{stat.change}%
                  </span>
                </div>
              )}
            </div>
            <div className="text-gray-400 flex-shrink-0">
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
