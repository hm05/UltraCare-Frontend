import client from './client';

export const authApi = {
    login: (email: string, password: string) =>
        client.post('/login', { email, password }),

    register: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
    }) => client.post('/register', data),

    staffLogin: (username: string, password: string) =>
        client.post('/staff/login', { username, password }),

    setupOrganization: (data: {
        organizationName: string;
        organizationAddress?: string;
        organizationPhone?: string;
        organizationEmail?: string;
        registrationNumber?: string;
        website?: string;
        pricing?: {
            sonographyPrice?: number;
            obsSonographyPrice?: number;
            ctPrice?: number;
            mriPrice?: number;
            xrayPrice?: number;
            defaultPrice?: number;
        };
    }) => client.post('/organization/setup', data),

    createStaff: (data: {
        username: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        salary?: number;
        changePasswordOnLogin?: boolean;
    }) => client.post('/staff/create', data),

    forgotPassword: (email: string) =>
        client.post('/staff/forgot-password', { email }),

    resetPassword: (userId: string, newPassword: string, confirmPassword: string) =>
        client.post('/admin/reset-password', { userId, newPassword, confirmPassword }),
};
