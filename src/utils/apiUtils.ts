import { ApiError } from '../types';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export const createQueryString = (params: Record<string, unknown>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, String(item)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

export const formatApiError = (error: unknown): ApiError => {
  if (isRecord(error) && typeof error.message === 'string' && typeof error.status === 'number') {
    return error as ApiError;
  }
  
  if (error instanceof Error) {
    return {
      message: error.message || 'An unknown error occurred',
      status: 0,
      details: error
    };
  }
  
  if (isRecord(error) && 'detail' in error) {
    const detail = error.detail;
    const message = Array.isArray(detail)
      ? detail
          .map(d => {
            if (isRecord(d) && typeof d.msg === 'string') return d.msg;
            return String(d);
          })
          .join(', ')
      : typeof detail === 'string'
          ? detail
          : String(detail);
    return {
      message,
      status: typeof error.status === 'number' ? error.status : 500,
      details: error
    };
  }
  
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
  } catch (e: unknown) {
    console.error('Error parsing JSON:', e);
    throw new Error('Invalid JSON response');
  }
};

/**
 * Check if a response is ok and handle errors
 */
export const checkResponse = async (response: Response): Promise<unknown> => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorData: unknown;
    
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { detail: errorText };
    }
    
    const error: ApiError = {
      status: response.status,
      message: isRecord(errorData) && typeof errorData.detail === 'string'
        ? errorData.detail
        : `Error: ${response.status} ${response.statusText}`,
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
