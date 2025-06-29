// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://haven-sync-production.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
