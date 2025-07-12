import axios from 'axios';

const api = axios.create({
  baseURL: 'https://havensync.hexahavenintegrations.com', // ✅ your live backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
