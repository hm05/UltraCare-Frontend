import axiosClient from './axiosClient';

export const patientsApi = {
    search: (params: { q?: string; phone?: string; caseNumber?: string }) =>
        axiosClient.get('/patients/search', { params }),
    getDetail: (patientId: string) => axiosClient.get(`/patients/${patientId}`),
    chronology: (patientId: string) => axiosClient.get(`/patients/${patientId}/chronology`),
};
