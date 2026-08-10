import { useEffect, useState } from 'react'

export function navigate(route) {
  window.location.hash = route.replace(/^#/, '')
}

export function useHashRoute(defaultRoute = 'dashboard') {
  const getRoute = () => window.location.hash.replace(/^#/, '') || defaultRoute
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const onChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
