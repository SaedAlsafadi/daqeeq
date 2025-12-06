import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { notificationsService, Notification } from '@/services/notificationsService'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { 
  HiBars3, 
  HiSun, 
  HiMoon, 
  HiBell, 
  HiUser, 
  HiArrowRightOnRectangle,
  HiChevronDown,
  HiXMark,
  HiCheckCircle,
  HiExclamationTriangle,
  HiInformationCircle
} from 'react-icons/hi2'

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const Header = ({ sidebarOpen, setSidebarOpen }: HeaderProps) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [deletedNotificationIds, setDeletedNotificationIds] = useState<Set<string>>(new Set())
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications()
      // Refresh every 30 seconds when dropdown is open
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [notificationsOpen])

  // Initial fetch on mount (poll every 60 seconds)
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const token = localStorage.getItem('authToken')
      if (!token) return

      const data = await notificationsService.fetchNotifications(token)
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    const token = localStorage.getItem('authToken')
    if (token && notification.id) {
      await notificationsService.markAsRead(token, notification.id)
      // Update local state to mark as read
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, unread: false } : n
      ))
    }
    
    if (notification.actionUrl) {
      navigate(notification.actionUrl)
      setNotificationsOpen(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('authToken')
    if (token) {
      await notificationsService.markAllAsRead(token)
      // Update local state to mark all as read
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
    }
  }

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    const token = localStorage.getItem('authToken')
    if (token) {
      await notificationsService.deleteNotification(token, notificationId)
      // Add to deleted set for immediate UI update
      setDeletedNotificationIds(prev => new Set(prev).add(notificationId))
    }
  }

  const filteredNotifications = notifications.filter(n => !deletedNotificationIds.has(n.id))
  const unreadCount = filteredNotifications.filter(n => n.unread).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <HiCheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <HiExclamationTriangle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <HiExclamationTriangle className="w-5 h-5 text-red-500" />
      default:
        return <HiInformationCircle className="w-5 h-5 text-blue-500" />
    }
  }

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/10'
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/10'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/10'
      default:
        return 'bg-blue-50 dark:bg-blue-900/10'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <header className="sticky top-0 z-30 flex w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex flex-grow items-center justify-between px-4 py-4 md:px-6 2xl:px-11">
        {/* Left side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <HiBars3 className="w-6 h-6" />
          </button>

          {/* Page title */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Dashboard
            </h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 2xsm:gap-7">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <HiMoon className="w-5 h-5" /> : <HiSun className="w-5 h-5" />}
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Notifications"
            >
              <HiBell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Notifications {unreadCount > 0 && `(${unreadCount})`}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Notifications list */}
                {loadingNotifications && (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                )}

                {!loadingNotifications && filteredNotifications.length === 0 && (
                  <div className="p-8 text-center">
                    <HiBell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">No notifications yet</p>
                  </div>
                )}

                {!loadingNotifications && filteredNotifications.length > 0 && (
                  <div className="max-h-96 overflow-y-auto">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                          notification.unread ? getNotificationBgColor(notification.type) : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteNotification(e, notification.id)}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <HiXMark className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                {filteredNotifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <button
                      onClick={() => {
                        setNotificationsOpen(false)
                        navigate('/dashboard/notifications')
                      }}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium w-full text-center py-1"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                  {user?.companyName?.charAt(0).toUpperCase() || user?.firstName?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.companyName || `${user?.firstName} ${user?.lastName}`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.role === 'client' ? 'Client' : user?.role === 'service_provider' ? 'Service Provider' : user?.role === 'admin' ? 'Admin' : user?.role}
                </p>
              </div>
              <HiChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>

            {/* User dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                <button
                  onClick={() => {
                    navigate('/dashboard/profile')
                    setDropdownOpen(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <HiUser className="w-4 h-4 mr-3" />
                  Profile
                </button>
                <hr className="my-1 border-gray-200 dark:border-gray-700" />
                <button
                  onClick={() => {
                    logout()
                    setDropdownOpen(false)
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <HiArrowRightOnRectangle className="w-4 h-4 mr-3" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header