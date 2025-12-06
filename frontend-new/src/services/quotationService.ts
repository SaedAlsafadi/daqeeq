import api from './api';

export interface ServiceProvider {
  id: string;
  company_name: string;
  contact_person?: string;
  email: string;
  phone?: string;
  address?: string;
  website?: string;
  specialization: string[];
  capacity_level: string;
  rating: number;
  total_reviews: number;
  years_in_business?: number;
  minimum_order_value?: number;
  delivery_time_days?: number;
  matchScore?: number;
}

export interface QuotationRequestItem {
  id?: string;
  name: string;
  type?: string;
  quantity: number;
  unit: string;
  product_id?: string;
}

export interface ExtraCost {
  id?: string;
  description: string;
  amount: number;
  is_percentage?: boolean;
}

export interface QuotationRequest {
  id?: string;
  request_number?: string;
  company_id?: string;
  client_decision?: 'accepted' | 'rejected' | 'considering';
  client_decision_notes?: string;
  client_decided_at?: string;
  contract_status?: string;
  contract_hash?: string;
  signed_at?: string;
  created_at?: string;
  user_id?: string;
  provider_id: string;
  prediction_id?: string;
  title?: string;
  description?: string;
  requirements?: any;
  status?: string;
  quoted_amount?: number;
  quoted_delivery_date?: string;
  provider_notes?: string;
  extra_costs?: ExtraCost[];
  requested_at?: string;
  expires_at?: string;
  service_providers?: ServiceProvider;
  quotation_request_items?: any[];
  user?: {
    first_name: string;
    last_name: string;
  };
}

export interface SavePredictionRequest {
  facility_size_sqm: number;
  number_of_people: number;
  number_of_bathrooms: number;
  days_count: number;
  cleaning_frequency: string;
  organization_type: string;
  predictions: any;
  model_version?: string;
  confidence_score?: number;
}

export interface PredictionDraft {
  id: string;
  facility_size_sqm: number;
  number_of_people: number;
  number_of_bathrooms: number;
  days_count: number;
  cleaning_frequency: string;
  organization_type: string;
  predictions: any;
  status: string;
  created_at: string;
}

class QuotationService {
  /**
   * Save prediction results to database
   */
  async savePrediction(predictionData: SavePredictionRequest) {
    const response = await api.post('/quotations/save-prediction', predictionData);
    return response.data;
  }

  /**
   * Get service provider suggestions based on organization and size
   */
  async getProviderSuggestions(params: {
    organizationType?: string;
    facilitySize?: number;
    predictionId?: string;
  }): Promise<{ providers: ServiceProvider[]; total: number }> {
    const response = await api.get('/quotations/providers/suggestions', { params });
    return response.data;
  }

  /**
   * Send quotation request to provider
   */
  async sendQuotationRequest(requestData: {
    providerId: string;
    predictionId?: string;
    title?: string;
    description?: string;
    requirements?: any;
    items: QuotationRequestItem[];
  }) {
    const response = await api.post('/quotations/request', {
      providerId: requestData.providerId,
      predictionId: requestData.predictionId,
      title: requestData.title,
      description: requestData.description,
      requirements: requestData.requirements,
      items: requestData.items
    });
    return response.data;
  }

  /**
   * Get all quotation requests for user's company
   */
  async getQuotationRequests(): Promise<{ requests: QuotationRequest[]; total: number }> {
    const response = await api.get('/quotations/requests');
    return response.data;
  }

  /**
   * Get single quotation request details
   */
  async getQuotationRequest(id: string): Promise<{ request: QuotationRequest }> {
    const response = await api.get(`/quotations/requests/${id}`);
    return response.data;
  }

  /**
   * Cancel a quotation request
   */
  async cancelQuotationRequest(id: string) {
    const response = await api.put(`/quotations/requests/${id}/cancel`);
    return response.data;
  }

  /**
   * Accept a quotation request
   */
  async acceptQuotation(id: string) {
    const response = await api.put(`/quotations/requests/${id}/accept`);
    return response.data;
  }

  /**
   * Save prediction as draft (without sending requests)
   */
  async saveDraft(predictionData: SavePredictionRequest) {
    const response = await api.post('/quotations/save-draft', predictionData);
    return response.data;
  }

  /**
   * Get all draft predictions for user's company
   */
  async getDrafts(): Promise<{ drafts: PredictionDraft[]; total: number }> {
    const response = await api.get('/quotations/drafts');
    return response.data;
  }

  /**
   * Delete a draft prediction
   */
  async deleteDraft(id: string) {
    const response = await api.delete(`/quotations/drafts/${id}`);
    return response.data;
  }

  /**
   * Continue from a draft (convert to completed prediction)
   */
  async continueDraft(id: string) {
    const response = await api.post(`/quotations/continue-draft/${id}`);
    return response.data;
  }
}

const quotationService = new QuotationService();
export default quotationService;