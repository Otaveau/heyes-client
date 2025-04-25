import { createApiClient } from './apiClient';

// Création d'une instance API pour les opérations sur les propriétaires
const api = createApiClient();

/**
 * Récupère tous les propriétaires
 * @returns {Promise<Array>} Liste des propriétaires formatée
 */
const getAll = async () => {
    const owners = await api.get('/api/owners');
    
    // Formatage des données pour assurer la cohérence
    return owners.map(owner => ({
        id: owner.id,
        ownerId: owner.owner_id,
        name: owner.name,
        teamId: owner.team_id,
        userId: owner.user_id
    }));
};


/**
 * Crée un nouveau propriétaire
 * @param {Object} ownerData - Données du propriétaire à créer
 * @returns {Promise<Object>} Données du propriétaire créé
 */
const create = async (ownerData) => {
    if (!ownerData?.name?.trim()) throw new Error('Nom de propriétaire requis');
    
    return api.post('/api/owners', ownerData);
};

/**
 * Met à jour un propriétaire existant
 * @param {string|number} id - ID du propriétaire
 * @param {Object} ownerData - Nouvelles données du propriétaire
 * @returns {Promise<Object>} Données du propriétaire mis à jour
 */
const update = async (id, ownerData) => {
    if (!id) throw new Error('ID de propriétaire requis');
    if (!ownerData?.name?.trim()) throw new Error('Nom de propriétaire requis');
    
    return api.put(`/api/owners/${id}`, ownerData);
};

/**
 * Supprime un propriétaire
 * @param {string|number} id - ID du propriétaire à supprimer
 * @returns {Promise<Object>} Confirmation de suppression
 */
const remove = async (id) => {
    if (!id) throw new Error('ID de propriétaire requis');
    
    return api.delete(`/api/owners/${id}`);
};

// Création d'un objet de service pour faciliter l'utilisation
const ownerService = {
    getAll,
    create,
    update,
    delete: remove,
    // Maintien de la compatibilité avec l'ancien code
    fetchOwners: getAll,
    createOwner: create,
    updateOwner: update,
    deleteOwner: remove
};

// Export de l'objet de service
export default ownerService;