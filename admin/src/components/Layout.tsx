import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth, hasPermission } from '../contexts/AuthContext'
import { useState } from 'react'
import NotificationCenter, { Notification } from './NotificationCenter'
import CommandPalette from './CommandPalette'
import { useDarkMode } from '../hooks/useDarkMode'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'
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
  LogOut,
  Moon,
  Sun,
  Command
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, permission: 'view_dashboard' as const },
  { name: 'Users', href: '/users', icon: Users, permission: 'view_users' as const },
  { name: 'Parcels', href: '/parcels', icon: Package, permission: 'view_parcels' as const },
  { name: 'Routes', href: '/routes', icon: Route, permission: 'view_routes' as const },
  { name: 'Payments', href: '/payments', icon: CreditCard, permission: 'view_payments' as const },
  { name: 'Reviews', href: '/reviews', icon: Star, permission: 'view_reviews' as const },
  { name: 'Disputes', href: '/disputes', icon: AlertTriangle, permission: 'view_disputes' as const },
  { name: 'Subscriptions', href: '/subscriptions', icon: Sparkles, permission: 'view_subscriptions' as const },
  { name: 'Wallet', href: '/wallet', icon: Wallet, permission: 'view_wallet' as const },
  { name: 'Settings', href: '/settings', icon: Settings, permission: 'access_settings' as const },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isDark, setIsDark] = useDarkMode()
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
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

  useKeyboardShortcut({ key: 'k', meta: true }, () => setIsCommandPaletteOpen(true))
  useKeyboardShortcut({ key: 'k', ctrl: true }, () => setIsCommandPaletteOpen(true))

  // Filter navigation based on user permissions
  const visibleNavigation = navigation.filter(item => hasPermission(user, item.permission))

  const handleClearNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  const handleClearAllNotifications = () => {
    setNotifications([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Skip to main content for screen readers */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gradient-to-b from-primary to-[#0A5A80] dark:from-gray-900 dark:to-gray-950 shadow-2xl fixed h-full overflow-y-auto" role="navigation" aria-label="Main navigation">
          <div className="flex flex-col h-full">
            {/* Logo Section */}
            <div className="p-6 border-b border-white/10 dark:border-gray-800">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white font-bold" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-bold text-white">ParcelPeer</h1>
              </div>
              <p className="text-sm text-white/70">Admin Dashboard</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2" aria-label="Primary">
              {visibleNavigation.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                      isActive
                        ? 'bg-white text-primary shadow-xl scale-[1.02]'
                        : 'text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                    data-testid={`nav-${item.name.toLowerCase()}`}
                  >
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'rotate-3 scale-110' : 'group-hover:scale-110'}`} aria-hidden="true" />
                    <span className="font-semibold text-sm tracking-wide">{item.name}</span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 bg-secondary rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" aria-hidden="true"></div>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/10 dark:border-gray-800 space-y-3">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{user?.email}</p>
                    <div className="flex items-center space-x-1 mt-0.5">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        user?.role === 'admin' 
                          ? 'bg-purple-500/30 text-purple-100' 
                          : 'bg-blue-500/30 text-blue-100'
                      }`}>
                        {user?.role === 'admin' ? '👑 Admin' : '🛟 Support'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors duration-200 font-medium text-sm backdrop-blur-sm"
                data-testid="logout-btn"
                aria-label="Logout from admin panel"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="ml-64 flex-1">
          {/* Top bar with notifications */}
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                data-testid="open-command-palette"
                aria-label="Open command palette"
              >
                <Command className="w-4 h-4 text-gray-600 dark:text-gray-300" aria-hidden="true" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Quick actions</span>
                <kbd className="hidden md:inline-block px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                  ⌘K
                </kbd>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                data-testid="dark-mode-toggle"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-yellow-500" aria-hidden="true" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" aria-hidden="true" />
                )}
              </button>
              <NotificationCenter 
                notifications={notifications}
                onClear={handleClearNotification}
                onClearAll={handleClearAllNotifications}
              />
            </div>
          </div>
          <main id="main-content" className="p-8 min-h-screen">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
