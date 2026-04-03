import axiosClient from './axiosClient';

export const contactApi = {
    submit: (data: { name: string; email: string; subject?: string; message: string }) =>
        axiosClient.post('/contact', data),
};
