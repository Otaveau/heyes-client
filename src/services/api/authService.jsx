import { createApiClient } from './apiClient';

// Création d'une instance API spécifique pour l'authentification
const authApi = createApiClient();

/**
 * Valide un token d'authentification
 * @param {string} token - Token JWT à valider
 * @returns {Promise<Object>} Résultat de la validation
 */
export const validateToken = async (token) => {
    if (!token) throw new Error('Token requis');

    // Utilisez une requête POST mais avec un objet vide comme corps
    // pour éviter l'erreur de parsing JSON
    return authApi.post('/api/auth/validate', {}, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
};

/**
 * Authentifie un utilisateur
 * @param {Object} credentials - Identifiants de connexion
 * @param {string} credentials.name - Nom d'utilisateur
 * @param {string} credentials.password - Mot de passe
 * @returns {Promise<Object>} Données utilisateur et token d'authentification
 */
export const login = async (credentials) => {
    if (!credentials?.name || !credentials?.password) {
        throw new Error('Nom et mot de passe requis');
    }

    return authApi.post('/api/auth/login', {
        name: credentials.name,
        password: credentials.password
    });
};

/**
 * Enregistre un nouvel utilisateur
 * @param {Object} userData - Données utilisateur
 * @param {string} userData.name - Nom d'utilisateur
 * @param {string} userData.password - Mot de passe
 * @returns {Promise<Object>} Données utilisateur créé et token d'authentification
 */
export const register = async (userData) => {
    if (!userData?.name || !userData?.password) {
        throw new Error('Nom et mot de passe requis');
    }

    return authApi.post('/api/auth/register', {
        name: userData.name,
        password: userData.password
    });
};

/**
 * Déconnecte l'utilisateur actuel
 * @returns {void}
 */
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
};

/**
 * Récupère l'utilisateur actuel à partir du token stocké
 * @returns {Promise<Object|null>} Données utilisateur ou null si non authentifié
 */
export const getCurrentUser = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        return null;
    }
    
    try {
        // Valide le token et récupère les données utilisateur
        const userData = await validateToken(token);
        return userData;
    } catch (error) {
        // En cas d'erreur d'authentification, on nettoie le stockage
        if (error.status === 401) {
            logout();
        }
        return null;
    }
};

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns {boolean} True si l'utilisateur est authentifié
 */
export const isAuthenticated = () => {
    return !!localStorage.getItem('token');
};

// Création d'un objet de service pour faciliter l'utilisation
const authService = {
    login,
    register,
    logout,
    validateToken,
    getCurrentUser,
    isAuthenticated
};

// Export de l'objet de service
export default authService;