import axios, { AxiosError, AxiosInstance } from "axios";

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:4000/api";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        if (error.response?.status === 401 && localStorage.getItem("token")) {
          localStorage.removeItem("token");
          localStorage.removeItem("auth-storage");
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, unknown>) {
    return this.client.get<T>(url, { params });
  }

  async post<T>(url: string, data?: unknown) {
    return this.client.post<T>(url, data);
  }

  async patch<T>(url: string, data?: unknown) {
    return this.client.patch<T>(url, data);
  }

  async delete<T>(url: string) {
    return this.client.delete<T>(url);
  }
}

export const api = new ApiClient();
