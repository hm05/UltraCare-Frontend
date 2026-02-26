import client from './client';

export const logsApi = {
    // Fetch organization-specific activity logs securely
    getLogs: () => client.get('/logs'),
};
