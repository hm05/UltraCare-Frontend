import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    // Timeout after 30s — prevents requests hanging indefinitely
    timeout: 30_000,
});

// ─── Attach auth token ────────────────────────────────────────────────────
client.interceptors.request.use((config) => {
    // Read from sessionStorage (not localStorage) — see AuthContext for rationale
    const token = sessionStorage.getItem('uc_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Handle auth errors ───────────────────────────────────────────────────
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const url: string | undefined = error.config?.url;
            // Do NOT auto-logout on auth endpoints themselves — let the UI show the error
            const isAuthEndpoint = url === '/login'
                || url === '/register'
                || url === '/staff/login'
                || url === '/staff/forgot-password'
                || url === '/admin/reset-password';

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

export default client;
