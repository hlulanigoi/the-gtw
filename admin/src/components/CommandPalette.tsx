import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut'

interface Command {
  id: string
  label: string
  action: () => void
  category: string
  keywords?: string[]
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const commands: Command[] = useMemo(
    () => [
      { id: 'nav-dashboard', label: 'Go to Dashboard', action: () => navigate('/'), category: 'Navigation' },
      { id: 'nav-users', label: 'Go to Users', action: () => navigate('/users'), category: 'Navigation', keywords: ['people', 'accounts'] },
      { id: 'nav-parcels', label: 'Go to Parcels', action: () => navigate('/parcels'), category: 'Navigation', keywords: ['packages', 'shipments'] },
      { id: 'nav-routes', label: 'Go to Routes', action: () => navigate('/routes'), category: 'Navigation' },
      { id: 'nav-payments', label: 'Go to Payments', action: () => navigate('/payments'), category: 'Navigation', keywords: ['transactions', 'billing'] },
      { id: 'nav-reviews', label: 'Go to Reviews', action: () => navigate('/reviews'), category: 'Navigation', keywords: ['ratings', 'feedback'] },
      { id: 'nav-disputes', label: 'Go to Disputes', action: () => navigate('/disputes'), category: 'Navigation', keywords: ['issues', 'complaints'] },
      { id: 'nav-subscriptions', label: 'Go to Subscriptions', action: () => navigate('/subscriptions'), category: 'Navigation', keywords: ['plans', 'premium'] },
      { id: 'nav-wallet', label: 'Go to Wallet Transactions', action: () => navigate('/wallet'), category: 'Navigation', keywords: ['money', 'balance'] },
      { id: 'nav-settings', label: 'Go to Settings', action: () => navigate('/settings'), category: 'Navigation', keywords: ['preferences', 'config'] },
    ],
    [navigate]
  )

  const filteredCommands = useMemo(() => {
    if (!search) return commands
    
    const searchLower = search.toLowerCase()
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(searchLower) ||
        cmd.category.toLowerCase().includes(searchLower) ||
        cmd.keywords?.some((k) => k.includes(searchLower))
    )
  }, [search, commands])

  useEffect(() => {
    if (!isOpen) {
      setSearch('')
    }
  }, [isOpen])

  useKeyboardShortcut({ key: 'Escape' }, onClose, isOpen)

  if (!isOpen) return null

  const handleCommandClick = (command: Command) => {
    command.action()
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette */}
      <div
        className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-50 animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center border-b border-gray-200 dark:border-gray-700 px-4">
            <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search commands..."
              className="flex-1 px-4 py-4 bg-transparent border-0 focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
              autoFocus
              id="command-palette-title"
              aria-label="Search commands"
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close command palette"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                No commands found
              </div>
            ) : (
              <div className="space-y-1" role="listbox">
                {Object.entries(
                  filteredCommands.reduce((acc, cmd) => {
                    if (!acc[cmd.category]) acc[cmd.category] = []
                    acc[cmd.category].push(cmd)
                    return acc
                  }, {} as Record<string, Command[]>)
                ).map(([category, cmds]) => (
                  <div key={category}>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {category}
                    </div>
                    {cmds.map((cmd) => (
                      <button
                        key={cmd.id}
                        onClick={() => handleCommandClick(cmd)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                        role="option"
                        data-testid={`command-${cmd.id}`}
                      >
                        {cmd.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 bg-gray-50 dark:bg-gray-900 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Press <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">↵</kbd> to select</span>
              <span>Press <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">Esc</kbd> to close</span>
            </div>
            <span>⌘K to open</span>
          </div>
        </div>
      </div>
    </>
  )
}
