import { useEffect, useState } from 'react'
import { HiEye, HiCheckCircle, HiClock, HiXCircle, HiXMark, HiPlus } from 'react-icons/hi2'
import { toast } from 'react-toastify'
import serviceProviderService, { ProviderRequest, QuotationRequest, ExtraCost } from '@/services/serviceProviderService'

const ProviderRequests = () => {
  const [requests, setRequests] = useState<ProviderRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ProviderRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'orders' | 'pending_delivery' | 'delivered' | 'closed'>('all')
  const [selectedRequest, setSelectedRequest] = useState<ProviderRequest | null>(null)
  const [fullRequestDetails, setFullRequestDetails] = useState<QuotationRequest | null>(null)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [sendingResponse, setSendingResponse] = useState(false)
  const [quotedAmount, setQuotedAmount] = useState<string>('')
  const [deliveryDate, setDeliveryDate] = useState<string>('')
  const [providerNotes, setProviderNotes] = useState<string>('')
  const [extraCosts, setExtraCosts] = useState<ExtraCost[]>([])
  const [itemPrices, setItemPrices] = useState<Record<string, number>>({})
  const [showDeliveryConfirmation, setShowDeliveryConfirmation] = useState(false)
  const [confirmingDelivery, setConfirmingDelivery] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [])

  useEffect(() => {
    filterRequests()
  }, [activeFilter, requests])

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await serviceProviderService.getRequests()
      setRequests(data.requests)
    } catch (err: any) {
      console.error('Error loading requests:', err)
      setError(err.message || 'Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleRequestSelect = async (request: ProviderRequest) => {
    try {
      setSelectedRequest(request)
      const details = await serviceProviderService.getQuotationDetails(request.id)
      setFullRequestDetails(details)
    } catch (error: any) {
      console.error('Error loading request details:', error)
      toast.error('Failed to load request details')
    }
  }

  const handleOpenResponseModal = () => {
    if (!fullRequestDetails) return
    setQuotedAmount(fullRequestDetails.quoted_amount?.toString() || '')
    setDeliveryDate(fullRequestDetails.quoted_delivery_date || '')
    setProviderNotes(fullRequestDetails.provider_notes || '')
    setExtraCosts(fullRequestDetails.extra_costs || [])

    // Initialize item prices
    const initialPrices: Record<string, number> = {}
    fullRequestDetails.items?.forEach(item => {
      initialPrices[item.id] = 0 // Default to 0 or existing price if available
    })
    setItemPrices(initialPrices)

    setShowResponseModal(true)
  }

  const handleAddExtraCost = () => {
    setExtraCosts([...extraCosts, { description: '', amount: 0, is_percentage: false }])
  }

  const handleRemoveExtraCost = (index: number) => {
    setExtraCosts(extraCosts.filter((_, i) => i !== index))
  }

  const handleExtraCostChange = (index: number, field: string, value: any) => {
    const updated = [...extraCosts]
    updated[index] = { ...updated[index], [field]: value }
    setExtraCosts(updated)
  }

  const calculateTotalAmount = () => {
    // Calculate base amount from items
    let baseAmount = 0
    if (fullRequestDetails?.items) {
      baseAmount = fullRequestDetails.items.reduce((sum, item) => {
        return sum + (item.quantity * (itemPrices[item.id] || 0))
      }, 0)
    } else {
      baseAmount = parseFloat(quotedAmount) || 0
    }

    const extraTotal = extraCosts.reduce((sum, cost) => {
      if (cost.is_percentage) {
        return sum + (baseAmount * cost.amount) / 100
      }
      return sum + cost.amount
    }, 0)
    return baseAmount + extraTotal
  }

  const handleItemPriceChange = (itemId: string, price: number) => {
    setItemPrices(prev => ({
      ...prev,
      [itemId]: price
    }))
  }

  const handleSendResponse = async () => {
    if (!fullRequestDetails) {
      toast.error('Request details not loaded')
      return
    }

    // Calculate total base amount
    let totalBaseAmount = 0
    if (fullRequestDetails.items) {
      totalBaseAmount = fullRequestDetails.items.reduce((sum, item) => {
        return sum + (item.quantity * (itemPrices[item.id] || 0))
      }, 0)
    } else {
      totalBaseAmount = parseFloat(quotedAmount)
    }

    if (totalBaseAmount <= 0) {
      toast.error('Total amount must be greater than 0')
      return
    }

    setSendingResponse(true)
    try {
      const itemsList = fullRequestDetails.items?.map(item => ({
        id: item.id,
        unit_price: itemPrices[item.id] || 0
      })) || []

      const response = await serviceProviderService.sendQuotationResponse(fullRequestDetails.id, {
        quotedAmount: totalBaseAmount,
        quotedDeliveryDate: deliveryDate,
        providerNotes,
        extraCosts,
        items: itemsList
      })

      toast.success('Quotation response sent successfully!')
      setShowResponseModal(false)
      loadRequests()
      setSelectedRequest(null)
      setFullRequestDetails(null)
    } catch (error: any) {
      console.error('Error sending response:', error)
      toast.error(error.response?.data?.message || 'Failed to send quotation response')
    } finally {
      setSendingResponse(false)
    }
  }

  const handleSignContract = async () => {
    if (!selectedRequest) return

    try {
      await serviceProviderService.signContract(selectedRequest.id)
      toast.success('Contract signed successfully! Order has been created.')
      loadRequests()
      setSelectedRequest(null)
      setFullRequestDetails(null)
    } catch (error: any) {
      console.error('Error signing contract:', error)
      toast.error(error.response?.data?.message || 'Failed to sign contract')
    }
  }

  const handleConfirmDelivery = async () => {
    if (!selectedRequest) return

    setConfirmingDelivery(true)
    try {
      const response = await fetch(`/api/quotations/requests/${selectedRequest.id}/confirm-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ role: 'provider' })
      })

      if (!response.ok) {
        throw new Error('Failed to confirm delivery')
      }

      toast.success('Service delivery confirmed! Waiting for client confirmation.')
      setShowDeliveryConfirmation(false)
      setSelectedRequest(null)
      setFullRequestDetails(null)
      
      // Reload requests after a delay to avoid rate limiting
      setTimeout(() => {
        loadRequests()
      }, 1000)
    } catch (error: any) {
      console.error('Error confirming delivery:', error)
      toast.error(error.message || 'Failed to confirm delivery')
    } finally {
      setConfirmingDelivery(false)
    }
  }

  const filterRequests = () => {
    switch (activeFilter) {
      case 'active':
        setFilteredRequests(requests.filter(r => ['pending', 'viewed'].includes(r.status)))
        break
      case 'orders':
        setFilteredRequests(requests.filter(r => ['accepted', 'client_signed', 'contract_signed'].includes(r.status)))
        break
      case 'pending_delivery':
        setFilteredRequests(requests.filter(r => ['contract_signed'].includes(r.status) && !r.provider_confirmed_delivery))
        break
      case 'delivered':
        setFilteredRequests(requests.filter(r => r.provider_confirmed_delivery && r.client_confirmed_delivery))
        break
      case 'closed':
        setFilteredRequests(requests.filter(r => ['rejected', 'completed'].includes(r.status)))
        break
      default:
        setFilteredRequests(requests)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <HiClock className="text-yellow-600" />
      case 'accepted':
        return <HiCheckCircle className="text-blue-600" />
      case 'completed':
        return <HiCheckCircle className="text-green-600" />
      case 'rejected':
        return <HiXCircle className="text-red-600" />
      case 'client_signed':
        return <HiCheckCircle className="text-blue-600" />
      case 'contract_signed':
        return <HiCheckCircle className="text-indigo-600" />
      default:
        return <HiEye className="text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'accepted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'client_signed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'contract_signed':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getFilterStats = () => {
    return {
      all: requests.length,
      active: requests.filter(r => ['pending', 'viewed'].includes(r.status)).length,
      orders: requests.filter(r => ['accepted', 'client_signed', 'contract_signed'].includes(r.status)).length,
      pending_delivery: requests.filter(r => ['contract_signed'].includes(r.status) && !r.provider_confirmed_delivery).length,
      delivered: requests.filter(r => r.provider_confirmed_delivery && r.client_confirmed_delivery).length,
      closed: requests.filter(r => ['rejected', 'completed'].includes(r.status)).length
    }
  }

  const stats = getFilterStats()

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Client Requests</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all client requests
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={loadRequests}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto pb-0">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-3 font-medium border-b-2 whitespace-nowrap transition ${
            activeFilter === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          All <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{stats.all}</span>
        </button>
        <button
          onClick={() => setActiveFilter('active')}
          className={`px-4 py-3 font-medium border-b-2 whitespace-nowrap transition ${
            activeFilter === 'active'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Pending <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">{stats.active}</span>
        </button>
        <button
          onClick={() => setActiveFilter('orders')}
          className={`px-4 py-3 font-medium border-b-2 whitespace-nowrap transition ${
            activeFilter === 'orders'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Active Orders <span className="ml-1 text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300 px-2 py-1 rounded-full">{stats.orders}</span>
        </button>
        <button
          onClick={() => setActiveFilter('pending_delivery')}
          className={`px-4 py-3 font-medium border-b-2 whitespace-nowrap transition ${
            activeFilter === 'pending_delivery'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Awaiting Delivery <span className="ml-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 px-2 py-1 rounded-full">{stats.pending_delivery}</span>
        </button>
        <button
          onClick={() => setActiveFilter('delivered')}
          className={`px-4 py-3 font-medium border-b-2 whitespace-nowrap transition ${
            activeFilter === 'delivered'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Delivered <span className="ml-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">{stats.delivered}</span>
        </button>
        <button
          onClick={() => setActiveFilter('closed')}
          className={`px-4 py-3 font-medium border-b-2 whitespace-nowrap transition ${
            activeFilter === 'closed'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Closed <span className="ml-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 px-2 py-1 rounded-full">{stats.closed}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-2">
          {filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <HiEye className="mx-auto w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No requests found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                There are no {activeFilter !== 'all' ? activeFilter : ''} requests at the moment
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => handleRequestSelect(request)}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {request.clientName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {request.serviceType}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-sm ${getStatusColor(request.status)}`}
                    >
                      {getStatusIcon(request.status)}
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Quantity</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{request.quantity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Total Value</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        SAR {request.totalValue?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Submitted</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>
                  </div>

                  {request.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 italic">
                      "{request.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Panel */}
        <div>
          {selectedRequest ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Request Details
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Client Name
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedRequest.clientName}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Service Type
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">{selectedRequest.serviceType}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                      Quantity
                    </p>
                    <p className="text-gray-900 dark:text-white font-medium">{selectedRequest.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                      Total Value
                    </p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      SAR {selectedRequest.totalValue?.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Status
                  </p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full font-semibold text-sm ${getStatusColor(selectedRequest.status)}`}
                  >
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                    Submitted On
                  </p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {new Date(selectedRequest.createdAt).toLocaleDateString()} at{' '}
                    {new Date(selectedRequest.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {selectedRequest.notes && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
                      Notes
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 text-sm">{selectedRequest.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {(selectedRequest.status === 'pending' || selectedRequest.status === 'viewed') && !selectedRequest.quotedAmount && (
                    <button
                      onClick={handleOpenResponseModal}
                      className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition font-medium"
                    >
                      Send Quotation
                    </button>
                  )}
                  {selectedRequest.status === 'client_signed' && (
                    <button
                      onClick={handleSignContract}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
                    >
                      <HiCheckCircle className="w-5 h-5" />
                      Sign Contract & Create Order
                    </button>
                  )}
                  {selectedRequest.status === 'contract_signed' && (
                    <>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mb-3">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center justify-center gap-2">
                          <HiCheckCircle className="w-5 h-5" />
                          Contract Active
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Order has been created
                        </p>
                      </div>
                      {!selectedRequest.provider_confirmed_delivery && (
                        <button
                          onClick={() => setShowDeliveryConfirmation(true)}
                          className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium"
                        >
                          Confirm Service Delivery
                        </button>
                      )}
                      {selectedRequest.provider_confirmed_delivery && !selectedRequest.client_confirmed_delivery && (
                        <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                            Awaiting Client Confirmation
                          </p>
                        </div>
                      )}
                      {selectedRequest.provider_confirmed_delivery && selectedRequest.client_confirmed_delivery && (
                        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center justify-center gap-2">
                            <HiCheckCircle className="w-5 h-5" />
                            Service Delivered
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Both parties confirmed delivery
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  {selectedRequest.quotedAmount && selectedRequest.status !== 'client_signed' && selectedRequest.status !== 'contract_signed' && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quotation Sent</p>
                      <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        SAR {selectedRequest.quotedAmount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Select a request to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Service Delivery Confirmation Modal */}
      {showDeliveryConfirmation && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Confirm Service Delivery
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  By confirming, you indicate that you have completed the service delivery for this order. The client will then need to confirm receipt.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Service Details:</p>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm space-y-1">
                  <p><span className="text-gray-600 dark:text-gray-400">Client:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.clientName}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-400">Type:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.serviceType}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-400">Amount:</span> <span className="font-medium text-gray-900 dark:text-white">SAR {selectedRequest.quotedAmount?.toLocaleString()}</span></p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setShowDeliveryConfirmation(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelivery}
                disabled={confirmingDelivery}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
              >
                <HiCheckCircle className="w-5 h-5" />
                {confirmingDelivery ? 'Confirming...' : 'Confirm Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Response Modal */}
      {showResponseModal && fullRequestDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Send Quotation Response
              </h2>
              <button
                onClick={() => setShowResponseModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <HiXMark className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Request Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Requested Items
                </h3>
                <div className="space-y-2 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                  {fullRequestDetails.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.item_name}
                        </p>
                        {item.item_type && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.item_type}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Itemized Pricing */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Item Pricing
                </h3>
                <div className="space-y-3">
                  {fullRequestDetails.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{item.item_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity} {item.unit}</p>
                      </div>
                      <div className="w-40">
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Unit Price (SAR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={itemPrices[item.id] || ''}
                          onChange={(e) => handleItemPriceChange(item.id, parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="w-32 text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          SAR {((item.quantity * (itemPrices[item.id] || 0))).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Base Quoted Amount (Calculated) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Total Base Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">
                    SAR
                  </span>
                  <input
                    type="text"
                    value={fullRequestDetails.items ? fullRequestDetails.items.reduce((sum, item) => sum + (item.quantity * (itemPrices[item.id] || 0)), 0).toFixed(2) : quotedAmount}
                    readOnly
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-bold cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Delivery Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estimated Delivery Date *
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Provider Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Provider Notes (Optional)
                </label>
                <textarea
                  value={providerNotes}
                  onChange={(e) => setProviderNotes(e.target.value)}
                  placeholder="Add any notes or special conditions..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Extra Costs */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Extra Costs (Optional)
                  </h3>
                  <button
                    onClick={handleAddExtraCost}
                    className="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    <HiPlus className="w-4 h-4" />
                    Add Cost
                  </button>
                </div>

                {extraCosts.length > 0 && (
                  <div className="space-y-3">
                    {extraCosts.map((cost, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={cost.description}
                            onChange={(e) => handleExtraCostChange(idx, 'description', e.target.value)}
                            placeholder="E.g., Delivery charge, Rush fee, Handling fee"
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <button
                            onClick={() => handleRemoveExtraCost(idx)}
                            className="ml-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <HiXMark className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Amount
                            </label>
                            <div className="flex items-center">
                              <span className="text-gray-500 dark:text-gray-400 mr-2">
                                SAR
                              </span>
                              <input
                                type="number"
                                value={cost.amount}
                                onChange={(e) => handleExtraCostChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                                min="0"
                                step={cost.is_percentage ? '1' : '0.01'}
                                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Type
                            </label>
                            <select
                              value={cost.is_percentage ? 'percentage' : 'fixed'}
                              onChange={(e) => handleExtraCostChange(idx, 'is_percentage', e.target.value === 'percentage')}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="fixed">Fixed Amount</option>
                              <option value="percentage">Percentage (%)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Summary */}
              <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Base Amount:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      SAR {
                        (fullRequestDetails.items
                          ? fullRequestDetails.items.reduce((sum, item) => sum + (item.quantity * (itemPrices[item.id] || 0)), 0)
                          : parseFloat(quotedAmount || '0')
                        ).toFixed(2)
                      }
                    </span>
                  </div>
                  {extraCosts.length > 0 && (
                    <>
                      {extraCosts.map((cost, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-300">
                            {cost.description || 'Extra Cost'}:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            SAR {(cost.is_percentage ? (
                              (fullRequestDetails.items
                                ? fullRequestDetails.items.reduce((sum, item) => sum + (item.quantity * (itemPrices[item.id] || 0)), 0)
                                : parseFloat(quotedAmount || '0'))
                              * cost.amount) / 100 : cost.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                  <div className="border-t border-primary-200 dark:border-primary-700 pt-2 flex justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      SAR {calculateTotalAmount().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
              <button
                onClick={() => setShowResponseModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendResponse}
                disabled={sendingResponse}
                className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg transition font-medium"
              >
                {sendingResponse ? 'Sending...' : 'Send Quotation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProviderRequests