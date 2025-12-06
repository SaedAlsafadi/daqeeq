import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useAuth } from '@/contexts/AuthContext'
import {
  HiCheckCircle,
  HiExclamationTriangle,
  HiArrowTrendingUp,
  HiArrowTrendingDown,
  HiChevronDown,
  HiChevronUp,
  HiSparkles,
  HiCubeTransparent,
  HiStar,
  HiTruck,
  HiCurrencyDollar,
  HiArrowPath
} from 'react-icons/hi2'
import feedbackService from '@/services/feedbackService'

interface QuotationRequest {
  request_id: string
  request_number: string
  prediction_id: string
  supplier: {
    id: string
    name: string
    email: string
    phone: string
  }
  status: string
  created_at: string
  items: Array<{
    id: string
    name: string
    quantity: number
    unit: string
  }>
  predictions: Record<string, number>
}

interface ItemFeedback {
  item_name: string
  predicted_quantity: number
  actual_quantity: number | null
  days_until_reorder: number | null
  notes: string | null
  feedback_type: 'accurate' | 'underestimated' | 'overestimated' | null
  variance: number | null
  submitted_at: string | null
}

interface WorkerFeedback {
  predicted_workers: number
  actual_workers_needed: number | null
  workers_satisfaction_rating: number | null
  workers_feedback_notes: string | null
  workload_comments: string | null
  submitted_at: string | null
}

interface ProviderRating {
  quality_rating: number | null
  delivery_rating: number | null
  price_rating: number | null
  provider_notes: string | null
}

interface RequestFeedback {
  request_id: string
  items: Map<string, ItemFeedback>
  workers: WorkerFeedback
  provider_rating: ProviderRating
  submitted_items: number
}

interface FeedbackSummary {
  total_feedback: number
  accuracy_rate: number
  underestimated_count: number
  overestimated_count: number
  most_accurate_items: string[]
  needs_improvement_items: string[]
}

const SupplyFeedback = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [quotationRequests, setQuotationRequests] = useState<QuotationRequest[]>([])
  const [feedbackData, setFeedbackData] = useState<Map<string, RequestFeedback>>(new Map())
  const [summary, setSummary] = useState<FeedbackSummary | null>(null)
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'feedback' | 'analytics'>('feedback')

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadData(false)
      toast.success('Data refreshed successfully')
    } finally {
      setRefreshing(false)
    }
  }

  const loadData = async (initial = true) => {
    try {
      if (initial) setLoading(true)
      
      // Load quotation requests and summary in parallel
      const [requestsRes, summaryRes] = await Promise.all([
        feedbackService.getPredictionHistory({ limit: 20 }).catch(() => ({ requests: [] })),
        feedbackService.getSummary().catch(() => ({
          total_feedback: 0,
          accuracy_rate: 0,
          underestimated_count: 0,
          overestimated_count: 0,
          most_accurate_items: [],
          needs_improvement_items: []
        }))
      ])

      setQuotationRequests(requestsRes.requests || [])
      setSummary(summaryRes)

      // Initialize feedback data map for each request
      const feedbackMap = new Map<string, RequestFeedback>()
      ;(requestsRes.requests || []).forEach((req: QuotationRequest) => {
        const itemsMap = new Map<string, ItemFeedback>()
        req.items.forEach(item => {
          itemsMap.set(item.id, {
            item_name: item.name,
            predicted_quantity: item.quantity,
            actual_quantity: null,
            days_until_reorder: null,
            notes: null,
            feedback_type: null,
            variance: null,
            submitted_at: null
          })
        })

        feedbackMap.set(req.request_id, {
          request_id: req.request_id,
          items: itemsMap,
          workers: {
            predicted_workers: 0,
            actual_workers_needed: null,
            workers_satisfaction_rating: null,
            workers_feedback_notes: null,
            workload_comments: null,
            submitted_at: null
          },
          provider_rating: {
            quality_rating: null,
            delivery_rating: null,
            price_rating: null,
            provider_notes: null
          },
          submitted_items: 0
        })
      })
      setFeedbackData(feedbackMap)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load quotation requests')
    } finally {
      if (initial) setLoading(false)
    }
  }

  const calculateVariance = (predicted: number, actual: number): { variance: number; type: 'accurate' | 'underestimated' | 'overestimated' } => {
    if (predicted === 0) return { variance: 0, type: 'accurate' }
    const variance = ((actual - predicted) / predicted) * 100
    
    if (Math.abs(variance) <= 20) {
      return { variance, type: 'accurate' }
    } else if (variance > 0) {
      return { variance, type: 'underestimated' }
    } else {
      return { variance, type: 'overestimated' }
    }
  }

  const handleItemQuantityChange = (requestId: string, itemId: string, quantity: string) => {
    const request = feedbackData.get(requestId)
    if (!request) return

    const item = request.items.get(itemId)
    if (!item) return

    const actualQty = parseFloat(quantity) || null
    const updated = { ...item, actual_quantity: actualQty }

    if (actualQty !== null) {
      const { variance, type } = calculateVariance(item.predicted_quantity, actualQty)
      updated.variance = variance
      updated.feedback_type = type
    } else {
      updated.variance = null
      updated.feedback_type = null
    }

    request.items.set(itemId, updated)
    setFeedbackData(new Map(feedbackData))
  }

  const handleItemNotesChange = (requestId: string, itemId: string, notes: string) => {
    const request = feedbackData.get(requestId)
    if (request) {
      const item = request.items.get(itemId)
      if (item) {
        item.notes = notes || null
        setFeedbackData(new Map(feedbackData))
      }
    }
  }

  const handleItemDaysChange = (requestId: string, itemId: string, days: string) => {
    const request = feedbackData.get(requestId)
    if (request) {
      const item = request.items.get(itemId)
      if (item) {
        item.days_until_reorder = days ? parseInt(days) : null
        setFeedbackData(new Map(feedbackData))
      }
    }
  }

  const handleWorkerQuantityChange = (requestId: string, quantity: string) => {
    const request = feedbackData.get(requestId)
    if (request) {
      request.workers.actual_workers_needed = quantity ? parseInt(quantity) : null
      setFeedbackData(new Map(feedbackData))
    }
  }

  const handleWorkerSatisfactionChange = (requestId: string, rating: number) => {
    const request = feedbackData.get(requestId)
    if (request) {
      request.workers.workers_satisfaction_rating = rating
      setFeedbackData(new Map(feedbackData))
    }
  }

  const handleWorkerNotesChange = (requestId: string, notes: string) => {
    const request = feedbackData.get(requestId)
    if (request) {
      request.workers.workers_feedback_notes = notes || null
      setFeedbackData(new Map(feedbackData))
    }
  }

  const handleProviderRatingChange = (requestId: string, field: string, rating: number) => {
    const request = feedbackData.get(requestId)
    if (request) {
      request.provider_rating[field as keyof ProviderRating] = rating
      setFeedbackData(new Map(feedbackData))
    }
  }

  const handleProviderNotesChange = (requestId: string, notes: string) => {
    const request = feedbackData.get(requestId)
    if (request) {
      request.provider_rating.provider_notes = notes || null
      setFeedbackData(new Map(feedbackData))
    }
  }

  const isRequestFullySubmitted = (requestId: string): boolean => {
    const request = feedbackData.get(requestId)
    if (!request) return false
    
    // Check if all item feedbacks have been submitted
    const allItemsSubmitted = Array.from(request.items.values()).every(item => item.submitted_at !== null)
    return allItemsSubmitted
  }

  const handleSubmitRequestFeedback = async (requestId: string) => {
    const request = feedbackData.get(requestId)
    if (!request) return

    // Check if already submitted
    if (isRequestFullySubmitted(requestId)) {
      toast.info('Feedback for this request has already been submitted')
      return
    }

    // Check if at least one item has actual quantity
    const hasItemFeedback = Array.from(request.items.values()).some(item => item.actual_quantity !== null)
    const hasWorkerFeedback = request.workers.actual_workers_needed !== null
    const hasProviderRating = [request.provider_rating.quality_rating, request.provider_rating.delivery_rating, request.provider_rating.price_rating].some(r => r !== null)

    if (!hasItemFeedback && !hasWorkerFeedback && !hasProviderRating) {
      toast.error('Please provide at least some feedback')
      return
    }

    try {
      setSubmitting(true)

      // Submit item feedback
      const quotation = quotationRequests.find(q => q.request_id === requestId)
      if (quotation && hasItemFeedback) {
        for (const [itemId, itemFeedback] of request.items.entries()) {
          if (itemFeedback.actual_quantity !== null) {
            await feedbackService.submitFeedback({
              prediction_id: quotation.prediction_id,
              supply_type: itemFeedback.item_name,
              predicted_quantity: itemFeedback.predicted_quantity,
              actual_quantity: itemFeedback.actual_quantity,
              feedback_type: itemFeedback.feedback_type || 'accurate',
              notes: itemFeedback.notes,
              days_until_reorder: itemFeedback.days_until_reorder
            })
            itemFeedback.submitted_at = new Date().toISOString()
          }
        }
      }

      // Submit provider rating if provided
      if (hasProviderRating && quotation) {
        await feedbackService.submitProviderRating({
          quotation_request_id: requestId,
          provider_id: quotation.supplier.id,
          quality_rating: request.provider_rating.quality_rating || 0,
          delivery_rating: request.provider_rating.delivery_rating || 0,
          price_rating: request.provider_rating.price_rating || 0,
          notes: request.provider_rating.provider_notes
        })
      }

      setFeedbackData(new Map(feedbackData))
      toast.success('Feedback submitted successfully! Form is now locked.')

      // Reload summary
      const summaryRes = await feedbackService.getSummary()
      setSummary(summaryRes)
    } catch (error: any) {
      console.error('Error submitting feedback:', error)
      toast.error(error.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const getVarianceColor = (variance: number | null): string => {
    if (variance === null) return 'text-gray-500'
    if (Math.abs(variance) <= 20) return 'text-green-600 dark:text-green-400'
    if (variance > 0) return 'text-blue-600 dark:text-blue-400'
    return 'text-orange-600 dark:text-orange-400'
  }

  const getVarianceLabel = (type: string | null): string => {
    switch (type) {
      case 'accurate':
        return '✅ Accurate'
      case 'underestimated':
        return '⬆️ Underestimated'
      case 'overestimated':
        return '⬇️ Overestimated'
      default:
        return 'Pending'
    }
  }

  const StarRating = ({ rating, onRate }: { rating: number | null; onRate: (r: number) => void }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          onClick={() => onRate(star)}
          className={`text-xl transition ${
            rating && rating >= star
              ? 'text-yellow-400'
              : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )

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
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HiCubeTransparent className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Supply Feedback Hub</h1>
              <p className="text-primary-100">Review completed orders and provide feedback to help us improve</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold">{quotationRequests.length}</p>
              <p className="text-primary-100">Quotation Requests</p>
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
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'feedback'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Completed Orders ({quotationRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'analytics'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Analytics & Insights
        </button>
      </div>

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {quotationRequests.length === 0 ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
              <HiSparkles className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
                No Completed Orders Yet
              </h3>
              <p className="text-blue-700 dark:text-blue-400 mb-4">
                Create predictions and send quotation requests to start collecting feedback
              </p>
              <a
                href="/dashboard/prediction"
                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
              >
                Create Prediction
              </a>
            </div>
          ) : (
            <>
              {/* Quotation Request Blocks */}
              <div className="space-y-4">
                {quotationRequests.map((request) => {
                  const feedback = feedbackData.get(request.request_id)
                  const isExpanded = expandedRequest === request.request_id

                  return (
                    <div
                      key={request.request_id}
                      className="card border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                      {/* Request Header */}
                      <div
                        onClick={() => setExpandedRequest(isExpanded ? null : request.request_id)}
                        className="p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-750 transition flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {request.request_number}
                            </h3>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {request.items.length} items
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <HiTruck className="w-4 h-4" />
                              <span>{request.supplier.name}</span>
                            </div>
                            <span>{new Date(request.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          {isExpanded ? (
                            <HiChevronUp className="w-5 h-5 text-gray-600" />
                          ) : (
                            <HiChevronDown className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && feedback && (
                        <div className="p-6 space-y-6 border-t border-gray-200 dark:border-gray-700">
                          {/* Supply Items Feedback */}
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                              Supply Items Feedback
                            </h4>
                            <div className="space-y-4">
                              {request.items.map((item) => {
                                const itemFeedback = feedback.items.get(item.id)
                                if (!itemFeedback) return null

                                return (
                                  <div
                                    key={item.id}
                                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                          {itemFeedback.item_name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          Predicted: {itemFeedback.predicted_quantity} {item.unit}
                                        </p>
                                      </div>
                                      {itemFeedback.submitted_at && (
                                        <span className="text-green-600 dark:text-green-400">
                                          <HiCheckCircle className="w-5 h-5" />
                                        </span>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          How much did you use? ({item.unit})
                                        </label>
                                        <input
                                          type="number"
                                          value={itemFeedback.actual_quantity || ''}
                                          onChange={(e) =>
                                            handleItemQuantityChange(request.request_id, item.id, e.target.value)
                                          }
                                          disabled={!!itemFeedback.submitted_at}
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 dark:bg-gray-700 dark:text-white"
                                          placeholder="Enter quantity"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                          Days until reorder needed
                                        </label>
                                        <input
                                          type="number"
                                          value={itemFeedback.days_until_reorder || ''}
                                          onChange={(e) =>
                                            handleItemDaysChange(request.request_id, item.id, e.target.value)
                                          }
                                          disabled={!!itemFeedback.submitted_at}
                                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 dark:bg-gray-700 dark:text-white"
                                          placeholder="Days"
                                        />
                                      </div>
                                    </div>

                                    {itemFeedback.actual_quantity !== null && (
                                      <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                                        <p className={`text-sm font-medium ${getVarianceColor(itemFeedback.variance)}`}>
                                          {getVarianceLabel(itemFeedback.feedback_type)}
                                          {itemFeedback.variance !== null && ` (${itemFeedback.variance > 0 ? '+' : ''}${itemFeedback.variance.toFixed(1)}%)`}
                                        </p>
                                      </div>
                                    )}

                                    <textarea
                                      value={itemFeedback.notes || ''}
                                      onChange={(e) =>
                                        handleItemNotesChange(request.request_id, item.id, e.target.value)
                                      }
                                      disabled={!!itemFeedback.submitted_at}
                                      placeholder="Additional notes about this item..."
                                      rows={2}
                                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 dark:bg-gray-700 dark:text-white"
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Workers Feedback */}
                          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                              👷 Workers Feedback
                            </h4>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  How many workers did you actually need?
                                </label>
                                <input
                                  type="number"
                                  value={feedback.workers.actual_workers_needed || ''}
                                  onChange={(e) =>
                                    handleWorkerQuantityChange(request.request_id, e.target.value)
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                  placeholder="Number of workers"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  How satisfied are the workers with the supplies provided?
                                </label>
                                <StarRating
                                  rating={feedback.workers.workers_satisfaction_rating}
                                  onRate={(r) => handleWorkerSatisfactionChange(request.request_id, r)}
                                />
                              </div>

                              <textarea
                                value={feedback.workers.workers_feedback_notes || ''}
                                onChange={(e) => handleWorkerNotesChange(request.request_id, e.target.value)}
                                placeholder="Worker feedback and comments..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          </div>

                          {/* Provider Rating */}
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                              <HiStar className="w-5 h-5" />
                              Rate Your Experience with {request.supplier.name}
                            </h4>
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Quality of Products
                                </label>
                                <StarRating
                                  rating={feedback.provider_rating.quality_rating}
                                  onRate={(r) => handleProviderRatingChange(request.request_id, 'quality_rating', r)}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Delivery Time
                                </label>
                                <StarRating
                                  rating={feedback.provider_rating.delivery_rating}
                                  onRate={(r) => handleProviderRatingChange(request.request_id, 'delivery_rating', r)}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Price Value
                                </label>
                                <StarRating
                                  rating={feedback.provider_rating.price_rating}
                                  onRate={(r) => handleProviderRatingChange(request.request_id, 'price_rating', r)}
                                />
                              </div>

                              <textarea
                                value={feedback.provider_rating.provider_notes || ''}
                                onChange={(e) => handleProviderNotesChange(request.request_id, e.target.value)}
                                placeholder="Share your overall experience with this provider..."
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          </div>

                          {/* Submit Button */}
                          {isRequestFullySubmitted(request.request_id) ? (
                            <div className="w-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 text-green-800 dark:text-green-300 font-medium py-2 rounded-lg text-center">
                              ✅ Feedback Submitted - Form is Locked
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSubmitRequestFeedback(request.request_id)}
                              disabled={submitting}
                              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition"
                            >
                              {submitting ? 'Submitting...' : 'Submit All Feedback for This Request'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total_feedback}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy Rate</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.accuracy_rate.toFixed(1)}%</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Underestimated</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.underestimated_count}</p>
            </div>
            <div className="card p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Overestimated</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.overestimated_count}</p>
            </div>
          </div>

          {summary.most_accurate_items.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Most Accurate Predictions</h3>
              <div className="flex flex-wrap gap-2">
                {summary.most_accurate_items.map((item) => (
                  <span key={item} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                    ✅ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {summary.needs_improvement_items.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Needs Improvement</h3>
              <div className="flex flex-wrap gap-2">
                {summary.needs_improvement_items.map((item) => (
                  <span key={item} className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-sm">
                    📈 {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SupplyFeedback