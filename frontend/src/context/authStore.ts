// src/context/authStore.ts
import { create } from 'zustand';
import axiosClient from '../api/axiosClient';
import type { LoginResponse, WhoAmIResponse, RegisterRequest, RegisterResponse } from '../types/user';


interface AuthState {
  user: WhoAmIResponse['data'] | null; // Xogta qofka (user_id, username, role)
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (data: RegisterRequest) => Promise<{ success: boolean; message?: string; error?: string }>;
  checkWhoAmI: () => Promise<void>;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  // 1. LOGIN FUNCTION
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosClient.post<LoginResponse>('/users/login', { email, password });
      
      // Kaydi labada Token ee Postman-ku kuu soo celiyey
      localStorage.setItem('access_token', response.data.data.access_token);
      localStorage.setItem('refresh_token', response.data.data.refresh_token);

      set({ isAuthenticated: true });
      
      // Markaba wac whoami si loo ogaado Role-kiisa
      await useAuthStore.getState().checkWhoAmI();
      
      return { success: true };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Iimaylka ama Password-ka ayaa khaldan!';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  // REGISTER FUNCTION
  registerUser: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await axiosClient.post<RegisterResponse>('/users/create', data);
      set({ loading: false });
      return { success: true, message: response.data.message || 'Hambalyo! Waa lagu diiwaangeliyey.' };
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Cilad ayaa dhacday intii diiwaangelinta socotay!';
      set({ error: errMsg, loading: false });
      return { success: false, error: errMsg };
    }
  },

  // 2. WHOAMI FUNCTION (Xaqiijinta Role-ka)
  checkWhoAmI: async () => {
    set({ loading: true });
    try {
      const response = await axiosClient.get<WhoAmIResponse>('/users/whoami');
      if (response.data.is_success) {
        set({ user: response.data.data, isAuthenticated: true, loading: false });
      }
    } catch (err) {
      // Haddii token-ku dhacay ama uu khaldan yahay, saar qofka
      useAuthStore.getState().logout();
    }
  },

  // 3. LOGOUT FUNCTION
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, isAuthenticated: false, loading: false });
  },
}));

export default useAuthStore;