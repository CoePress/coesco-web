import axios, { AxiosInstance, AxiosRequestConfig, Method } from 'axios';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, 
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err?.response?.data || err)
);

const request = <T = any>(
  method: Method,
  url: string,
  data?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<T> => {
  const options: AxiosRequestConfig = { method, url, ...config };
  if (method.toLowerCase() === 'get') {
    options.params = data;
  } else {
    options.data = data;
  }
  return axiosInstance(options);
};

export const api = {
  get:    <T = any>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig) => request<T>('GET', url, params, config),
  post:   <T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig) => request<T>('POST', url, data, config),
  put:    <T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig) => request<T>('PUT', url, data, config),
  patch:  <T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig) => request<T>('PATCH', url, data, config),
  delete: <T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig) => request<T>('DELETE', url, data, config),
  request
};

export default api;
