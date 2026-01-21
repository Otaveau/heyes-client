import { REQUEST_TIMEOUT } from "../../constants/constants";

// Déterminer l'URL de base de l'API en fonction de l'environnement
const getApiBaseUrl = () => {
    // En production (Vercel)
    if (process.env.NODE_ENV === 'production') {
      return 'https://heyes-server.vercel.app'; // Assurez-vous qu'il n'y a PAS de slash à la fin
    }
    // En développement local
    return 'http://localhost:5000'; // Assurez-vous qu'il n'y a PAS de slash à la fin
  };
  
  export const API_BASE_URL = getApiBaseUrl();
  
  export const fetchWithTimeout = async (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      // Assurer que l'URL commence par un slash si ce n'est pas une URL complète
      const normalizedUrl = url.startsWith('http') 
          ? url 
          : url.startsWith('/') 
              ? `${API_BASE_URL}${url}` 
              : `${API_BASE_URL}/${url}`;
      
      try {
          const response = await fetch(normalizedUrl, {
              ...options,
              signal: controller.signal
          });
          return response;
      } catch (error) {
          console.error(`Fetch error for ${normalizedUrl}:`, error);
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


