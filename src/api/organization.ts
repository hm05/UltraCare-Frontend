import axiosClient from './axiosClient';

export const organizationApi = {
    getInfo: () => axiosClient.get('/organization/info'),
    updateInfo: (data: any) => axiosClient.put('/organization/info', data),
    getPricing: () => axiosClient.get('/organization/settings/pricing'),
    updatePricing: (data: any) => axiosClient.put('/organization/settings/pricing', data),
    getDashboard: (params?: { period?: string; date?: string }) =>
        axiosClient.get('/organization/dashboard', { params }),
    getTemplates: () => axiosClient.get('/organization/templates'),
    upsertTemplate: (reportType: string, templateContent: string) =>
        axiosClient.put(`/organization/templates/${reportType}`, { templateContent }),
    listUsers: () => axiosClient.get('/organization/users'),
    deleteUser: (userId: string) => axiosClient.delete(`/organization/users/${userId}`),
    
    // HR Staff API
    getHRStaffList: (params?: { month?: number; year?: number }) => axiosClient.get('/organization/staff', { params }),
    getHRStaffDetail: (staffId: string) => axiosClient.get(`/organization/staff/${staffId}`),
    createHRStaff: (data: any) => axiosClient.post('/organization/staff', data),
    updateHRStaff: (staffId: string, data: any) => axiosClient.put(`/organization/staff/${staffId}`, data),
    deleteHRStaff: (staffId: string) => axiosClient.delete(`/organization/staff/${staffId}`),
    markStaffAbsent: (staffId: string, date: string) => axiosClient.post(`/organization/staff/${staffId}/absent`, { date }),
};
