import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CreateLoanPayload, Loan, LoanFilterStatus, LoanSummary, User } from '../types';

const STORAGE_KEY_TOKEN = '@miniledger_token';
const STORAGE_KEY_API_URL = '@miniledger_api_url';

// Default base URL depending on platform
const getDefaultBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000';
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  // iOS Simulator
  return 'http://localhost:5000';
};

let cachedApiUrl: string | null = null;

export const getApiBaseUrl = async (): Promise<string> => {
  if (cachedApiUrl) return cachedApiUrl;
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_API_URL);
    if (saved) {
      cachedApiUrl = saved;
      return saved;
    }
  } catch (e) {
    // ignore
  }
  cachedApiUrl = getDefaultBaseUrl();
  return cachedApiUrl;
};

export const setApiBaseUrl = async (url: string): Promise<void> => {
  cachedApiUrl = url;
  await AsyncStorage.setItem(STORAGE_KEY_API_URL, url);
};

// Helper for making authenticated requests
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: any[] }> {
  try {
    const baseUrl = await getApiBaseUrl();
    const token = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);

    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const json = await res.json();

    if (!res.ok) {
      return {
        success: false,
        message: json.message || 'Request failed',
        errors: json.errors,
      };
    }

    return {
      success: true,
      data: json,
    };
  } catch (error: any) {
    console.error(`API Error [${endpoint}]:`, error);
    return {
      success: false,
      message: error.message || 'Network error. Please check backend connection.',
    };
  }
}

// Auth API
export const api = {
  // Auth
  sendOtp: async (phone: string): Promise<{ success: boolean; message?: string; mockOtp?: string }> => {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    return res.json();
  },

  verifyOtp: async (
    phone: string,
    otp: string
  ): Promise<{ success: boolean; token?: string; user?: User; message?: string }> => {
    const baseUrl = await getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    if (data.success && data.token) {
      await AsyncStorage.setItem(STORAGE_KEY_TOKEN, data.token);
    }
    return data;
  },

  getMe: async (): Promise<{ success: boolean; user?: User; message?: string }> => {
    const res = await request<{ user: User }>('/api/auth/me');
    return {
      success: res.success,
      user: res.data?.user,
      message: res.message,
    };
  },

  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem(STORAGE_KEY_TOKEN);
  },

  // Summary
  getSummary: async (): Promise<{ success: boolean; summary?: LoanSummary; message?: string }> => {
    const res = await request<{ summary: LoanSummary }>('/api/summary');
    return {
      success: res.success,
      summary: res.data?.summary,
      message: res.message,
    };
  },

  // Loans
  getLoans: async (
    status: LoanFilterStatus = 'all',
    search: string = ''
  ): Promise<{ success: boolean; loans?: Loan[]; message?: string }> => {
    const query = new URLSearchParams();
    if (status !== 'all') query.append('status', status);
    if (search.trim()) query.append('search', search.trim());

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request<{ loans: Loan[] }>(`/api/loans${queryString}`);
    return {
      success: res.success,
      loans: res.data?.loans || [],
      message: res.message,
    };
  },

  createLoan: async (
    payload: CreateLoanPayload
  ): Promise<{ success: boolean; loan?: Loan; message?: string; errors?: any[] }> => {
    const baseUrl = await getApiBaseUrl();
    const token = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);

    if (payload.receiptUri) {
      // Use multipart/form-data for receipt file upload
      const formData = new FormData();
      formData.append('friendName', payload.friendName);
      formData.append('amount', payload.amount.toString());
      formData.append('dueDate', payload.dueDate);
      if (payload.notes) formData.append('notes', payload.notes);

      // Extract filename & type from uri
      const uri = payload.receiptUri;
      const filename = uri.split('/').pop() || 'receipt.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      if (Platform.OS === 'web') {
        // On web, fetch blob from object URL or data URL
        const blob = await (await fetch(uri)).blob();
        formData.append('receipt', blob, filename);
      } else {
        // React Native mobile FormData file representation
        formData.append('receipt', {
          uri,
          name: filename,
          type,
        } as any);
      }

      const res = await fetch(`${baseUrl}/api/loans`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      return res.json();
    } else {
      // Simple JSON body
      const res = await request<{ loan: Loan }>('/api/loans', {
        method: 'POST',
        body: JSON.stringify({
          friendName: payload.friendName,
          amount: payload.amount,
          dueDate: payload.dueDate,
          notes: payload.notes,
        }),
      });
      return {
        success: res.success,
        loan: res.data?.loan,
        message: res.message,
        errors: res.errors,
      };
    }
  },

  markLoanAsRepaid: async (
    id: string
  ): Promise<{ success: boolean; loan?: Loan; message?: string }> => {
    const res = await request<{ loan: Loan }>(`/api/loans/${id}/repay`, {
      method: 'PATCH',
    });
    return {
      success: res.success,
      loan: res.data?.loan,
      message: res.message,
    };
  },

  deleteLoan: async (id: string): Promise<{ success: boolean; message?: string }> => {
    const res = await request(`/api/loans/${id}`, {
      method: 'DELETE',
    });
    return {
      success: res.success,
      message: res.message,
    };
  },
};
