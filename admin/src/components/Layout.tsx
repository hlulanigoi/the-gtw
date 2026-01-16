import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'
import NotificationCenter, { Notification } from './NotificationCenter'
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Route, 
  CreditCard, 
  Star, 
  AlertTriangle,
  Sparkles,
  Wallet,
  Settings,
  LogOut 
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Parcels', href: '/parcels', icon: Package },
  { name: 'Routes', href: '/routes', icon: Route },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Reviews', href: '/reviews', icon: Star },
  { name: 'Disputes', href: '/disputes', icon: AlertTriangle },
  { name: 'Subscriptions', href: '/subscriptions', icon: Sparkles },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'System Maintenance',
      message: 'Database maintenance scheduled for tonight at 2 AM',
      type: 'info',
      timestamp: new Date(),
      read: false,
    },
    {
      id: '2',
      title: 'New Dispute',
      message: 'A new dispute has been opened by user #12345',
      type: 'warning',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
    },
  ])

  const handleClearNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const handleClearAllNotifications = () => {
    setNotifications([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-primary to-[#0A5A80] shadow-2xl fixed h-full overflow-y-auto">
          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white font-bold" />
                </div>
                <h1 className="text-2xl font-bold text-white">ParcelPeer</h1>
              </div>
              <p className="text-sm text-white/70">Admin Dashboard</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                      isActive
                        ? 'bg-white text-primary shadow-lg'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="font-medium text-sm">{item.name}</span>
                    {isActive && <div className="ml-auto w-2 h-2 bg-secondary rounded-full"></div>}
                  </Link>
                )
              })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/10 space-y-3">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{user?.email}</p>
                    <p className="text-xs text-white/60">Administrator</p>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors duration-200 font-medium text-sm backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="ml-64 flex-1">
          {/* Top bar with notifications */}
          <div className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex items-center justify-between">
            <div />
            <NotificationCenter 
              notifications={notifications}
              onClear={handleClearNotification}
              onClearAll={handleClearAllNotifications}
            />
          </div>
          <div className="p-8 min-h-screen">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
