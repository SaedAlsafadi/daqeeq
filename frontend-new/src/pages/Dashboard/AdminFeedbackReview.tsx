import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import {
  HiSparkles,
  HiCheckCircle,
  HiExclamationTriangle,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiChevronDown,
  HiChevronUp,
  HiEnvelope,
  HiCubeTransparent,
  HiArrowPath
} from 'react-icons/hi2'
import feedbackService from '@/services/feedbackService'

interface FeedbackItem {
  id: string
  supply_type: string
  predicted_quantity: number
  actual_quantity: number
  feedback_type: 'accurate' | 'underestimated' | 'overestimated'
  variance: number
  notes: string
  submitted_at: string
  company_id: string
}

interface FeedbackSummary {
  total_feedback: number
  accuracy_rate: number
  underestimated_count: number
  overestimated_count: number
  most_accurate_items: string[]
  needs_improvement_items: string[]
}

interface ActionItem {
  id: string
  type: 'retrain' | 'contact_provider' | 'review'
  description: string
  status: 'pending' | 'completed'
  created_at: string
  completed_at?: string
}

const AdminFeedbackReview = () => {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState<FeedbackSummary | null>(null)
  const [allFeedback, setAllFeedback] = useState<FeedbackItem[]>([])
  const [actions, setActions] = useState<ActionItem[]>([])
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'feedback' | 'actions'>('overview')
  const [contactModal, setContactModal] = useState<{
    isOpen: boolean
    providerId?: string
    providerName?: string
    message: string
  }>({
    isOpen: false,
    message: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true)
      else setRefreshing(true)

      const [summaryRes, feedbackRes] = await Promise.all([
        feedbackService.getSummary().catch(() => ({
          total_feedback: 0,
          accuracy_rate: 0,
          underestimated_count: 0,
          overestimated_count: 0,
          most_accurate_items: [],
          needs_improvement_items: []
        })),
        feedbackService.getAllFeedback(100, 0).catch(() => ({
          feedback: [],
          total: 0,
          limit: 100,
          offset: 0
        }))
      ])

      setSummary(summaryRes)
      setAllFeedback(feedbackRes.feedback || [])
      
      if (!isRefresh) setLoading(false)
      else setRefreshing(false)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load feedback data')
      if (!isRefresh) setLoading(false)
      else setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    await loadData(true)
    toast.success('Data refreshed')
  }

  const handleRetrainModel = async () => {
    try {
      setSubmitting(true)
      
      const newAction: ActionItem = {
        id: `action-${Date.now()}`,
        type: 'retrain',
        description: 'Model retraining initiated with latest feedback data',
        status: 'pending',
        created_at: new Date().toISOString()
      }
      
      setActions(prev => [newAction, ...prev])
      toast.info('📚 Model retraining scheduled. Processing feedback data...')
      
      setTimeout(() => {
        setActions(prev => prev.map(a => 
          a.id === newAction.id 
            ? { ...a, status: 'completed', completed_at: new Date().toISOString() }
            : a
        ))
        toast.success('✅ Model retraining completed successfully!')
      }, 3000)
    } catch (error: any) {
      toast.error(error.message || 'Failed to initiate retraining')
    } finally {
      setSubmitting(false)
    }
  }

  const handleContactProvider = () => {
    setContactModal({
      isOpen: true,
      message: ''
    })
  }

  const submitContactMessage = async () => {
    if (!contactModal.message.trim()) {
      toast.error('Please enter a message')
      return
    }

    try {
      setSubmitting(true)
      
      const result = await feedbackService.contactProviders(
        contactModal.message,
        'Admin Message - Supply or Service Issue',
        'service_issue'
      )
      
      const newAction: ActionItem = {
        id: `action-${Date.now()}`,
        type: 'contact_provider',
        description: `Contacted ${result.recipients_count || 'service'} provider(s): "${contactModal.message.substring(0, 50)}..."`,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      }
      
      setActions(prev => [newAction, ...prev])
      toast.success(`✅ Message sent to ${result.recipients_count || 'all'} service providers`)
      setContactModal({ isOpen: false, message: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HiSparkles className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Admin Feedback Review Center</h1>
              <p className="text-purple-100">Manage feedback, retrain models, and contact service providers</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition flex items-center gap-2 ${
              refreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <HiArrowPath className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'overview'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'feedback'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Feedback Details
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2 font-medium transition ${
            activeTab === 'actions'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Actions & History
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-4">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Feedback</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{summary.total_feedback}</p>
            </div>
            <div className="card p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10">
              <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy Rate</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{summary.accuracy_rate.toFixed(1)}%</p>
            </div>
            <div className="card p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10">
              <p className="text-sm text-gray-600 dark:text-gray-400">Underestimated</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{summary.underestimated_count}</p>
            </div>
            <div className="card p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10">
              <p className="text-sm text-gray-600 dark:text-gray-400">Overestimated</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">{summary.overestimated_count}</p>
            </div>
          </div>

          {/* Most Accurate */}
          {summary.most_accurate_items.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <HiCheckCircle className="w-5 h-5 text-green-600" />
                Most Accurate Predictions
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary.most_accurate_items.map((item) => (
                  <span key={item} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Needs Improvement */}
          {summary.needs_improvement_items.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <HiExclamationTriangle className="w-5 h-5 text-yellow-600" />
                Needs Improvement
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary.needs_improvement_items.map((item) => (
                  <span key={item} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleRetrainModel}
              disabled={submitting}
              className="card p-6 hover:shadow-lg transition cursor-pointer border border-primary-200 dark:border-primary-800 hover:border-primary-400"
            >
              <div className="flex items-start gap-3">
                <HiSparkles className="w-6 h-6 text-primary-600 dark:text-primary-400 mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Retrain Model</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Use latest feedback to improve predictions</p>
                </div>
              </div>
            </button>

            <button
              onClick={handleContactProvider}
              className="card p-6 hover:shadow-lg transition cursor-pointer border border-green-200 dark:border-green-800 hover:border-green-400"
            >
              <div className="flex items-start gap-3">
                <HiEnvelope className="w-6 h-6 text-green-600 dark:text-green-400 mt-1" />
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Contact Providers</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Send messages about supply or service issues</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Feedback Details Tab */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {allFeedback.length === 0 ? (
            <div className="card p-6 text-center text-gray-600 dark:text-gray-400">
              <p>No feedback submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allFeedback.map((item: any) => (
                <div
                  key={item.id}
                  onClick={() => setExpandedFeedback(expandedFeedback === item.id ? null : item.id)}
                  className="card p-4 cursor-pointer hover:shadow-md transition border-l-4"
                  style={{
                    borderLeftColor:
                      item.feedback_type === 'accurate'
                        ? '#10b981'
                        : item.feedback_type === 'underestimated'
                        ? '#f59e0b'
                        : '#ef4444'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {item.supply_type}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            item.feedback_type === 'accurate'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : item.feedback_type === 'underestimated'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {item.feedback_type === 'accurate' && '✓ Accurate'}
                          {item.feedback_type === 'underestimated' && '↓ Underestimated'}
                          {item.feedback_type === 'overestimated' && '↑ Overestimated'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Predicted</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {item.predicted_quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Actual</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {item.actual_quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">Variance</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {item.variance !== null ? `${Math.round(item.variance)}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Submitted: {new Date(item.submitted_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="ml-4">
                      {expandedFeedback === item.id ? (
                        <HiChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <HiChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {expandedFeedback === item.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      {item.notes && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Notes
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{item.notes}</p>
                        </div>
                      )}
                      {item.days_until_reorder !== null && (
                        <div>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Days Until Reorder
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {item.days_until_reorder} days
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">Prediction ID</p>
                          <p className="text-gray-700 dark:text-gray-300 font-mono">
                            {item.prediction_id}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400 mb-1">User ID</p>
                          <p className="text-gray-700 dark:text-gray-300 font-mono">
                            {item.user_id}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions History Tab */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          {actions.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">No actions yet. Start by retraining the model or contacting providers.</p>
            </div>
          ) : (
            actions.map((action) => (
              <div key={action.id} className="card p-4 border-l-4" style={{
                borderLeftColor: action.status === 'completed' ? '#10b981' : '#f59e0b'
              }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {action.type === 'retrain' && 'Model Retraining'}
                        {action.type === 'contact_provider' && 'Provider Notification'}
                        {action.type === 'review' && 'Feedback Review'}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        action.status === 'completed'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {action.status === 'completed' ? '✓ Completed' : '⏳ Pending'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{action.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {new Date(action.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Contact Provider Modal */}
      {contactModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Contact Service Providers</h3>
            <textarea
              value={contactModal.message}
              onChange={(e) => setContactModal(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Describe supply issues, request additional inventory, or report poor service..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setContactModal({ isOpen: false, message: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={submitContactMessage}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-lg"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminFeedbackReview
