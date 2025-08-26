import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/common/PrivateRoute'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Dashboard pages
import Dashboard from './pages/dashboard/Dashboard'
import UserDashboard from './pages/dashboard/UserDashboard'
import AgentDashboard from './pages/agent/AgentDashboard'
import AdminDashboard from './pages/admin/AdminDashboard'

// Feature pages
import TicketDetail from './pages/tickets/TicketDetail'
import KBManagement from './pages/admin/KBManagement'
import Settings from './pages/admin/Settings'

import './styles/index.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected dashboard routes */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />

            {/* User-specific routes */}
            <Route 
              path="/user/dashboard" 
              element={
                <PrivateRoute allowedRoles={['user']}>
                  <UserDashboard />
                </PrivateRoute>
              } 
            />
            
            {/* Agent-specific routes */}
            <Route 
              path="/agent/dashboard" 
              element={
                <PrivateRoute allowedRoles={['agent', 'admin']}>
                  <AgentDashboard />
                </PrivateRoute>
              } 
            />
            
            {/* Admin-specific routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin/kb" 
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <KBManagement />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin/settings" 
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <Settings />
                </PrivateRoute>
              } 
            />
            
            {/* Ticket detail route - accessible by all authenticated users */}
            <Route 
              path="/tickets/:id"   
              element={
                <PrivateRoute>
                  <TicketDetail />
                </PrivateRoute>
              } 
            />
            
            {/* Default route - redirect to dashboard if authenticated, login if not */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            {/* 404 route */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App