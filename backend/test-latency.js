const axios = require('axios');

async function test() {
    const api = axios.create({ baseURL: 'http://localhost:5000/api' });
    
    console.log("Logging in...");
    const loginRes = await api.post('/auth/login', {
        email: 'doctor1@gmail.com',
        password: 'password123'
    });
    
    const token = loginRes.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    const endpoints = [
        '/doctor/dashboard/stats',
        '/doctor/dashboard/charts',
        '/doctor/profile',
        '/doctor/schedules',
        '/doctor/appointments',
        '/doctor/patients',
        '/doctor/statistics'
    ];
    
    for (const ep of endpoints) {
        const start = Date.now();
        try {
            await api.get(ep);
            console.log(`[OK] ${ep}: ${Date.now() - start}ms`);
        } catch (err) {
            console.log(`[ERR] ${ep}: ${Date.now() - start}ms - ${err.response?.status}`);
        }
    }
}

test();
