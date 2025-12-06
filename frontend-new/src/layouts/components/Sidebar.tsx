import { useRef, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { 
  HiHome, 
  HiDocumentText, 
  HiCubeTransparent, 
  HiChartBarSquare,
  HiSparkles, 
  HiUser, 
  HiXMark,
  HiUserGroup,
  HiCheckCircle,
  HiEnvelope
} from 'react-icons/hi2'

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation()
  const { user } = useAuth()
  const trigger = useRef<HTMLButtonElement>(null)
  const sidebar = useRef<HTMLDivElement>(null)

  // Close sidebar on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current || !trigger.current) return
      if (
        !sidebarOpen ||
        sidebar.current.contains(target as Node) ||
        trigger.current.contains(target as Node)
      )
        return
      setSidebarOpen(false)
    }
    document.addEventListener('click', clickHandler)
    return () => document.removeEventListener('click', clickHandler)
  })

  // Close sidebar on escape key
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return
      setSidebarOpen(false)
    }
    document.addEventListener('keydown', keyHandler)
    return () => document.removeEventListener('keydown', keyHandler)
  })

  const baseNavigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HiHome,
    },
    {
      name: 'AI Prediction',
      href: '/dashboard/prediction',
      icon: HiSparkles,
    },
    {
      name: 'Quotation Requests',
      href: '/dashboard/requests',
      icon: HiDocumentText,
    },
    {
      name: 'Supply Feedback',
      href: '/dashboard/feedback',
      icon: HiCubeTransparent,
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: HiChartBarSquare,
    },
  ]

  const adminNavigation = [
    {
      name: 'Feedback Review',
      href: '/dashboard/admin/feedback-review',
      icon: HiCheckCircle,
    },
    {
      name: 'Supplier Management',
      href: '/dashboard/suppliers',
      icon: HiUserGroup,
    },
  ]

  const serviceProviderNavigation = [
    {
      name: 'Dashboard',
      href: '/dashboard/provider',
      icon: HiHome,
    },
    {
      name: 'Client Requests',
      href: '/dashboard/provider/requests',
      icon: HiDocumentText,
    },
    {
      name: 'Analytics',
      href: '/dashboard/provider/analytics',
      icon: HiChartBarSquare,
    },
    {
      name: 'Communications',
      href: '/dashboard/provider/communications',
      icon: HiEnvelope,
    },
    {
      name: 'Company Profile',
      href: '/dashboard/provider/profile',
      icon: HiUser,
    },
  ]

  const clientNavigation = [
    ...baseNavigation,
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: HiUser,
    },
  ]

  const userNavigation = [
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: HiUser,
    },
  ]

  let navigation = [];
  
  if (user?.role === 'service_provider') {
    navigation = serviceProviderNavigation
  } else if (user?.role === 'admin') {
    navigation = [
      ...baseNavigation,
      ...adminNavigation,
      ...userNavigation,
    ]
  } else {
    navigation = clientNavigation
  }

  return (
    <>
      {/* Sidebar backdrop (mobile) */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900 bg-opacity-50 transition-opacity lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        ref={sidebar}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Daqeeq
              </span>
            </div>
            
            {/* Close button (mobile) */}
            <button
              ref={trigger}
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              <HiXMark className="w-6 h-6" />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-semibold">
                  {user?.companyName?.charAt(0).toUpperCase() || user?.firstName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.companyName || `${user?.firstName} ${user?.lastName}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.role === 'client' ? 'Client' : user?.role === 'service_provider' ? 'Service Provider' : user?.role === 'admin' ? 'Admin' : user?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Daqeeq v2.0.0
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar