import { useEffect, useState } from 'react'
import { HiEnvelope, HiPhone, HiDocumentText, HiChatBubbleLeftRight, HiCheckCircle, HiClock } from 'react-icons/hi2'
import serviceProviderService, { CommunicationLog } from '@/services/serviceProviderService'

const ProviderCommunication = () => {
  const [logs, setLogs] = useState<CommunicationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<CommunicationLog | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    loadCommunicationLog()
  }, [])

  const loadCommunicationLog = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await serviceProviderService.getCommunicationLog()
      setLogs(data)
      if (data.length > 0) {
        setSelectedLog(data[0])
      }
    } catch (err: any) {
      console.error('Error loading communication log:', err)
      setError(err.message || 'Failed to load communication log')
    } finally {
      setLoading(false)
    }
  }

  const getCommTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return HiEnvelope
      case 'phone':
        return HiPhone
      case 'meeting':
        return HiDocumentText
      case 'note':
        return HiChatBubbleLeftRight
      default:
        return HiChatBubbleLeftRight
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return HiCheckCircle
      case 'pending':
        return HiClock
      default:
        return HiChatBubbleLeftRight
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'waiting_response':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredLogs = typeFilter === 'all' ? logs : logs.filter((log) => log.communicationType === typeFilter)

  const communicationTypes = [
    { label: 'All', value: 'all' },
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'Meeting', value: 'meeting' },
    { label: 'Notes', value: 'note' }
  ]

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Communication History</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            All communications with our team
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadCommunicationLog}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
        {communicationTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setTypeFilter(type.value)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              typeFilter === type.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {type.label} ({type.value === 'all' ? logs.length : logs.filter((log) => log.communicationType === type.value).length})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Communication List */}
        <div className="lg:col-span-2">
          {filteredLogs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <HiChatBubbleLeftRight className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No communication found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no {typeFilter !== 'all' ? typeFilter : ''} communications at the moment
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const Icon = getCommTypeIcon(log.communicationType)
                const StatusIcon = getStatusIcon(log.status)

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 cursor-pointer transition ${
                      selectedLog?.id === log.id
                        ? 'border-primary-600 dark:border-primary-500 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                              {log.communicationType}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {log.subject}
                            </p>
                          </div>
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold whitespace-nowrap flex-shrink-0 ${getStatusColor(log.status)}`}>
                            {log.status.replace('_', ' ').charAt(0).toUpperCase() + log.status.replace('_', ' ').slice(1)}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {formatDateShort(log.communicationDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Details Panel */}
        <div>
          {selectedLog ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Communication Details
              </h3>

              <div className="space-y-4">
                {/* Type */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Type
                  </p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getCommTypeIcon(selectedLog.communicationType)
                      return (
                        <>
                          <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <p className="text-gray-900 dark:text-white font-medium capitalize">
                            {selectedLog.communicationType}
                          </p>
                        </>
                      )
                    })()}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Subject
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedLog.subject}</p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Status
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${getStatusColor(selectedLog.status)}`}>
                    {selectedLog.status.replace('_', ' ').charAt(0).toUpperCase() + selectedLog.status.replace('_', ' ').slice(1)}
                  </span>
                </div>

                {/* Date */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Date
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatDate(selectedLog.communicationDate)}
                  </p>
                </div>

                {/* Message */}
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Message
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-3 mt-1">
                    <p className="text-gray-700 dark:text-gray-300 text-sm">
                      {selectedLog.message || 'No message content'}
                    </p>
                  </div>
                </div>

                {/* Next Follow-up */}
                {selectedLog.nextFollowUpDate && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-3 mt-4">
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold mb-1">
                      Next Follow-up Scheduled
                    </p>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      {new Date(selectedLog.nextFollowUpDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Reply Button */}
              <button className="w-full mt-6 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition font-medium">
                Reply to this Communication
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Select a communication to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProviderCommunication