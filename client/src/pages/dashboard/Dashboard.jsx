import { useAuth } from '../../context/AuthContext'
import UserDashboard from './UserDashboard'
import AdminDashboard from '../admin/AdminDashboard'
import ComingSoonDashboard from './ComingSoonDashboard'

const Dashboard = () => {
  const { user } = useAuth()

  // Render different dashboards based on user role
  switch (user?.role) {
    case 'user':
      return <UserDashboard />
    case 'admin':
      return <AdminDashboard />
    case 'agent':
      return <ComingSoonDashboard role={user.role} />
    default:
      return <ComingSoonDashboard role="unknown" />
  }
}

export default Dashboard