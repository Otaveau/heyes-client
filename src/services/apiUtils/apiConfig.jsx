import { REQUEST_TIMEOUT } from "../../constants/constants";

// Déterminer l'URL de base de l'API en fonction de l'environnement
const getApiBaseUrl = () => {
    // En production (Vercel)
    if (process.env.NODE_ENV === 'production') {
      return 'https://heyes-server.vercel.app';
    }
    // En développement local
    return 'http://localhost:5000';
  };

export const API_BASE_URL = getApiBaseUrl();

export const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    // Utiliser l'URL complète si elle commence par http, sinon ajouter l'URL de base
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    
    try {
        console.log(`Fetching: ${fullUrl}`);
        const response = await fetch(fullUrl, {
            ...options,
            signal: controller.signal
        });
        return response;
    } catch (error) {
        console.error(`Fetch error for ${fullUrl}:`, error);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
};

export const getAuthHeaders = () => {
    try {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        return headers;
    } catch (error) {
        console.error('Erreur d\'accès au stockage:', error);
        return { 'Content-Type': 'application/json' };
    }
};


