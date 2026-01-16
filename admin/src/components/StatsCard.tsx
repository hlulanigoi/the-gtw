interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  color: string
}

export default function StatsCard({ title, value, change, icon, color }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-4xl font-bold text-gray-900 tracking-tight">{value}</p>
          {change && (
            <p className="text-sm text-green-600 font-semibold mt-2 flex items-center">
              <span className="inline-block w-1.5 h-1.5 bg-green-600 rounded-full mr-1"></span>
              {change}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${color} transform hover:scale-110 transition-transform duration-200 shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
