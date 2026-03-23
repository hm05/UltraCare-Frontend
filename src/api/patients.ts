import axiosClient from './axiosClient';

export const patientsApi = {
    search: (params: { q?: string; phone?: string; caseNumber?: string }) =>
        axiosClient.get('/patients/search', { params }),
    chronology: (patientId: string) => axiosClient.get(`/patients/${patientId}/chronology`),
};
