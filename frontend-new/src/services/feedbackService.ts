import api from './api';

export interface SupplyFeedback {
  id?: string;
  prediction_id?: string;
  supply_type: string;
  predicted_quantity: number;
  actual_quantity: number;
  feedback_type: 'accurate' | 'underestimated' | 'overestimated';
  notes?: string;
  submitted_at?: string;
  days_until_reorder?: number;
}

export interface FeedbackSummary {
  total_feedback: number;
  accuracy_rate: number;
  underestimated_count: number;
  overestimated_count: number;
  most_accurate_items: string[];
  needs_improvement_items: string[];
}

class FeedbackService {
  /**
   * Submit supply usage feedback
   */
  async submitFeedback(feedback: SupplyFeedback) {
    const response = await api.post('/feedback/supply-feedback', feedback);
    return response.data;
  }

  /**
   * Get feedback summary for dashboard
   */
  async getFeedbackSummary(): Promise<FeedbackSummary> {
    const response = await api.get('/feedback/summary');
    return response.data;
  }

  /**
   * Alias for getFeedbackSummary
   */
  async getSummary(): Promise<FeedbackSummary> {
    return this.getFeedbackSummary();
  }

  /**
   * Get all feedback (Admin only)
   */
  async getAllFeedback(limit: number = 100, offset: number = 0) {
    const response = await api.get('/feedback/all', { params: { limit, offset } });
    return response.data;
  }

  /**
   * Get recent feedback entries
   */
  async getRecentFeedback(limit: number = 10) {
    const response = await api.get('/feedback/recent', { params: { limit } });
    return response.data;
  }

  /**
   * Get prediction history for feedback
   */
  async getPredictionHistory(options?: { limit?: number }) {
    const limit = options?.limit || 20;
    const response = await api.get('/feedback/prediction-history', { params: { limit } });
    return response.data;
  }

  /**
   * Submit provider rating and feedback
   */
  async submitProviderRating(rating: {
    quotation_request_id: string;
    provider_id: string;
    quality_rating: number;
    delivery_rating: number;
    price_rating: number;
    notes?: string;
  }) {
    const response = await api.post('/feedback/provider-rating', rating);
    return response.data;
  }

  /**
   * Get provider ratings
   */
  async getProviderRatings(providerId: string) {
    const response = await api.get(`/feedback/provider/${providerId}/ratings`);
    return response.data;
  }

  /**
   * Send message to service providers (Admin only)
   */
  async sendProviderMessage(message: string, subject: string, providerIds?: string[]) {
    const response = await api.post('/admin/communications/send-to-providers', {
      message,
      subject,
      provider_ids: providerIds
    });
    return response.data;
  }

  /**
   * Contact service providers about issues (Admin only)
   */
  async contactProviders(message: string, subject: string, messageType: 'supply_request' | 'service_issue', providerIds?: string[]) {
    const response = await api.post('/admin/communications/contact-provider', {
      message,
      subject,
      message_type: messageType,
      provider_ids: providerIds
    });
    return response.data;
  }

  /**
   * Get admin communication messages (Admin only)
   */
  async getAdminMessages() {
    const response = await api.get('/admin/communications/messages');
    return response.data;
  }
}

export default new FeedbackService();