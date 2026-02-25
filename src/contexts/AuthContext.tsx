import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import toast from 'react-hot-toast';

interface User {
    id: string;
    email: string;
    role: 'doctor' | 'staff' | 'admin';
    firstName: string;
    lastName: string;
    organizationId: string | null;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ organizationSetupRequired?: boolean }>;
    staffLogin: (username: string, password: string) => Promise<{ changePasswordRequired?: boolean }>;
    register: (data: any) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem('accessToken');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem('user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const { data } = await authApi.login(email, password);
        const userData: User = {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            organizationId: data.user.organizationId,
        };
        setToken(data.accessToken);
        setUser(userData);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        return { organizationSetupRequired: data.organizationSetupRequired };
    }, []);

    const staffLogin = useCallback(async (username: string, password: string) => {
        const { data } = await authApi.staffLogin(username, password);
        const userData: User = {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            organizationId: data.user.organizationId,
        };
        setToken(data.accessToken);
        setUser(userData);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        return { changePasswordRequired: data.changePasswordRequired };
    }, []);

    const register = useCallback(async (data: any) => {
        await authApi.register(data);
        toast.success('Registration successful! Please verify your email.');
    }, []);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token && !!user,
                isLoading,
                login,
                staffLogin,
                register,
                logout,
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
