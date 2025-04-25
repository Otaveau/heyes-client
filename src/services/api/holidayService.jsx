import { createApiClient } from './apiClient';

// Création d'une instance API spécifique
const externalApi = createApiClient();

/**
 * Récupère les jours fériés français pour une année donnée
 * @param {number|string} year - L'année pour laquelle récupérer les jours fériés
 * @returns {Promise<Object>} Un objet contenant les jours fériés avec date et nom
 */
export const fetchHolidays = async (year) => {
    if (!year || isNaN(year)) {
        throw new Error('Année invalide');
    }

    // Utilisation d'une URL complète qui sera reconnue comme externe par le client API
    return externalApi.get(`https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`, {
        headers: { Accept: 'application/json' }
    });
};

const holidaysService = {
    fetchHolidays,
};

// Export de l'objet de service
export default holidaysService;