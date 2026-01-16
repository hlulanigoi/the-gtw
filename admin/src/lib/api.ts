export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('adminToken')
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  try {
    const fullUrl = `${API_BASE_URL}${url}`
    console.log(`[API] Fetching ${fullUrl}`)
    
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      localStorage.removeItem('adminToken')
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      console.error(`[API] Error ${response.status}:`, error)
      throw new Error(error.error || `Request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[API] Success:`, data)
    return data
  } catch (error) {
    console.error('[API] Fetch error:', error)
    throw error
  }
}
