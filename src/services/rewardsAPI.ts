const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API Response Types - these belong to the API layer
export interface Coupon {
  id: string;
  title: string;
  description: string;
  partner_company: string;
  cost_in_coins: number;
  max_redemptions: number;
  current_redemptions: number;
  expires_at: string;
  image_url: string;
  terms_conditions: string;
  is_active: boolean;
}

export interface Redemption {
  id: string;
  coupon: Coupon;
  redemption_code: string;
  coins_spent: number;
  redeemed_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface CoinBalance {
  current_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token');
};

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  
  if (!token) {
    console.error('No authentication token found');
    throw new Error('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  try {
    console.log(`Making request to: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      console.error('Authentication failed - token may be expired');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error('Authentication failed - please log in again');
    }

    if (!response.ok) {
      const responseClone = response.clone();
      const errorText = await responseClone.text();
      console.error(`API Error - Status: ${response.status}, URL: ${url}, Response: ${errorText}`);
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.detail) {
          console.error('Validation errors:', errorData.detail);
        }
      } catch (parseError) {
        console.error('Could not parse error response as JSON');
      }
    }
    
    return response;
  } catch (error) {
    console.error(`Network error for ${url}:`, error);
    throw error;
  }
};

export const rewardsAPI = {
  async getCoupons(params?: {
    category?: string;
    min_coins?: number;
    max_coins?: number;
  }): Promise<Coupon[]> {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.min_coins) queryParams.append('min_coins', params.min_coins.toString());
    if (params?.max_coins) queryParams.append('max_coins', params.max_coins.toString());

    const url = `${API_BASE_URL}/api/rewards/coupons${queryParams.toString() ? `?${queryParams}` : ''}`;

    const response = await fetchWithAuth(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch coupons: ${response.statusText}`);
    }

    return response.json();
  },

  async getCouponDetails(couponId: string): Promise<Coupon> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/rewards/coupons/${couponId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch coupon details: ${response.statusText}`);
    }

    return response.json();
  },

  async redeemCoupon(couponId: string): Promise<Redemption> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/rewards/redeem`, {
      method: 'POST',
      body: JSON.stringify({ coupon_id: couponId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to redeem coupon: ${response.statusText}`);
    }

    return response.json();
  },

  async getMyRedemptions(params?: {
    limit?: number;
    offset?: number;
    active_only?: boolean;
  }): Promise<Redemption[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('limit', (params?.limit || 20).toString());
    queryParams.append('offset', (params?.offset || 0).toString());
    queryParams.append('active_only', (params?.active_only || false).toString());

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/rewards/my-redemptions?${queryParams}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch redemptions: ${response.statusText}`);
    }

    return response.json();
  },

  async getRedemptionDetails(redemptionId: string): Promise<Redemption> {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/rewards/redemption/${redemptionId}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch redemption details: ${response.statusText}`);
    }

    return response.json();
  },

  async markRedemptionUsed(redemptionId: string): Promise<ApiResponse> {
    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/rewards/redemption/${redemptionId}/use`,
      {
        method: 'POST',
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to mark redemption as used: ${response.statusText}`);
    }

    return response.json();
  },

  async getRewardCategories(): Promise<string[]> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/rewards/categories`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reward categories: ${response.statusText}`);
    }

    return response.json();
  },

  async getRewardStatistics(): Promise<any> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/rewards/statistics`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch reward statistics: ${response.statusText}`);
    }

    return response.json();
  },

  async getCoinBalance(): Promise<CoinBalance> {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/coins`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch coin balance: ${response.statusText}`);
    }

    return response.json();
  },
};