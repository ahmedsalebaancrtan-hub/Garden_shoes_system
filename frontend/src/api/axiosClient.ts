// src/api/axiosClient.ts
import axios, { type InternalAxiosRequestConfig } from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:8000/api', // Port-ka rasmiga ah ee Backend-kaaga
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor si otomaatig ah ugu daraya Token-ka codsi kasta oo baxaya
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosClient;