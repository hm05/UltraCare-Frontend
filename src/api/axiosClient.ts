import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const axiosClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Timeout after 30s — prevents requests hanging indefinitely
    timeout: 30_000,
});

// ─── Attach auth token ────────────────────────────────────────────────────
axiosClient.interceptors.request.use((config) => {
    // Read from sessionStorage (not localStorage) — see AuthContext for rationale
    const token = sessionStorage.getItem('uc_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Unwrap backend envelope ──────────────────────────────────────────────
// Every backend response has the shape: { success: boolean, message: string, data: T }
// This interceptor transparently unwraps it so callers get response.data = T directly.
axiosClient.interceptors.response.use(
    (response) => {
        const envelope = response.data;
        // Only unwrap JSON envelopes that follow our { success, data } contract
        if (envelope && typeof envelope === 'object' && 'success' in envelope) {
            if (envelope.success) {
                // Replace response.data with the inner payload
                response.data = envelope.data;
            } else {
                // success: false — surface as a rejected promise with the backend error message
                const err: any = new Error(envelope.error || envelope.message || 'Request failed');
                err.response = response;
                err.isApiError = true;
                return Promise.reject(err);
            }
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            const url: string | undefined = error.config?.url;
            // Do NOT auto-logout on auth endpoints themselves — let the UI show the error
            // Note: error.config.url is relative to baseURL, so it does NOT include '/api'
            const isAuthEndpoint = url === '/auth/doctor-login'
                || url === '/auth/doctor-register'
                || url === '/auth/staff-login'
                || url === '/auth/staff-forgot-password'
                || url === '/auth/admin-reset-password';

            if (!isAuthEndpoint) {
                // Clear session and redirect to login
                sessionStorage.removeItem('uc_token');
                sessionStorage.removeItem('uc_user');
                sessionStorage.removeItem('uc_token_expiry');
                // Also clear legacy localStorage
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
