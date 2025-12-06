import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface PredictionInput {
  facility_size_sqm: number;
  number_of_people: number;
  number_of_bathrooms: number;
  days_count?: number;
  cleaning_frequency?: string;
  organization_type: string;
}

export interface PredictionResult {
  'Total_Toilet_Paper_Sheets': number;
  'Hand soap (mL)': number;
  'Disinfectant (L)': number;
  'Air freshener (mL)': number;
  'Glass cleaner (mL)': number;
  'Trash_Bags (8 gallon)': number;
  'Total_Tissues': number;
  'Number_of_Workers': number;
}

export interface PredictionResponse {
  success: boolean;
  data: {
    predictions: PredictionResult;
    input_features: PredictionInput;
  };
}

export interface ModelsInfo {
  available_models: string[];
  organization_types: string[];
  cleaning_frequencies: string[];
  input_fields: {
    required: string[];
    optional: string[];
  };
}

class PredictionService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/predictions`;
  }

  /**
   * Get ML service health status
   */
  async getHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      console.error('Failed to check ML service health:', error);
      throw error;
    }
  }

  /**
   * Get information about available models
   */
  async getModelsInfo(): Promise<ModelsInfo> {
    try {
      const response = await axios.get(`${this.baseURL}/models/info`);
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch models info:', error);
      throw error;
    }
  }

  /**
   * Make a prediction for all supply types
   */
  async predict(input: PredictionInput): Promise<PredictionResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/predict`, input);
      return response.data;
    } catch (error) {
      console.error('Prediction failed:', error);
      throw error;
    }
  }

  /**
   * Make a prediction for a single target
   */
  async predictSingle(target: string, input: PredictionInput) {
    try {
      const response = await axios.post(`${this.baseURL}/predict/${target}`, input);
      return response.data;
    } catch (error) {
      console.error(`Prediction for ${target} failed:`, error);
      throw error;
    }
  }
}

export default new PredictionService();