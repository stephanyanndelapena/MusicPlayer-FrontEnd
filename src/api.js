import axios from 'axios';

// Replace with your machine IP and port where django runs
const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;