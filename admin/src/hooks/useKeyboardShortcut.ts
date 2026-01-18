import { useEffect } from 'react'

type KeyCombo = {
  key: string
  ctrl?: boolean
  shift?: boolean
  meta?: boolean
}

export function useKeyboardShortcut(
  combo: KeyCombo,
  callback: () => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return

    const handler = (e: KeyboardEvent) => {
      const matchesKey = e.key.toLowerCase() === combo.key.toLowerCase()
      const matchesCtrl = combo.ctrl ? e.ctrlKey : true
      const matchesShift = combo.shift ? e.shiftKey : true
      const matchesMeta = combo.meta ? e.metaKey : true

      if (matchesKey && matchesCtrl && matchesShift && matchesMeta) {
        e.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [combo, callback, enabled])
}
