import { createApiClient } from './apiClient';

// Création d'une instance API pour les opérations sur les équipes
const api = createApiClient();

/**
 * Valide les données d'équipe avant envoi au serveur
 * @param {Object} teamData - Données d'équipe à valider
 * @throws {Error} Si les données sont invalides
 */
const validateTeamData = (teamData) => {
    if (!teamData) throw new Error('Données d\'équipe requises');
    if (!teamData.name?.trim()) throw new Error('Nom d\'équipe requis');
};

/**
 * Récupère toutes les équipes
 * @returns {Promise<Array>} Liste des équipes
 */
const getAll = async () => {
    return api.get('/api/teams');
};

/**
 * Récupère une équipe par son ID
 * @param {string|number} id - ID de l'équipe
 * @returns {Promise<Object>} Données de l'équipe
 */
const getById = async (id) => {
    if (!id) throw new Error('ID d\'équipe requis');
    
    return api.get(`/api/teams/${id}`);
};

/**
 * Crée une nouvelle équipe
 * @param {Object} teamData - Données de l'équipe à créer
 * @param {string} teamData.name - Nom de l'équipe
 * @param {string} [teamData.color] - Couleur de l'équipe (code hexadécimal)
 * @returns {Promise<Object>} Données de l'équipe créée
 */
const create = async (teamData) => {
    validateTeamData(teamData);
    
    return api.post('/api/teams', {
        name: teamData.name.trim(),
        color: teamData.color
    });
};

/**
 * Met à jour une équipe existante
 * @param {string|number} id - ID de l'équipe
 * @param {Object} teamData - Nouvelles données de l'équipe
 * @param {string} teamData.name - Nom de l'équipe
 * @param {string} [teamData.color] - Couleur de l'équipe (code hexadécimal)
 * @returns {Promise<Object>} Données de l'équipe mise à jour
 */
const update = async (id, teamData) => {
    if (!id) throw new Error('ID d\'équipe requis');
    validateTeamData(teamData);
    
    return api.put(`/api/teams/${id}`, {
        name: teamData.name.trim(),
        color: teamData.color
    });
};

/**
 * Supprime une équipe
 * @param {string|number} id - ID de l'équipe à supprimer
 * @returns {Promise<Object>} Confirmation de suppression
 */
const remove = async (id) => {
    if (!id) throw new Error('ID d\'équipe requis');
    
    return api.delete(`/api/teams/${id}`);
};

// Création d'un objet de service pour faciliter l'utilisation
const teamService = {
    getAll,
    getById,
    create,
    update,
    delete: remove,
    // Maintien de la compatibilité avec l'ancien code
    fetchTeams: getAll,
    createTeam: create,
    updateTeam: update,
    deleteTeam: remove
};

// Export de l'objet de service
export default teamService;