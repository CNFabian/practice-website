const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Import shared fetchWithAuth from learningAPI
import { fetchWithAuth } from './learningAPI';

// GET /api/dashboard/overview
export const getDashboardOverview = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/overview`, {
      method: 'GET'
    });
    
    // Check for the 500 error specifically to give better feedback
    if (response.status === 500) {
      console.error('SERVER ERROR: The backend crashed. Check UUID validation logic.');
      throw new Error('Internal Server Error');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Dashboard overview data received:', data);
    return data;
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    throw error;
  }
};

export const getDashboardModules = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/modules`, {
      method: 'GET'
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard modules:', error);
    throw error;
  }
};

export const getCoinBalance = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/coins`, {
      method: 'GET'
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching coin balance:', error);
    throw error;
  }
};

export const getDashboardBadges = async (): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/dashboard/badges`, {
      method: 'GET'
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard badges:', error);
    throw error;
  }
};