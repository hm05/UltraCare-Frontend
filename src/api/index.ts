import client from './client';

export const casesApi = {
    create: (data: any) => client.post('/cases', data),
    edit: (caseId: string, data: any) => client.put(`/cases/${caseId}`, data),
    delete: (caseId: string) => client.delete(`/cases/${caseId}`),
    logVisit: (caseId: string, data: any) => client.post(`/cases/${caseId}/visits`, data),
    createReport: (caseId: string, data: any) => client.post(`/cases/${caseId}/reports`, data),
    getDailyCases: (date?: string) => client.get('/doctor/daily-cases', { params: { date } }),
    exportReportHtml: (caseId: string, reportId: string) =>
        client.get(`/cases/${caseId}/reports/${reportId}/export/html`, { responseType: 'text' }),
    exportReportMd: (caseId: string, reportId: string) =>
        client.get(`/cases/${caseId}/reports/${reportId}/export/md`, { responseType: 'text' }),
    printReport: (caseId: string, reportId: string) =>
        client.get(`/cases/${caseId}/reports/${reportId}/print`, { responseType: 'text' }),
    updateReportImage: (caseId: string, reportId: string, imageUrl: string) =>
        client.patch(`/cases/${caseId}/reports/${reportId}/image`, { imageUrl }),
    updateReportDescription: (caseId: string, reportId: string, description: string) =>
        client.patch(`/cases/${caseId}/reports/${reportId}/description`, { description }),
};

export const patientsApi = {
    search: (params: { q?: string; phone?: string; caseNumber?: string }) =>
        client.get('/patients/search', { params }),
    chronology: (patientId: string) => client.get(`/patients/${patientId}/chronology`),
};

export const dashboardApi = {
    doctor: () => client.get('/dashboard/doctor'),
    staff: () => client.get('/dashboard/staff'),
};

export const collectionApi = {
    get: (params?: { startDate?: string; endDate?: string }) =>
        client.get('/collection', { params }),
    exportPdf: (params?: { startDate?: string; endDate?: string }) =>
        client.get('/collection/export/pdf', { params, responseType: 'text' }),
    exportXlsx: (params?: { startDate?: string; endDate?: string }) =>
        client.get('/collection/export/xlsx', { params, responseType: 'blob' }),
    exportMd: (params?: { startDate?: string; endDate?: string }) =>
        client.get('/collection/export/md', { params, responseType: 'text' }),
    exportModified: (data: { percentage: number; format: string; startDate?: string; endDate?: string }) =>
        client.post('/collection/export/modified', data, {
            responseType: data.format === 'xlsx' ? 'blob' : 'text',
        }),
};

export const referralApi = {
    register: (data: any) => client.post('/referral/doctors', data),
    list: () => client.get('/referral/doctors'),
    getReport: (doctorId: string, params?: { startDate?: string; endDate?: string }) =>
        client.get(`/referral/doctors/${doctorId}/report`, { params }),
    exportDoctorPdf: (doctorId: string, params?: { startDate?: string; endDate?: string }) =>
        client.get(`/referral/doctors/${doctorId}/export/pdf`, { params, responseType: 'text' }),
    exportDashboard: (params?: { format?: string; startDate?: string; endDate?: string }) =>
        client.get('/referral/dashboard/export', { params, responseType: params?.format === 'xlsx' ? 'blob' : 'text' }),
    delete: (doctorId: string) => client.delete(`/referral/doctors/${doctorId}`),
};

export const organizationApi = {
    getInfo: () => client.get('/organization/info'),
    updateInfo: (data: any) => client.put('/organization/info', data),
    getPricing: () => client.get('/organization/settings/pricing'),
    updatePricing: (data: any) => client.put('/organization/settings/pricing', data),
    getDashboard: (params?: { period?: string; date?: string }) =>
        client.get('/organization/dashboard', { params }),
    getTemplates: () => client.get('/organization/templates'),
    upsertTemplate: (reportType: string, templateContent: string) =>
        client.put(`/organization/templates/${reportType}`, { templateContent }),
    listStaff: () => client.get('/organization/staff'),
    deleteStaff: (staffId: string) => client.delete(`/organization/staff/${staffId}`),
};

export const uploadApi = {
    uploadFile: (file: File, reportId?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (reportId) formData.append('reportId', reportId);
        return client.post('/upload/file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    getSignedUrl: (filename: string) => client.get(`/upload/file/${filename}/url`),
    deleteFile: (filename: string) => client.delete(`/upload/file/${filename}/delete`),
    listFiles: () => client.get('/upload/files'),
};

export const contactApi = {
    submit: (data: { name: string; email: string; subject?: string; message: string }) =>
        client.post('/contact', data),
};

export const userApi = {
    me: () => client.get('/me'),
    profile: () => client.get('/profile'),
};
