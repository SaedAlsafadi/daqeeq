const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  unread: boolean
  createdAt: string
  actionUrl?: string
}

export const notificationsService = {
  async fetchNotifications(token: string): Promise<Notification[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      return data.notifications || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  },

  async markAsRead(token: string, notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  },

  async markAllAsRead(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      return true
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }
  },

  async deleteNotification(token: string, notificationId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      return true
    } catch (error) {
      console.error('Error deleting notification:', error)
      return false
    }
  },

  // Generate sample notifications for demo if backend not ready
  generateSampleNotifications(): Notification[] {
    return [
      {
        id: '1',
        title: 'Low Stock Alert',
        message: 'Toilet paper inventory is running low (< 20% stock)',
        type: 'warning',
        unread: true,
        createdAt: new Date(Date.now() - 5 * 60000).toISOString()
      },
      {
        id: '2',
        title: 'Order Delivered',
        message: 'Your cleaning supplies order #ORD-2024-001 has been delivered',
        type: 'success',
        unread: true,
        createdAt: new Date(Date.now() - 60 * 60000).toISOString()
      },
      {
        id: '3',
        title: 'AI Forecast Ready',
        message: 'New supply forecast for next month is available. Review predictions in the Prediction dashboard.',
        type: 'info',
        unread: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        actionUrl: '/dashboard/prediction'
      },
      {
        id: '4',
        title: 'Payment Processed',
        message: 'Your payment of $1,250.00 has been successfully processed',
        type: 'success',
        unread: false,
        createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString()
      }
    ]
  }
}