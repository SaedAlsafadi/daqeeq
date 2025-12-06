import { Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Landing Page Components
import LandingPage from './pages/Landing/LandingPage'

// Auth Components
import SignIn from './pages/Auth/SignIn'
import SignUp from './pages/Auth/SignUp'
import ChangePasswordOnLogin from './pages/Auth/ChangePasswordOnLogin'

// Supplier Components
import SupplierContactForm from './pages/SupplierContact/SupplierContactForm'

// Dashboard Components
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard/Dashboard'
import Requests from './pages/Dashboard/Requests'
import Analytics from './pages/Dashboard/Analytics'
import Prediction from './pages/Dashboard/Prediction'
import Profile from './pages/Dashboard/Profile'
import Notifications from './pages/Dashboard/Notifications'
import SupplyFeedback from './pages/Dashboard/SupplyFeedback'
import AdminFeedbackReview from './pages/Dashboard/AdminFeedbackReview'
import SupplierManagement from './pages/Dashboard/SupplierManagement'

// Service Provider Dashboard Components
import ProviderDashboard from './pages/Dashboard/ProviderDashboard'
import ProviderProfile from './pages/Dashboard/ProviderProfile'
import ProviderRequests from './pages/Dashboard/ProviderRequests'
import ProviderAnalytics from './pages/Dashboard/ProviderAnalytics'
import ProviderCommunication from './pages/Dashboard/ProviderCommunication'

// Context Providers
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

// Protected Route Component
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/change-password" element={<ChangePasswordOnLogin />} />
            <Route path="/partner/contact" element={<SupplierContactForm />} />
            
            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="prediction" element={<Prediction />} />
              <Route path="requests" element={<Requests />} />
              <Route path="feedback" element={<SupplyFeedback />} />
              <Route path="admin/feedback-review" element={<AdminFeedbackReview />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="profile" element={<Profile />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="suppliers" element={<SupplierManagement />} />
              
              {/* Service Provider Routes */}
              <Route path="provider" element={<ProviderDashboard />} />
              <Route path="provider/profile" element={<ProviderProfile />} />
              <Route path="provider/requests" element={<ProviderRequests />} />
              <Route path="provider/analytics" element={<ProviderAnalytics />} />
              <Route path="provider/communications" element={<ProviderCommunication />} />
            </Route>
            
            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App