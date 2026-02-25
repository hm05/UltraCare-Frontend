import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Clear stored auth on unauthorized
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (email: string, password: string) =>
        api.post('/login', { email, password }),
    
    register: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone: string;
    }) => api.post('/register', data),
    
    forgotPassword: (email: string) =>
        api.post('/staff/forgot-password', { email }),
    
    resetPassword: (userId: string, newPassword: string) =>
        api.post('/admin/reset-password', { userId, newPassword }),
};

// Dashboard APIs
export const dashboardAPI = {
    getDoctorDashboard: () => api.get('/dashboard/doctor'),
    getStaffDashboard: () => api.get('/dashboard/staff'),
};

// Case APIs
export const caseAPI = {
    createCase: (data: {
        patientId?: string;
        patient?: {
            name: string;
            age: number;
            sex: string;
            phone: string;
            address?: string;
        };
        serviceType: string;
        referredBy?: string;
        amount: number;
        paymentMode: string;
    }) => api.post('/cases', data),
    
    logVisit: (caseId: string, data: { visitDate?: string; notes?: string }) =>
        api.post(`/cases/${caseId}/visits`, data),
    
    createReport: (caseId: string, data: { description: string; imageUrl?: string }) =>
        api.post(`/cases/${caseId}/reports`, data),
    
    getDoctorDailyCases: (date?: string) =>
        api.get('/doctor/daily-cases', { params: { date } }),
    
    exportReportHtml: (caseId: string, reportId: string) =>
        api.get(`/cases/${caseId}/reports/${reportId}/export/html`),
    
    exportReportMarkdown: (caseId: string, reportId: string) =>
        api.get(`/cases/${caseId}/reports/${reportId}/export/md`),
    
    printReport: (caseId: string, reportId: string) =>
        api.get(`/cases/${caseId}/reports/${reportId}/print`),
    
    updateReportImage: (caseId: string, reportId: string, imageUrl: string) =>
        api.patch(`/cases/${caseId}/reports/${reportId}/image`, { imageUrl }),
    
    updateReportDescription: (caseId: string, reportId: string, description: string) =>
        api.patch(`/cases/${caseId}/reports/${reportId}/description`, { description }),
};

// Patient APIs
export const patientAPI = {
    search: (query: string) =>
        api.get('/patients/search', { params: { q: query } }),
    
    getChronology: (patientId: string) =>
        api.get(`/patients/${patientId}/chronology`),
};

// Organization APIs
export const organizationAPI = {
    getPricing: () => api.get('/organization/settings/pricing'),
    updatePricing: (pricing: Record<string, number>) =>
        api.put('/organization/settings/pricing', pricing),
};

// Referral APIs
export const referralAPI = {
    registerDoctor: (data: {
        name: string;
        clinic?: string;
        phone?: string;
        percentage?: number;
    }) => api.post('/referral/doctors', data),
    
    listDoctors: () => api.get('/referral/doctors'),
    
    getDoctorReport: (doctorId: string, params?: { startDate?: string; endDate?: string }) =>
        api.get(`/referral/doctors/${doctorId}/report`, { params }),
    
    exportDoctorPDF: (doctorId: string) =>
        api.get(`/referral/doctors/${doctorId}/export/pdf`, { responseType: 'blob' }),
    
    exportDashboard: (format: 'pdf' | 'xlsx') =>
        api.get('/referral/dashboard/export', { params: { format }, responseType: 'blob' }),
};

// Collection APIs
export const collectionAPI = {
    getCollection: (params?: { startDate?: string; endDate?: string }) =>
        api.get('/collection', { params }),
    
    exportPDF: (params?: { startDate?: string; endDate?: string }) =>
        api.get('/collection/export/pdf', { params, responseType: 'blob' }),
    
    exportExcel: (params?: { startDate?: string; endDate?: string }) =>
        api.get('/collection/export/xlsx', { params, responseType: 'blob' }),
    
    exportMarkdown: (params?: { startDate?: string; endDate?: string }) =>
        api.get('/collection/export/md', { params, responseType: 'blob' }),
    
    exportModified: (data: { cashDeduction?: number; startDate?: string; endDate?: string }) =>
        api.post('/collection/export/modified', data, { responseType: 'blob' }),
};

// Upload APIs
export const uploadAPI = {
    uploadFile: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/upload/file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    
    getSignedUrl: (filename: string) =>
        api.get(`/upload/file/${filename}/url`),
    
    deleteFile: (filename: string) =>
        api.delete(`/upload/file/${filename}/delete`),
    
    listFiles: () => api.get('/upload/files'),
};

export default api;
