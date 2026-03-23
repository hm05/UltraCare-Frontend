import axiosClient from './axiosClient';

export const collectionApi = {
    get: (params?: { startDate?: string; endDate?: string }) =>
        axiosClient.get('/collection', { params }),
    exportPdf: (params?: { startDate?: string; endDate?: string }) =>
        axiosClient.get('/collection/export/pdf', { params, responseType: 'text' }),
    exportXlsx: (params?: { startDate?: string; endDate?: string }) =>
        axiosClient.get('/collection/export/xlsx', { params, responseType: 'blob' }),
    exportMd: (params?: { startDate?: string; endDate?: string }) =>
        axiosClient.get('/collection/export/md', { params, responseType: 'text' }),
    exportModified: (data: { percentage: number; format: string; startDate?: string; endDate?: string }) =>
        axiosClient.post('/collection/export/modified', data, {
            responseType: data.format === 'xlsx' ? 'blob' : 'text',
        }),
};
