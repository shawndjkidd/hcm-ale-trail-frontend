import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AdminApp from './admin/AdminApp.jsx'
import ResetPassword from './components/ResetPassword.jsx'
import './styles/App.css'

// Simple routing: /admin → AdminApp, /reset-password → ResetPassword, everything else → App
const isAdminRoute = window.location.pathname.startsWith('/admin')
const isResetPassword = window.location.pathname === '/reset-password'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdminRoute ? <AdminApp /> : isResetPassword ? <ResetPassword /> : <App />}
  </React.StrictMode>,
)
