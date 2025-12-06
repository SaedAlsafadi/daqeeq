// Base API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// API request helper with auth
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

// API client with axios-like interface
const api = {
  get: async (endpoint: string, config?: { params?: Record<string, any> }) => {
    let fullEndpoint = endpoint;
    if (config?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
    }
    const data = await apiRequest(fullEndpoint);
    return { data };
  },

  post: async (endpoint: string, body?: any) => {
    const data = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { data };
  },

  put: async (endpoint: string, body?: any) => {
    const data = await apiRequest(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },

  patch: async (endpoint: string, body?: any) => {
    const data = await apiRequest(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
    return { data };
  },

  delete: async (endpoint: string) => {
    const data = await apiRequest(endpoint, {
      method: 'DELETE',
    });
    return { data };
  },
};

export default api;
export { api };