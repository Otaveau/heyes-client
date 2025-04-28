import { createApiClient } from './apiClient';
import { ERROR_MESSAGES } from '../constants/constants';

// Création d'une instance API pour les opérations sur les tâches
const api = createApiClient();

/**
 * Transforme les données de tâche pour l'envoi au serveur
 * @param {Object} taskData - Données de la tâche à transformer
 * @returns {Object} Données formatées pour le serveur
 */
const transformTaskForServer = (taskData) => {
    const statusId = taskData.statusId || taskData.extendedProps?.statusId;
    let startDate = taskData.start || taskData.startDate;
    let endDate;
    const isNewTask = !taskData.id;

    // Prioriser extendedProps.inclusiveEndDate quelle que soit la situation (nouvelle tâche ou mise à jour)
    if (taskData.extendedProps?.inclusiveEndDate) {
        endDate = taskData.extendedProps.inclusiveEndDate;
    } 
    // Si pas d'inclusiveEndDate, traiter selon création ou modification
    else if (isNewTask) {
        // Pour les nouvelles tâches sans inclusiveEndDate explicite
        if (taskData.endDate) {
            // Si on a endDate, l'utiliser directement (supposé être inclusive)
            endDate = taskData.endDate;
        } else if (taskData.end) {
            // Si on a seulement end, convertir de exclusive à inclusive
            const endDateObj = new Date(taskData.end);
            endDateObj.setDate(endDateObj.getDate() - 1);
            endDate = endDateObj;
        }
    } else {
        // Pour les mises à jour sans inclusiveEndDate explicite
        if (taskData.end_date) {
            endDate = taskData.end_date;
        } else if (taskData.end) {
            const endDateObj = new Date(taskData.end);
            endDateObj.setDate(endDateObj.getDate() - 1);
            endDate = endDateObj;
        }
    }
    
    // Convertir en format ISO si nécessaire
    if (endDate instanceof Date) {
        endDate = endDate.toISOString().split('T')[0];
    }

    return {
        title: taskData.title.trim(),
        startDate: startDate,
        endDate: endDate,
        description: taskData.description?.trim() || '',
        ownerId: taskData.resourceId ? parseInt(taskData.resourceId, 10) : null,
        statusId: statusId
    };
};

/**
 * Transforme la réponse du serveur en objet de tâche pour le client
 * @param {Object} serverResponse - Données de tâche reçues du serveur
 * @returns {Object|null} Tâche formatée pour le client ou null si données invalides
 */
const transformServerResponseToTask = (serverResponse) => {
    if (!serverResponse || typeof serverResponse !== 'object') {
        console.warn('Données invalides reçues pour transformation de tâche');
        return null;
    }

    const normalizeDate = (dateString) => {
        if (!dateString) return null;
        try {
            // Convertir en date UTC à minuit
            const date = new Date(dateString);
            const normalizedDate = new Date(
                Date.UTC(
                    date.getFullYear(), 
                    date.getMonth(), 
                    date.getDate()
                )
            );
            
            return normalizedDate.toISOString().split('T')[0];
        } catch (error) {
            console.warn('Erreur de conversion de date:', error);
            return null;
        }
    };

    // Normaliser les dates inclusives du serveur
    const inclusiveStartDate = normalizeDate(serverResponse.start_date);
    const inclusiveEndDate = normalizeDate(serverResponse.end_date);
    
    // Calculer la date de fin exclusive pour FullCalendar
    let exclusiveEndDate = null;
    if (inclusiveEndDate) {
        const endDate = new Date(inclusiveEndDate);
        endDate.setDate(endDate.getDate() + 1);
        exclusiveEndDate = endDate.toISOString().split('T')[0];
    }

    return {
        id: serverResponse.id || null,
        title: serverResponse.title?.trim() || 'Tâche sans titre',
        start: inclusiveStartDate,
        end: exclusiveEndDate,
        start_date: inclusiveStartDate,
        end_date: inclusiveEndDate,
        exclusiveEndDate: exclusiveEndDate,
        owner_id: serverResponse.owner_id || serverResponse.ownerId || null,
        allDay: true,
        extendedProps: {
            statusId: serverResponse.status_id 
                || serverResponse.statusId 
                ? String(serverResponse.status_id || serverResponse.statusId) 
                : null,
            userId: serverResponse.user_id || serverResponse.userId || null,
            description: serverResponse.description?.trim() || '',
            ownerName: serverResponse.owner_name || null,
            statusType: serverResponse.status_type || null,
            teamName: serverResponse.team_name || null,
            inclusiveEndDate: inclusiveEndDate
        }
    };
};

/**
 * Valide les données de tâche avant envoi au serveur
 * @param {Object} taskData - Données de tâche à valider
 * @throws {Error} Si les données sont invalides
 */
const validateTaskData = (taskData) => {
    if (!taskData) throw new Error(ERROR_MESSAGES.TASK_DATA_REQUIRED);
    if (!taskData.title?.trim()) throw new Error(ERROR_MESSAGES.TITLE_REQUIRED);
    
    // Validation des dates avec gestion des formats ISO
    // Si nous avons une exclusiveEndDate, nous l'utiliserons pour la validation
    let startDate = taskData.startDate || taskData.start;
    let endDate;
    
    if (taskData.exclusiveEndDate) {
        // Si nous avons une exclusiveEndDate, nous l'utilisons telle quelle pour la validation
        endDate = taskData.exclusiveEndDate;
    } else {
        // Sinon, nous utilisons la date de fin traditionnelle
        endDate = taskData.endDate || taskData.end;
    }
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error(ERROR_MESSAGES.INVALID_DATE_FORMAT);
        }
        
        if (end < start) {
            throw new Error(ERROR_MESSAGES.END_DATE_AFTER_START);
        }
    }
};

/**
 * Récupère toutes les tâches
 * @returns {Promise<Array>} Liste des tâches formatée
 */
const getAll = async () => {
    const dataFromServer = await api.get('/api/tasks');
    return dataFromServer.map(transformServerResponseToTask).filter(Boolean);
};

/**
 * Récupère une tâche par son ID
 * @param {string|number} id - ID de la tâche
 * @returns {Promise<Object>} Tâche formatée
 */
const getById = async (id) => {
    if (!id) throw new Error(ERROR_MESSAGES.TASK_ID_REQUIRED);
    
    const dataFromServer = await api.get(`/api/tasks/${id}`);
    return transformServerResponseToTask(dataFromServer);
};

/**
 * Crée une nouvelle tâche
 * @param {Object} taskData - Données de la tâche à créer
 * @returns {Promise<Object>} Tâche créée et formatée
 */
const create = async (taskData) => {
    validateTaskData(taskData);
    const dataToServer = transformTaskForServer(taskData);
    
    const dataFromServer = await api.post('/api/tasks', dataToServer);
    return transformServerResponseToTask(dataFromServer);
};

/**
 * Met à jour une tâche existante
 * @param {string|number} id - ID de la tâche
 * @param {Object} taskData - Nouvelles données de la tâche
 * @returns {Promise<Object>} Tâche mise à jour et formatée
 */
const update = async (id, taskData) => {
    validateTaskData(taskData);
    const taskId = parseInt(id);
    if (isNaN(taskId)) throw new Error(ERROR_MESSAGES.TASK_ID_REQUIRED);
    
    const dataToServer = transformTaskForServer(taskData);
    
    const dataFromServer = await api.put(`/api/tasks/${taskId}`, dataToServer);
    return transformServerResponseToTask(dataFromServer);
};

/**
 * Supprime une tâche
 * @param {string|number} id - ID de la tâche à supprimer
 * @returns {Promise<Object>} Confirmation de suppression
 */
const remove = async (id) => {
    if (!id) throw new Error(ERROR_MESSAGES.TASK_ID_REQUIRED);
    
    return api.delete(`/api/tasks/${id}`);
};

// Création d'un objet de service pour faciliter l'utilisation
const taskService = {
    getAll,
    getById,
    create,
    update,
    delete: remove,
    // Maintien de la compatibilité avec l'ancien code
    fetchTasks: getAll,
    createTask: create,
    updateTask: update,
    deleteTask: remove,
    // Expose les fonctions utilitaires pour utilisation externe si nécessaire
    transformTaskForServer,
    transformServerResponseToTask,
    validateTaskData
};

// Export de l'objet de service
export default taskService;
