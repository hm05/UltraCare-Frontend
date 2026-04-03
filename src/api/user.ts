import axiosClient from './axiosClient';

export const userApi = {
    me: () => axiosClient.get('/user'),
    profile: () => axiosClient.get('/user'),
    updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) =>
        axiosClient.put('/user', data),
    updateProfilePicture: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'profile-pictures');
        return axiosClient.post('/user/picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};
