import { useState } from 'react'
import { HiCheckCircle, HiXCircle, HiEyeIcon, HiArrowUp, HiArrowDown, HiPaperAirplane } from 'react-icons/hi2'
import feedbackService, { SupplyFeedback } from '@/services/feedbackService'
import { toast } from 'react-toastify'

interface RecentPrediction {
  id: string;
  supply_type: string;
  predicted_qty: number;
  created_at: string;
}

interface FeedbackSummary {
  total_feedback: number;
  accuracy_rate: number;
  underestimated_count: number;
  overestimated_count: number;
  most_accurate_items: string[];
  needs_improvement_items: string[];
}

interface SupplyFeedbackHubProps {
  recentPredictions?: RecentPrediction[];
  feedbackSummary?: FeedbackSummary;
}

const SupplyFeedbackHub = ({ recentPredictions = [], feedbackSummary }: SupplyFeedbackHubProps) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [formData, setFormData] = useState<SupplyFeedback>({
    supply_type: '',
    predicted_quantity: 0,
    actual_quantity: 0,
    feedback_type: 'accurate',
    notes: '',
    days_until_reorder: undefined
  })
  const [submitting, setSubmitting] = useState(false)
  const [selectedPrediction, setSelectedPrediction] = useState<RecentPrediction | null>(null)

  const handleSelectPrediction = (prediction: RecentPrediction) => {
    setSelectedPrediction(prediction)
    setFormData(prev => ({
      ...prev,
      supply_type: prediction.supply_type,
      predicted_quantity: prediction.predicted_qty,
    }))
    setShowFeedbackForm(true)
  }

  const handleFeedbackTypeChange = (actual: number) => {
    const predicted = formData.predicted_quantity
    let type: 'accurate' | 'underestimated' | 'overestimated' = 'accurate'
    
    const variance = Math.abs(actual - predicted) / predicted
    if (variance > 0.2) {
      type = actual > predicted ? 'underestimated' : 'overestimated'
    }
    
    setFormData(prev => ({
      ...prev,
      actual_quantity: actual,
      feedback_type: type
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.supply_type || !formData.actual_quantity) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSubmitting(true)
      await feedbackService.submitFeedback(formData)
      toast.success('✅ Feedback saved! This helps improve model accuracy.')
      setFormData({
        supply_type: '',
        predicted_quantity: 0,
        actual_quantity: 0,
        feedback_type: 'accurate',
        notes: '',
        days_until_reorder: undefined
      })
      setShowFeedbackForm(false)
      setSelectedPrediction(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setShowFeedbackForm(false)
    setSelectedPrediction(null)
    setFormData({
      supply_type: '',
      predicted_quantity: 0,
      actual_quantity: 0,
      feedback_type: 'accurate',
      notes: '',
      days_until_reorder: undefined
    })
  }

  return (
    <div className="space-y-6">
      {/* Quick Feedback Section */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              📊 Supply Feedback Hub
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Help us improve predictions by sharing actual supply usage
            </p>
          </div>
          {!showFeedbackForm && (
            <button 
              onClick={() => setShowFeedbackForm(true)}
              className="btn btn-primary text-sm"
            >
              <HiPaperAirplane className="w-4 h-4 mr-2" />
              Add Feedback
            </button>
          )}
        </div>

        {!showFeedbackForm ? (
          <div className="space-y-4">
            {/* Feedback Summary Stats */}
            {feedbackSummary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Accuracy Rate</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {Math.round(feedbackSummary.accuracy_rate)}%
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {feedbackSummary.total_feedback} feedback entries
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Under-predicted</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {feedbackSummary.underestimated_count}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">times we ordered less</p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">Over-predicted</p>
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                    {feedbackSummary.overestimated_count}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">times we ordered more</p>
                </div>
              </div>
            )}

            {/* Recent Predictions for Quick Feedback */}
            {recentPredictions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Recent Predictions - Provide Feedback
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentPredictions.map((prediction) => (
                    <button
                      key={prediction.id}
                      onClick={() => handleSelectPrediction(prediction)}
                      className="text-left p-3 bg-gray-50 dark:bg-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {prediction.supply_type}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Predicted: {prediction.predicted_qty} units
                      </p>
                      <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 font-medium">
                        Click to provide feedback →
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {recentPredictions.length === 0 && !feedbackSummary && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No recent predictions yet</p>
                <p className="text-sm mt-1">Generate a prediction to get started with feedback!</p>
              </div>
            )}
          </div>
        ) : (
          /* Feedback Form */
          <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {selectedPrediction ? `Feedback for ${selectedPrediction.supply_type}` : 'New Supply Feedback'}
            </h3>

            <div className="space-y-4">
              {/* Supply Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Supply Type *
                </label>
                <input
                  type="text"
                  value={formData.supply_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, supply_type: e.target.value }))}
                  placeholder="e.g., Toilet Paper, Hand Soap"
                  className="input input-bordered w-full"
                />
              </div>

              {/* Predicted vs Actual */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Predicted Qty *
                  </label>
                  <input
                    type="number"
                    value={formData.predicted_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, predicted_quantity: parseFloat(e.target.value) }))}
                    disabled={!!selectedPrediction}
                    className="input input-bordered w-full bg-gray-100 dark:bg-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actual Qty Received *
                  </label>
                  <input
                    type="number"
                    value={formData.actual_quantity || ''}
                    onChange={(e) => handleFeedbackTypeChange(parseFloat(e.target.value))}
                    placeholder="Enter actual quantity"
                    className="input input-bordered w-full"
                    autoFocus
                  />
                </div>
              </div>

              {/* Auto-detected Feedback Type */}
              {formData.actual_quantity > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2">Feedback Type</p>
                  <div className="flex items-center gap-2">
                    {formData.feedback_type === 'accurate' && (
                      <>
                        <HiCheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                          ✓ Accurate prediction (±20%)
                        </span>
                      </>
                    )}
                    {formData.feedback_type === 'underestimated' && (
                      <>
                        <HiArrowUp className="w-5 h-5 text-yellow-500" />
                        <span className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                          We under-estimated (ordered less than needed)
                        </span>
                      </>
                    )}
                    {formData.feedback_type === 'overestimated' && (
                      <>
                        <HiArrowDown className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                          We over-estimated (ordered more than needed)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Days Until Reorder */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Days Until This Runs Out? (Optional)
                </label>
                <input
                  type="number"
                  value={formData.days_until_reorder || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, days_until_reorder: e.target.value ? parseInt(e.target.value) : undefined }))}
                  placeholder="e.g., 7, 14, 30"
                  className="input input-bordered w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This helps predict usage rate</p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Any Notes? (Optional)
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g., Had more visitors this month, changed cleaning frequency, etc."
                  className="textarea textarea-bordered w-full h-20"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary flex-1"
                >
                  {submitting ? 'Saving...' : '✓ Save Feedback'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* AI Insights Enhancement */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          💡 How Feedback Improves Your Predictions
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
            Each feedback entry trains the model on your specific patterns
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
            The system learns when it over/under-estimates for your organization
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
            More feedback = More accurate predictions = Better cost savings
          </li>
        </ul>
      </div>
    </div>
  )
}

export default SupplyFeedbackHub