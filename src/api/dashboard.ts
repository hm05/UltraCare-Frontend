import axiosClient from './axiosClient';

export const dashboardApi = {
    doctor: () => axiosClient.get('/dashboard/doctor'),
    staff: () => axiosClient.get('/dashboard/staff'),
};
