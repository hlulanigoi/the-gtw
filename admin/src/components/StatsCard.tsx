interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  color: string
  trend?: 'up' | 'down' | 'neutral'
}

export default function StatsCard({ title, value, change, icon, color, trend }: StatsCardProps) {
  return (
    <div className="card group hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 overflow-hidden relative border-none bg-white dark:bg-gray-800 p-0">
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className={`${color} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          {change && (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
              trend === 'up' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                : trend === 'down'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}>
              {change}
            </span>
          )}
        </div>
        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">
          {title}
        </h3>
        <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          {value}
        </p>
      </div>
      <div className={`absolute bottom-0 left-0 h-1 w-0 group-hover:w-full transition-all duration-500 ${color}`} aria-hidden="true"></div>
    </div>
  )
}
