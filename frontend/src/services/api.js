import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (userData) => api.post('/auth/register', userData),
    login: (credentials) => api.post('/auth/login', credentials),
    getMe: () => api.get('/auth/me'),
};

// Transactions API
export const transactionsAPI = {
    getAll: (params) => api.get('/transactions', { params }),
    getById: (id) => api.get(`/transactions/${id}`),
    create: (transactionData) => api.post('/transactions', transactionData),
    update: (id, transactionData) => api.put(`/transactions/${id}`, transactionData),
    delete: (id) => api.delete(`/transactions/${id}`),
    getAnalytics: (params) => api.get('/transactions/analytics', { params }),
};

// Categories API
export const categoriesAPI = {
    getAll: (params) => api.get('/categories', { params }),
    getById: (id) => api.get(`/categories/${id}`),
    create: (categoryData) => api.post('/categories', categoryData),
    update: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
    delete: (id) => api.delete(`/categories/${id}`),
};

// Upload API
export const uploadAPI = {
    uploadReceipt: (formData) => api.post('/upload/receipt', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    createTransactionFromReceipt: (data) => api.post('/upload/create-transaction', data),
    uploadTransactionHistory: (formData) => api.post('/upload/transaction-history', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    bulkCreateTransactions: (data) => api.post('/upload/bulk-create-transactions', data),
};

export default api;
