// src/api.js
import axios from 'axios';

// Set base to your Django root (NOT /api) so media URLs resolve correctly.
// Change 127.0.0.1 to your machine IP if testing on a phone.
const API_BASE_URL = 'http://127.0.0.1:8000/api';


const api = axios.create({
  baseURL: API_BASE_URL,
  // You can set default headers here if needed (auth, etc.)
});

export default api;
