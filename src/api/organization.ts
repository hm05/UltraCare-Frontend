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
    listStaff: () => axiosClient.get('/organization/staff'),
    deleteStaff: (staffId: string) => axiosClient.delete(`/organization/staff/${staffId}`),
};
