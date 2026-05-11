import axiosClient from './axiosClient';

export const casesApi = {
    create: (data: any) => axiosClient.post('/cases', data),
    list: (params?: { q?: string; page?: number; limit?: number; patientId?: string }) =>
        axiosClient.get('/cases', { params }),
    getDetail: (caseId: string) => axiosClient.get(`/cases/${caseId}`),
    edit: (caseId: string, data: any) => axiosClient.put(`/cases/${caseId}`, data),
    delete: (caseId: string) => axiosClient.delete(`/cases/${caseId}`),
    logVisit: (caseId: string, data: any) => axiosClient.post(`/cases/${caseId}/visits`, data),
    // Text reports (from templates)
    createReport: (caseId: string, data: any) => axiosClient.post(`/cases/${caseId}/reports`, data),
    deleteReport: (caseId: string, reportId: string) => axiosClient.delete(`/cases/${caseId}/reports/${reportId}`),
    // Uploaded file documents
    createDocument: (caseId: string, data: any) => axiosClient.post(`/cases/${caseId}/documents`, data),
    deleteDocument: (caseId: string, documentId: string) => axiosClient.delete(`/cases/${caseId}/documents/${documentId}`),
    // Daily cases for doctor dashboard
    getDailyCases: (date?: string) => axiosClient.get('/cases/today', { params: { date } }),
    getDailyRevisits: (date?: string) => axiosClient.get('/cases/revisits/daily', { params: { date } }),
    // Export / print
    exportReportHtml: (caseId: string, reportId: string) =>
        axiosClient.get(`/cases/${caseId}/reports/${reportId}/export/html`, { responseType: 'text' }),
    exportReportMd: (caseId: string, reportId: string) =>
        axiosClient.get(`/cases/${caseId}/reports/${reportId}/export/md`, { responseType: 'text' }),
    emailReport: (caseId: string, reportId: string, email: string, selectedReportIds?: string[], includeSignedUrls?: boolean) =>
        axiosClient.post(`/cases/${caseId}/reports/${reportId}/email`, { email, selectedReportIds, includeSignedUrls }),
    printReport: (caseId: string, reportId: string) =>
        axiosClient.get(`/cases/${caseId}/reports/${reportId}/print`, { responseType: 'text' }),
    exportFormF: (caseId: string) =>
        axiosClient.get(`/cases/${caseId}/form-f`, { responseType: 'text' }),
    updateReportImage: (caseId: string, reportId: string, imageUrl: string) =>
        axiosClient.patch(`/cases/${caseId}/reports/${reportId}/image`, { imageUrl }),
    updateReportDescription: (caseId: string, reportId: string, description: string) =>
        axiosClient.patch(`/cases/${caseId}/reports/${reportId}/description`, { description }),
};
