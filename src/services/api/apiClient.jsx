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

// Classe de base pour toutes les erreurs API
class ApiError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = this.constructor.name;
        this.status = status;
        this.data = data;
        
        // Capture de la stack trace pour un meilleur debugging
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

// Erreurs spécifiques par code HTTP
class AuthenticationError extends ApiError {
    constructor(message = 'Session expirée', data = null) {
        super(message, 401, data);
    }
}

class ForbiddenError extends ApiError {
    constructor(message = 'Accès refusé', data = null) {
        super(message, 403, data);
    }
}

class NotFoundError extends ApiError {
    constructor(message = 'Ressource non trouvée', data = null) {
        super(message, 404, data);
    }
}

class ValidationError extends ApiError {
    constructor(message = 'Données invalides', data = null) {
        super(message, 422, data);
    }
}

class ServerError extends ApiError {
    constructor(message = 'Erreur serveur', data = null) {
        super(message, 500, data);
    }
}

class NetworkError extends ApiError {
    constructor(message = 'Problème de connexion réseau', data = null) {
        super(message, 0, data);
    }
}

// Map des codes d'erreurs vers les classes d'erreurs correspondantes
const ERROR_CLASSES = {
    400: (message, data) => new ApiError(message || 'Requête invalide', 400, data),
    401: (message, data) => new AuthenticationError(message, data),
    403: (message, data) => new ForbiddenError(message, data),
    404: (message, data) => new NotFoundError(message, data),
    422: (message, data) => new ValidationError(message, data),
    500: (message, data) => new ServerError(message, data),
    502: (message, data) => new ServerError('Service temporairement indisponible', data),
    503: (message, data) => new ServerError('Service temporairement indisponible', data),
    504: (message, data) => new ServerError('Délai d\'attente dépassé', data),
};

// Actions spécifiques à exécuter en cas d'erreur
const ERROR_ACTIONS = {
    401: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Utilisation d'un timeout pour permettre à la promesse d'être rejetée d'abord
        setTimeout(() => window.location.href = '/login', 0);
    }
};

/**
 * Gère les réponses de l'API et traite les erreurs de manière appropriée
 * @param {Response} response - L'objet Response de fetch
 * @param {Object} options - Options de traitement
 * @param {boolean} options.throwError - Si true, lance l'erreur; sinon, la retourne
 * @param {Function} options.onError - Callback appelé en cas d'erreur
 * @returns {Promise<any>} Données de la réponse ou erreur
 */
export const handleResponse = async (response, options = {}) => {
    const { throwError = true, onError } = options;
    
    try {
        if (!response.ok) {
            let errorData = null;
            let errorMessage = 'Erreur API';
            
            // Extraction des données d'erreur
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const jsonData = await response.json();
                    errorData = jsonData;
                    errorMessage = jsonData.message || jsonData.error || errorMessage;
                } else {
                    const textData = await response.text();
                    if (textData) {
                        errorMessage = textData;
                    }
                }
            } catch (e) {
                console.warn('Impossible de parser la réponse d\'erreur', e);
            }
            
            // Création de l'erreur appropriée
            const errorCreator = ERROR_CLASSES[response.status] || 
                ((msg, data) => new ApiError(msg, response.status, data));
            const error = errorCreator(errorMessage, errorData);
            
            // Exécution de l'action spécifique au code d'erreur
            const action = ERROR_ACTIONS[response.status];
            if (action) {
                action();
            }
            
            // Exécution du callback d'erreur personnalisé si fourni
            if (onError && typeof onError === 'function') {
                onError(error);
            }
            
            if (throwError) {
                throw error;
            } else {
                return { error };
            }
        }
        
        // Traitement des réponses réussies
        const contentType = response.headers.get('content-type');
        
        // Réponse vide (204 No Content)
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return { success: true };
        }
        
        // Réponse JSON
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        }
        
        // Réponse texte
        if (contentType && contentType.includes('text/')) {
            const text = await response.text();
            return { text, success: true };
        }
        
        // Autres types de réponses (binaires, etc.)
        return { success: true, response };
        
    } catch (error) {
        // Gestion des erreurs de réseau (non liées à une réponse HTTP)
        if (!(error instanceof ApiError)) {
            const networkError = new NetworkError(error.message);
            
            if (onError && typeof onError === 'function') {
                onError(networkError);
            }
            
            if (throwError) {
                throw networkError;
            } else {
                return { error: networkError };
            }
        }
        
        if (throwError) {
            throw error;
        } else {
            return { error };
        }
    }
};

/**
 * Récupère les en-têtes d'authentification
 * @returns {Object} En-têtes HTTP avec token si disponible
 */
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

/**
 * Effectue un fetch avec timeout
 * @param {string} url - URL de la requête
 * @param {Object} options - Options fetch
 * @returns {Promise<Response>} Réponse de fetch
 */
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
            signal: options.signal || controller.signal
        });
        return response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new NetworkError('La requête a expiré', { timeout: REQUEST_TIMEOUT });
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
};

// Utilitaire pour créer des requêtes API avec la gestion d'erreur intégrée
export const createApiClient = (baseUrl = API_BASE_URL, defaultOptions = {}) => {
    const apiRequest = async (url, options = {}) => {
        try {
            // Fusion des options par défaut avec les options spécifiques
            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...getAuthHeaders(),
                    ...(defaultOptions.headers || {}),
                    ...(options.headers || {})
                }
            };
            
            // Utilisation de fetchWithTimeout pour gérer les timeouts
            const response = await fetchWithTimeout(url, mergedOptions);
            
            return handleResponse(response, options.responseOptions || {});
        } catch (error) {
            // Si c'est déjà une ApiError, on la transmet
            if (error instanceof ApiError) {
                if (options.responseOptions?.throwError === false) {
                    return { error };
                }
                throw error;
            }
            
            // Sinon on crée une NetworkError
            const networkError = new NetworkError(error.message, error);
            
            if (options.responseOptions?.throwError === false) {
                return { error: networkError };
            }
            throw networkError;
        }
    };
    
    return {
        get: (url, options = {}) => apiRequest(url, { method: 'GET', ...options }),
        post: (url, data, options = {}) => apiRequest(url, { 
            method: 'POST', 
            body: JSON.stringify(data),
            ...options 
        }),
        put: (url, data, options = {}) => apiRequest(url, { 
            method: 'PUT', 
            body: JSON.stringify(data),
            ...options 
        }),
        patch: (url, data, options = {}) => apiRequest(url, { 
            method: 'PATCH', 
            body: JSON.stringify(data),
            ...options 
        }),
        delete: (url, options = {}) => apiRequest(url, { method: 'DELETE', ...options }),
    };
};

// Exportation de toutes les classes d'erreur
export {
    ApiError,
    AuthenticationError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
    ServerError,
    NetworkError
};