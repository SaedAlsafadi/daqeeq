import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { notificationsService, Notification } from '@/services/notificationsService'
import { 
  HiBell, 
  HiXMark,
  HiCheckCircle,
  HiExclamationTriangle,
  HiInformationCircle,
  HiTrash
} from 'react-icons/hi2'

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [deletedNotificationIds, setDeletedNotificationIds] = useState<Set<string>>(new Set())
  const { user } = useAuth()

  useEffect(() => {
    fetchNotifications()
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      if (!token) return

      const data = await notificationsService.fetchNotifications(token)
      setNotifications(data)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notification: Notification) => {
    const token = localStorage.getItem('authToken')
    if (token && notification.id) {
      await notificationsService.markAsRead(token, notification.id)
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, unread: false } : n
      ))
    }
  }

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('authToken')
    if (token) {
      await notificationsService.markAllAsRead(token)
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
    }
  }

  const handleDeleteNotification = async (notificationId: string) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      await notificationsService.deleteNotification(token, notificationId)
      setDeletedNotificationIds(prev => new Set(prev).add(notificationId))
    }
  }

  const handleClearAll = async () => {
    const token = localStorage.getItem('authToken')
    if (token && filteredNotifications.length > 0) {
      // Delete all notifications one by one
      for (const notification of filteredNotifications) {
        await notificationsService.deleteNotification(token, notification.id)
        setDeletedNotificationIds(prev => new Set(prev).add(notification.id))
      }
    }
  }

  const filteredNotifications = notifications.filter(n => !deletedNotificationIds.has(n.id))
  const unreadCount = filteredNotifications.filter(n => n.unread).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <HiCheckCircle className="w-6 h-6 text-green-500" />
      case 'warning':
        return <HiExclamationTriangle className="w-6 h-6 text-yellow-500" />
      case 'error':
        return <HiExclamationTriangle className="w-6 h-6 text-red-500" />
      default:
        return <HiInformationCircle className="w-6 h-6 text-blue-500" />
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
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredNotifications.length} {filteredNotifications.length === 1 ? 'notification' : 'notifications'}
            {unreadCount > 0 && ` • ${unreadCount} unread`}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              Mark all as read
            </button>
          )}
          {filteredNotifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNotifications.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <HiBell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No notifications
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You're all caught up! Check back later for updates.
          </p>
        </div>
      )}

      {/* Notifications List */}
      {!loading && filteredNotifications.length > 0 && (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors ${
                notification.unread ? getNotificationBgColor(notification.type) : 'bg-white dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                        {notification.unread && (
                          <span className="ml-2 inline-block w-2 h-2 bg-primary-600 rounded-full"></span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {notification.unread && (
                      <button
                        onClick={() => handleMarkAsRead(notification)}
                        className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteNotification(notification.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Delete notification"
                >
                  <HiTrash className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Notifications