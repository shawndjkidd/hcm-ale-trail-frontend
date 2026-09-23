import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
// Admin loads on demand so customers never download the dashboard code
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'))
import ResetPassword from './components/ResetPassword.jsx'
import './styles/App.css'

// App icon trial: ?icon=pint|wordmark|hcm swaps the home-screen icon so the
// founder can add each version to a phone and compare. The choice is remembered.
try {
  const ICONS = ['pint', 'wordmark', 'hcm']
  const q = new URLSearchParams(window.location.search).get('icon')
  if (q && ICONS.includes(q)) localStorage.setItem('hcm-icon', q)
  const icon = localStorage.getItem('hcm-icon')
  if (icon && ICONS.includes(icon)) {
    document.getElementById('app-manifest')?.setAttribute('href', `/manifest-${icon}.webmanifest`)
    document.getElementById('app-touch-icon')?.setAttribute('href', `/icons/${icon}-180.png`)
  }
} catch {}

// Simple routing: /admin → AdminApp, /reset-password → ResetPassword, everything else → App
const isAdminRoute = window.location.pathname.startsWith('/admin')
const isResetPassword = window.location.pathname === '/reset-password'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdminRoute ? <Suspense fallback={null}><AdminApp /></Suspense> : isResetPassword ? <ResetPassword /> : <App />}
  </React.StrictMode>,
)
