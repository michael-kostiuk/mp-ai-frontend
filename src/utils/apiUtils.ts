import { ApiError } from '../types';

/**
 * Creates a query string from an object of parameters
 */
export const createQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Format API error into a consistent error object
 */
export const formatApiError = (error: any): ApiError => {
  // If it's already in our format, return it
  if (error && error.message && error.status) {
    return error as ApiError;
  }
  
  // Handle fetch errors
  if (error instanceof Error) {
    return {
      message: error.message || 'An unknown error occurred',
      status: 0,
      details: error
    };
  }
  
  // Handle API response errors
  if (error && error.detail) {
    return {
      message: Array.isArray(error.detail) 
        ? error.detail.map((d: any) => d.msg).join(', ')
        : error.detail,
      status: error.status || 500,
      details: error
    };
  }
  
  // Default error
  return {
    message: 'An unknown error occurred',
    status: 500,
    details: error
  };
};

/**
 * Parse JSON safely
 */
export const parseJSON = <T>(text: string): T => {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    throw new Error('Invalid JSON response');
  }
};

/**
 * Check if a response is ok and handle errors
 */
export const checkResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    
    try {
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { detail: errorText };
    }
    
    const error: ApiError = {
      status: response.status,
      message: errorData.detail || `Error: ${response.status} ${response.statusText}`,
      details: errorData
    };
    
    throw error;
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  return response.text();
};