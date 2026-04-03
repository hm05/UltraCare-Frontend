import axiosClient from './axiosClient';

export const referralApi = {
    register: (data: any) => axiosClient.post('/referral/doctors', data),
    list: () => axiosClient.get('/referral/doctors'),
    getReport: (doctorId: string, params?: { startDate?: string; endDate?: string }) =>
        axiosClient.get(`/referral/doctors/${doctorId}/report`, { params }),
    exportDoctorPdf: (doctorId: string, params?: { startDate?: string; endDate?: string }) =>
        axiosClient.get(`/referral/doctors/${doctorId}/export/pdf`, { params, responseType: 'text' }),
    exportDashboard: (params?: { format?: string; startDate?: string; endDate?: string }) =>
        axiosClient.get('/referral/dashboard/export', { params, responseType: params?.format === 'xlsx' ? 'blob' : 'text' }),
    delete: (doctorId: string) => axiosClient.delete(`/referral/doctors/${doctorId}`),
};
