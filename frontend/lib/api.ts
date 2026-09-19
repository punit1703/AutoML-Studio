import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle Network Errors / Backend Unavailable
    if (!error.response) {
      if (typeof window !== 'undefined') {
        alert("Network Error: Backend is unavailable. Please check your connection.");
      }
      return Promise.reject(new Error("Backend is unavailable."));
    }
    
    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        window.location.href = '/login?expired=true';
      }
    }
    
    // Handle 500 Internal Server Error generically if not handled by component
    if (error.response && error.response.status >= 500) {
      console.error("Internal Server Error:", error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
    return true;
  } catch (error: any) {
    console.error('Download failed:', error);
    if (error.response?.status === 401) {
      alert("Session expired. Please log in again to download.");
    } else {
      alert("Failed to download file. Please try again.");
    }
    return false;
  }
};

export default api;
