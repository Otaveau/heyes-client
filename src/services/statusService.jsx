import { createApiClient } from './apiClient';

// Création d'une instance API pour les opérations sur les statuts
const api = createApiClient();

/**
 * Récupère tous les statuts
 * @returns {Promise<Array>} Liste des statuts formatée
 */
const getAll = async () => {
    const statuses = await api.get('/api/status');
    
    // Formatage des données pour assurer la cohérence
    return statuses.map(status => ({
        id: status.id,
        statusId: status.status_id,
        statusType: status.status_type,
    }));
};

// Création d'un objet de service pour faciliter l'utilisation
const statusService = {
    getAll,
    // Maintien de la compatibilité avec l'ancien code
    fetchStatuses: getAll
};

// Export de l'objet de service
export default statusService;

// Export de la fonction individuelle pour une compatibilité avec l'ancien code
export const fetchStatuses = getAll;