import axiosClient from './axiosClient';

export const logsApi = {
    list: () => axiosClient.get('/logs'),
};
