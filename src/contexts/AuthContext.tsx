import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

interface User {
    id: string;
    email: string;
    role: 'doctor' | 'staff' | 'admin';
    firstName: string;
    lastName: string;
    username?: string;
    organizationId: string | null;
    profilePictureUrl?: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    role: 'doctor' | 'staff' | 'admin' | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ organizationSetupRequired?: boolean }>;
    staffLogin: (username: string, password: string) => Promise<{ changePasswordRequired?: boolean }>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Session Storage Keys ─────────────────────────────────────────────────
// HIPAA/security: Use sessionStorage instead of localStorage.
// sessionStorage is cleared when the browser tab is closed, preventing
// PHI from persisting on shared or unattended devices.
const TOKEN_KEY = 'uc_token';
const USER_KEY = 'uc_user';
const TOKEN_EXPIRY_KEY = 'uc_token_expiry';
const REFRESH_TOKEN_KEY = 'uc_refresh_token';

function saveSession(token: string, user: User, expiresInSeconds: number, refreshToken?: string) {
    const expiryMs = Date.now() + expiresInSeconds * 1000;
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryMs));
    if (refreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
}

function clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
}

function loadSession(): { token: string; user: User } | null {
    try {
        const token = sessionStorage.getItem(TOKEN_KEY);
        const userRaw = sessionStorage.getItem(USER_KEY);
        const expiryRaw = sessionStorage.getItem(TOKEN_EXPIRY_KEY);

        if (!token || !userRaw) return null;

        // Check token expiry
        if (expiryRaw) {
            const expiry = Number(expiryRaw);
            if (Date.now() >= expiry) {
                clearSession();
                return null;
            }
        }

        return { token, user: JSON.parse(userRaw) };
    } catch {
        clearSession();
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-logout when token expires
    const scheduleAutoLogout = useCallback((expiresInSeconds: number) => {
        if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
        const ms = expiresInSeconds * 1000;
        expiryTimerRef.current = setTimeout(() => {
            clearSession();
            setToken(null);
            setUser(null);
            toast.error('Your session has expired. Please log in again.');
        }, ms);
    }, []);

    // Proactively refresh token before it expires (at 80% of expiry time)
    const scheduleTokenRefresh = useCallback((expiresInSeconds: number) => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        const refreshAt = expiresInSeconds * 1000 * 0.8; // Refresh at 80% of lifetime
        refreshTimerRef.current = setTimeout(async () => {
            const refreshTokenValue = sessionStorage.getItem(REFRESH_TOKEN_KEY);
            if (refreshTokenValue) {
                try {
                    const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken: refreshTokenValue }),
                    });
                    const result = await response.json();
                    if (result.success && result.data.accessToken) {
                        const newToken = result.data.accessToken;
                        const newExpiresIn = result.data.expiresIn ?? 900;
                        setToken(newToken);
                        sessionStorage.setItem(TOKEN_KEY, newToken);
                        const expiryMs = Date.now() + newExpiresIn * 1000;
                        sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryMs));
                        scheduleAutoLogout(newExpiresIn);
                        // Reschedule refresh for the new token
                        scheduleTokenRefresh(newExpiresIn);
                    }
                } catch {
                    // Refresh failed, let the user continue - they'll be logged out when token expires
                }
            }
        }, refreshAt);
    }, [scheduleAutoLogout]);

    useEffect(() => {
        const session = loadSession();
        if (session) {
            setToken(session.token);
            setUser(session.user);

            // Reschedule auto-logout based on remaining time
            const expiryRaw = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
            if (expiryRaw) {
                const remainingSec = Math.max(0, (Number(expiryRaw) - Date.now()) / 1000);
                if (remainingSec > 0) {
                    scheduleAutoLogout(remainingSec);
                    scheduleTokenRefresh(remainingSec);
                }
            }
        }
        setIsLoading(false);

        return () => {
            if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, [scheduleAutoLogout, scheduleTokenRefresh]);

    const login = useCallback(async (email: string, password: string) => {
        // axiosClient interceptor unwraps the envelope — response.data is already AuthResult
        const { data } = await authApi.login(email, password);
        const userData: User = {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            username: data.user.username ?? undefined,
            organizationId: data.user.organizationId,
            profilePictureUrl: data.user.profilePictureUrl ?? null,
        };
        const expiresIn = data.expiresIn ?? 3600;
        setToken(data.accessToken);
        setUser(userData);
        saveSession(data.accessToken, userData, expiresIn, data.refreshToken);
        scheduleAutoLogout(expiresIn);
        scheduleTokenRefresh(expiresIn);
        return { organizationSetupRequired: data.organizationSetupRequired };
    }, [scheduleAutoLogout, scheduleTokenRefresh]);

    const staffLogin = useCallback(async (username: string, password: string) => {
        // axiosClient interceptor unwraps the envelope — response.data is already AuthResult
        const { data } = await authApi.staffLogin(username, password);
        const userData: User = {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            username: data.user.username ?? undefined,
            organizationId: data.user.organizationId,
            profilePictureUrl: data.user.profilePictureUrl ?? null,
        };
        const expiresIn = data.expiresIn ?? 3600;
        setToken(data.accessToken);
        setUser(userData);
        saveSession(data.accessToken, userData, expiresIn, data.refreshToken);
        scheduleAutoLogout(expiresIn);
        scheduleTokenRefresh(expiresIn);
        return { changePasswordRequired: data.changePasswordRequired };
    }, [scheduleAutoLogout, scheduleTokenRefresh]);

    const register = useCallback(async (data: any) => {
        await authApi.register(data);
        toast.success('Registration successful! Please verify your email.');
    }, []);

    const logout = useCallback(() => {
        if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        setToken(null);
        setUser(null);
        clearSession();
    }, []);

    const updateUser = useCallback((updates: Partial<User>) => {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...updates };
            sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const refreshToken = useCallback(async (): Promise<boolean> => {
        const refreshTokenValue = sessionStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshTokenValue) {
            return false;
        }
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: refreshTokenValue }),
            });
            const result = await response.json();
            if (result.success && result.data.accessToken) {
                const newToken = result.data.accessToken;
                const newExpiresIn = result.data.expiresIn ?? 900;
                setToken(newToken);
                sessionStorage.setItem(TOKEN_KEY, newToken);
                const expiryMs = Date.now() + newExpiresIn * 1000;
                sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiryMs));
                scheduleAutoLogout(newExpiresIn);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }, [scheduleAutoLogout]);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                role: user?.role ?? null,
                isAuthenticated: !!token && !!user,
                isLoading,
                login,
                staffLogin,
                register,
                logout,
                updateUser,
                refreshToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
