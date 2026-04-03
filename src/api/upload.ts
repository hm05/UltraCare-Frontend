import axiosClient from './axiosClient';

export const uploadApi = {
    uploadFile: (file: File, reportId?: string) => {
        const formData = new FormData();
        formData.append('file', file);
        if (reportId) formData.append('reportId', reportId);
        return axiosClient.post('/upload/file', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    getSignedUrl: (filename: string) => axiosClient.get(`/upload/${filename}`),
    getSignedUrlForFile: (fileUrl: string) => axiosClient.get('/upload/signed-url', { params: { url: fileUrl } }),
    deleteFile: (filename: string) => axiosClient.delete(`/upload/${filename}`),
    listFiles: () => axiosClient.get('/upload/file'),
};
