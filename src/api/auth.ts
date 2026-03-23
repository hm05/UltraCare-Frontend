import axiosClient from './axiosClient';

export const authApi = {
    login: (email: string, password: string) =>
        axiosClient.post('/auth/doctor-login', { email, password }),
    register: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
    }) => axiosClient.post('/auth/doctor-register', data),
    staffLogin: (username: string, password: string) =>
        axiosClient.post('/auth/staff-login', { username, password }),
    setupOrganization: (data: {
        organizationName: string;
        organizationAddress?: string;
        organizationPhone?: string;
        organizationEmail?: string;
        registrationNumber?: string;
        website?: string;
        logoUrl?: string;
        pricing?: {
            sonographyPrice?: number;
            obsSonographyPrice?: number;
            ctPrice?: number;
            mriPrice?: number;
            xrayPrice?: number;
            defaultPrice?: number;
        };
    }) => axiosClient.post('/organization/setup', data),
    createStaff: (data: {
        username: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        salary?: number;
        changePasswordOnLogin?: boolean;
    }) => axiosClient.post('/organization/staff', data),
    forgotPassword: (email: string) =>
        axiosClient.post('/auth/staff-forgot-password', { email }),
    resetPassword: (userId: string, newPassword: string, confirmPassword: string) =>
        axiosClient.post('/auth/admin-reset-password', { userId, newPassword, confirmPassword }),
};
