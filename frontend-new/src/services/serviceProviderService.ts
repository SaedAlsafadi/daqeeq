import api from './api'

export interface ServiceProvider {
  id: string
  company_name: string
  email: string
  phone?: string
  contact_person?: string
  address?: string
  website?: string
  specialization?: string[]
  service_types?: string[]
  capacity_level?: string
  rating: number
  total_reviews: number
  years_in_business?: number
  service_regions?: string[]
  minimum_order_value?: number
  delivery_time_days?: number
  payment_terms?: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface ProviderRequest {
  id: string
  requestNumber: string
  title?: string
  description?: string
  clientName: string
  contactPerson?: string
  status: 'pending' | 'viewed' | 'quoted' | 'accepted' | 'rejected' | 'cancelled' | 'client_signed' | 'contract_signed' | 'completed'
  quotedAmount?: number
  quotedDeliveryDate?: string
  createdAt: string
  respondedAt?: string
  serviceType?: string
  quantity?: number
  totalValue?: number
  notes?: string
  provider_confirmed_delivery?: boolean
  provider_confirmed_at?: string
  client_confirmed_delivery?: boolean
  client_confirmed_at?: string
}

export interface OnboardingStep {
  id: string
  stepName: string
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  completedDate?: string
  notes?: string
}

export interface CommunicationLog {
  id: string
  communicationType: 'email' | 'phone' | 'meeting' | 'note'
  subject: string
  message: string
  communicationDate: string
  status: string
  nextFollowUpDate?: string
}

export interface ExtraCost {
  id?: string
  description: string
  amount: number
  is_percentage?: boolean
}

export interface QuotationRequest {
  id: string
  request_number: string
  title?: string
  description?: string
  status: 'pending' | 'viewed' | 'quoted' | 'accepted' | 'rejected' | 'cancelled' | 'client_signed' | 'contract_signed' | 'completed'
  quoted_amount?: number
  quoted_delivery_date?: string
  provider_notes?: string
  extra_costs?: ExtraCost[]
  requested_at: string
  contract_hash?: string
  items: Array<{
    id: string
    item_name: string
    item_type?: string
    quantity: number
    unit: string
  }>
  client?: {
    company: { name: string; email?: string; phone?: string }
    user: { first_name: string; last_name: string; email: string }
  }
  service_providers?: {
    company_name: string
    email: string
  }
  provider_confirmed_delivery?: boolean
  provider_confirmed_at?: string
  client_confirmed_delivery?: boolean
  client_confirmed_at?: string
}

export interface DashboardStats {
  activeRequests: number
  completedRequests: number
  totalRevenue: number
  averageRating: number
  totalReviews: number
  pendingRequests: number
  acceptedRequests: number
  responseRate: number
}

export interface Analytics {
  monthlyRevenue: Array<{ month: string; value: number }>
  requestsByStatus: Record<string, number>
  serviceBreakdown: Array<{ service: string; count: number; revenue: number }>
  ratingDistribution: Array<{ stars: number; count: number }>
}

const serviceProviderService = {
  // Get provider profile
  async getProfile(): Promise<ServiceProvider> {
    const response = await api.get('/service-providers/profile')
    return response.data.provider
  },

  // Update provider profile
  async updateProfile(data: Partial<ServiceProvider>): Promise<ServiceProvider> {
    // Filter out null, undefined, and empty string values to avoid validation errors
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== null && value !== undefined && value !== '')
    )
    const response = await api.patch('/service-providers/profile', cleanData)
    return response.data.provider
  },

  // Get requests for service provider
  async getRequests(
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ requests: ProviderRequest[]; pagination: any }> {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    params.append('page', page.toString())
    params.append('limit', limit.toString())

    const response = await api.get(`/service-providers/requests?${params.toString()}`)
    return {
      requests: response.data.requests,
      pagination: response.data.pagination
    }
  },

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/service-providers/dashboard-stats')
    return response.data.stats
  },

  // Get onboarding status
  async getOnboardingStatus(): Promise<{
    steps: OnboardingStep[]
    progress: number
    totalSteps: number
    completedSteps: number
  }> {
    const response = await api.get('/service-providers/onboarding-status')
    return {
      steps: response.data.steps,
      progress: response.data.progress,
      totalSteps: response.data.totalSteps,
      completedSteps: response.data.completedSteps
    }
  },

  // Get communication log
  async getCommunicationLog(): Promise<CommunicationLog[]> {
    const response = await api.get('/service-providers/communication-log')
    return response.data.logs
  },

  // Get analytics data
  async getAnalytics(): Promise<Analytics> {
    const response = await api.get('/service-providers/analytics')
    return response.data.analytics
  },

  // Get quotation request details
  async getQuotationDetails(requestId: string): Promise<QuotationRequest> {
    const response = await api.get(`/service-providers/quotations/${requestId}`)
    return response.data.request
  },

  // Send quotation response with pricing and extra costs
  async sendQuotationResponse(requestId: string, data: {
    quotedAmount: number
    quotedDeliveryDate: string
    providerNotes?: string
    extraCosts?: ExtraCost[]
    items?: Array<{ id: string; unit_price: number }>
  }): Promise<{ request: QuotationRequest; totalAmount: number }> {
    const response = await api.post(`/service-providers/quotations/${requestId}/respond`, {
      quotedAmount: data.quotedAmount,
      quotedDeliveryDate: data.quotedDeliveryDate,
      providerNotes: data.providerNotes,
      extraCosts: data.extraCosts || [],
      items: data.items || []
    })
    return {
      request: response.data.request,
      totalAmount: response.data.request.totalAmount
    }
  },

  async signContract(requestId: string) {
    const response = await api.put(`/quotations/requests/${requestId}/provider-sign`)
    return response.data
  }
}

export default serviceProviderService