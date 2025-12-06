import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import quotationService, { QuotationRequest } from '@/services/quotationService';
import {
  HiDocumentText,
  HiXMark,
  HiClock,
  HiCheckCircle,
  HiXCircle,
  HiEye
} from 'react-icons/hi2';

const Requests = () => {
  const [requests, setRequests] = useState<QuotationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<QuotationRequest | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'orders' | 'closed'>('all');
  const [showDeliveryConfirmation, setShowDeliveryConfirmation] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quotationService.getQuotationRequests();
      setRequests(data.requests);
    } catch (err: any) {
      console.error('Error loading requests:', err);
      setError(err.message || 'Failed to load requests');
      toast.error('Failed to load quotation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) {
      return;
    }

    try {
      await quotationService.cancelQuotationRequest(requestId);
      toast.success('Request cancelled successfully');
      loadRequests(); // Reload the list
    } catch (error: any) {
      console.error('Cancel request error:', error);
      toast.error('Failed to cancel request');
    }
  };

  const handleAcceptQuotation = async (requestId: string) => {
    if (!confirm('Are you sure you want to accept this quotation? This will initiate the contracting process.')) {
      return;
    }

    try {
      await quotationService.acceptQuotation(requestId);
      toast.success('Quotation accepted! Proceeding to contracting.');
      loadRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('Accept quotation error:', error);
      toast.error('Failed to accept quotation');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedRequest) return;

    setConfirmingDelivery(true);
    try {
      const response = await fetch(`/api/quotations/requests/${selectedRequest.id}/confirm-delivery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ role: 'client' })
      });

      if (!response.ok) {
        throw new Error('Failed to confirm delivery');
      }

      toast.success('Service delivery confirmed! You can now provide feedback.');
      setShowDeliveryConfirmation(false);
      setSelectedRequest(null);
      
      // Reload requests after a delay to avoid rate limiting
      setTimeout(() => {
        loadRequests();
      }, 1000);
    } catch (error: any) {
      console.error('Error confirming delivery:', error);
      toast.error(error.message || 'Failed to confirm delivery');
    } finally {
      setConfirmingDelivery(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { color: string; icon: JSX.Element; label: string } } = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: <HiClock className="w-4 h-4" />,
        label: 'Pending'
      },
      viewed: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        icon: <HiEye className="w-4 h-4" />,
        label: 'Viewed'
      },
      quoted: {
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
        icon: <HiDocumentText className="w-4 h-4" />,
        label: 'Quoted'
      },
      accepted: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: <HiCheckCircle className="w-4 h-4" />,
        label: 'Accepted'
      },
      rejected: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        icon: <HiXCircle className="w-4 h-4" />,
        label: 'Rejected'
      },
      cancelled: {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        icon: <HiXCircle className="w-4 h-4" />,
        label: 'Cancelled'
      },
      client_signed: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        icon: <HiDocumentText className="w-4 h-4" />,
        label: 'Client Signed'
      },
      contract_signed: {
        color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
        icon: <HiCheckCircle className="w-4 h-4" />,
        label: 'Contract Signed'
      },
      contracting: { // Keep for backward compatibility or transition
        color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
        icon: <HiDocumentText className="w-4 h-4" />,
        label: 'Contracting'
      },
      completed: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: <HiCheckCircle className="w-4 h-4" />,
        label: 'Completed'
      }
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.icon}
        {statusInfo.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredRequests = () => {
    switch (activeFilter) {
      case 'active':
        return requests.filter(r => 
          ['pending', 'viewed', 'quoted', 'client_signed'].includes(r.status)
        );
      case 'orders':
        return requests.filter(r => 
          ['contract_signed', 'contracting'].includes(r.status)
        );
      case 'closed':
        return requests.filter(r => 
          ['cancelled', 'rejected', 'completed'].includes(r.status)
        );
      default:
        return requests;
    }
  };

  const getFilterStats = () => {
    return {
      all: requests.length,
      active: requests.filter(r => ['pending', 'viewed', 'quoted', 'client_signed'].includes(r.status)).length,
      orders: requests.filter(r => ['contract_signed', 'contracting'].includes(r.status)).length,
      closed: requests.filter(r => ['cancelled', 'rejected', 'completed'].includes(r.status)).length
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-red-800 dark:text-red-300 font-medium mb-2">Error Loading Requests</h3>
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <button
            onClick={loadRequests}
            className="mt-4 btn btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const filteredRequests = getFilteredRequests();
  const stats = getFilterStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quotation Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your quotation requests and orders
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeFilter === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          All <span className="ml-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">{stats.all}</span>
        </button>
        <button
          onClick={() => setActiveFilter('active')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeFilter === 'active'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Active <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">{stats.active}</span>
        </button>
        <button
          onClick={() => setActiveFilter('orders')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeFilter === 'orders'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Active Orders <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full">{stats.orders}</span>
        </button>
        <button
          onClick={() => setActiveFilter('closed')}
          className={`px-4 py-3 font-medium border-b-2 transition ${
            activeFilter === 'closed'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Closed <span className="ml-2 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 px-2 py-1 rounded-full">{stats.closed}</span>
        </button>
      </div>

      {/* Requests List */}
      <div className="card p-6">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <HiDocumentText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {activeFilter === 'all' ? 'No Requests Yet' : `No ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Requests`}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {activeFilter === 'all' ? 'Generate a prediction and send requests to service providers to get started' : 'Nothing to show in this category'}
            </p>
            {activeFilter === 'all' && (
              <button
                onClick={() => window.location.href = '/dashboard/prediction'}
                className="btn btn-primary"
              >
                Go to Predictions
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div
                key={request.id}
                className="p-5 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {request.title || 'Supply Request'}
                      </h3>
                      {getStatusBadge(request.status || 'pending')}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                      <span className="font-medium">Request #:</span> {request.request_number}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Provider:</span> {request.service_providers?.company_name || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Requested on
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(request.requested_at || request.created_at || '')}
                    </p>
                  </div>
                </div>

                {/* Request Description */}
                {request.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {request.description}
                  </p>
                )}

                {/* Items Count */}
                {request.quotation_request_items && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">Items:</span> {request.quotation_request_items.length} item(s)
                    </p>
                  </div>
                )}

                {/* Provider Quote (if available) */}
                {request.quoted_amount && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-300">
                          Quote Received
                        </p>
                        {request.provider_notes && (
                          <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                            {request.provider_notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-green-600 dark:text-green-400 mb-1">
                          Base: SAR {request.quoted_amount.toLocaleString()}
                        </p>
                        {request.extra_costs && request.extra_costs.length > 0 && (
                          <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">
                            +{request.extra_costs.length} extra cost(s)
                          </p>
                        )}
                        <p className="text-lg font-bold text-green-700 dark:text-green-300">
                          SAR {(() => {
                            let total = request.quoted_amount;
                            request.extra_costs?.forEach((cost: any) => {
                              if (cost.is_percentage) {
                                total += (request.quoted_amount * cost.amount) / 100;
                              } else {
                                total += cost.amount;
                              }
                            });
                            return total.toLocaleString();
                          })()}
                        </p>
                        {request.quoted_delivery_date && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Delivery: {new Date(request.quoted_delivery_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    View Details
                  </button>
                  {(request.status === 'pending' || request.status === 'viewed') && (
                    <button
                      onClick={() => handleCancelRequest(request.id!)}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                    >
                      Cancel Request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Request Details
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {selectedRequest.request_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <HiXMark className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status and Provider */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
                  {getStatusBadge(selectedRequest.status || 'pending')}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Provider</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedRequest.service_providers?.company_name || 'N/A'}
                  </p>
                  {selectedRequest.service_providers?.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedRequest.service_providers.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedRequest.description && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</p>
                  <p className="text-gray-900 dark:text-white">{selectedRequest.description}</p>
                </div>
              )}

              {/* Items */}
              {selectedRequest.quotation_request_items && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Requested Items</p>
                  <div className="space-y-2">
                    {selectedRequest.quotation_request_items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
                      >
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
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {item.quantity} {item.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quote Information */}
              {selectedRequest.quoted_amount && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-900 dark:text-green-300 mb-3">
                    Provider's Quotation
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700 dark:text-green-400">Base Amount:</span>
                      <span className="font-bold text-green-900 dark:text-green-300">
                        SAR {selectedRequest.quoted_amount.toLocaleString()}
                      </span>
                    </div>

                    {/* Extra Costs */}
                    {selectedRequest.extra_costs && selectedRequest.extra_costs.length > 0 && (
                      <>
                        {selectedRequest.extra_costs.map((cost: any, idx: number) => (
                          <div key={idx} className="flex justify-between pl-4 border-l-2 border-green-300 dark:border-green-700">
                            <span className="text-sm text-green-700 dark:text-green-400">
                              {cost.description}:
                            </span>
                            <span className="font-medium text-green-900 dark:text-green-300">
                              {cost.is_percentage ? `+${cost.amount}%` : `+SAR ${cost.amount.toLocaleString()}`}
                            </span>
                          </div>
                        ))}
                        <div className="border-t-2 border-green-300 dark:border-green-700 pt-2 flex justify-between">
                          <span className="font-semibold text-green-900 dark:text-green-300">Total Cost:</span>
                          <span className="text-lg font-bold text-green-700 dark:text-green-300">
                            SAR {(() => {
                              let total = selectedRequest.quoted_amount;
                              selectedRequest.extra_costs?.forEach((cost: any) => {
                                if (cost.is_percentage) {
                                  total += (selectedRequest.quoted_amount * cost.amount) / 100;
                                } else {
                                  total += cost.amount;
                                }
                              });
                              return total.toLocaleString();
                            })()}
                          </span>
                        </div>
                      </>
                    )}

                    {selectedRequest.quoted_delivery_date && (
                      <div className="flex justify-between pt-2 mt-2 border-t border-green-200 dark:border-green-800">
                        <span className="text-sm text-green-700 dark:text-green-400">Delivery Date:</span>
                        <span className="font-medium text-green-900 dark:text-green-300">
                          {new Date(selectedRequest.quoted_delivery_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedRequest.provider_notes && (
                      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-400 mb-1">Notes:</p>
                        <p className="text-sm text-green-900 dark:text-green-300">
                          {selectedRequest.provider_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 mr-3"
              >
                Close
              </button>
              {selectedRequest.status === 'quoted' && (
                <button
                  onClick={() => handleAcceptQuotation(selectedRequest.id!)}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium flex items-center gap-2"
                >
                  <HiCheckCircle className="w-5 h-5" />
                  Sign & Accept
                </button>
              )}
              {selectedRequest.status === 'client_signed' && (
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2">
                  <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                    Waiting for Provider Signature
                  </p>
                </div>
              )}
              {(selectedRequest.status === 'contract_signed' || selectedRequest.status === 'contracting') && (
                <>
                  <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg mr-3">
                    <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium">
                      Contract Active
                    </p>
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-1 truncate max-w-[200px]">
                      Hash: {selectedRequest.contract_hash?.substring(0, 16)}...
                    </p>
                  </div>
                  {!selectedRequest.client_confirmed_delivery && (
                    <button
                      onClick={() => setShowDeliveryConfirmation(true)}
                      className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-medium"
                    >
                      Confirm Delivery
                    </button>
                  )}
                  {selectedRequest.client_confirmed_delivery && !selectedRequest.provider_confirmed_delivery && (
                    <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                      <p className="text-xs text-orange-800 dark:text-orange-300 font-medium">
                        Awaiting Provider Confirmation
                      </p>
                    </div>
                  )}
                  {selectedRequest.client_confirmed_delivery && selectedRequest.provider_confirmed_delivery && (
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-xs text-green-800 dark:text-green-300 font-medium flex items-center gap-2">
                        <HiCheckCircle className="w-4 h-4" />
                        Delivery Confirmed
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
                  By confirming, you acknowledge that you have received and accepted the service delivery. The provider will then need to confirm as well.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Service Details:</p>
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm space-y-1">
                  <p><span className="text-gray-600 dark:text-gray-400">Provider:</span> <span className="font-medium text-gray-900 dark:text-white">{selectedRequest.service_providers?.company_name}</span></p>
                  <p><span className="text-gray-600 dark:text-gray-400">Amount:</span> <span className="font-medium text-gray-900 dark:text-white">SAR {(() => {
                    let total = selectedRequest.quoted_amount || 0;
                    selectedRequest.extra_costs?.forEach((cost: any) => {
                      if (cost.is_percentage) {
                        total += ((selectedRequest.quoted_amount || 0) * cost.amount) / 100;
                      } else {
                        total += cost.amount;
                      }
                    });
                    return total.toLocaleString();
                  })()}</span></p>
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
    </div>
  );
};

export default Requests;