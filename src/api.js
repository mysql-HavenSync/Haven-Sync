import axios from 'axios';

const api = axios.create({
  baseURL: 'https://haven-sync-production.up.railway.app', // ✅ your live backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
