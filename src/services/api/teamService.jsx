import { fetchWithTimeout, getAuthHeaders } from '../apiUtils/apiConfig';
import { handleResponse } from '../apiUtils/errorHandlers';

const validateTeamData = (teamData) => {
    if (!teamData) throw new Error('Données d\'équipe requises');
    if (!teamData.name?.trim()) throw new Error('Nom d\'équipe requis');
};

export const fetchTeams = async () => {
    try {
        // Utiliser directement le chemin sans API_URL
        const response = await fetchWithTimeout('/api/teams', {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la récupération des équipes:', error);
        throw error;
    }
};

export const getTeamById = async (id) => {
    try {
        if (!id) throw new Error('ID d\'équipe requis');

        const response = await fetchWithTimeout(`/api/teams/${id}`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'équipe:', error);
        throw error;
    }
};

export const createTeam = async (teamData) => {
    try {
        validateTeamData(teamData);

        const response = await fetchWithTimeout(`/api/teams`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                name: teamData.name.trim(),
                description: teamData.description?.trim() || ''
            })
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la création de l\'équipe:', error);
        throw error;
    }
};

export const updateTeam = async (id, teamData) => {
    try {
        if (!id) throw new Error('ID d\'équipe requis');
        validateTeamData(teamData);

        const response = await fetchWithTimeout(`/api/teams/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                name: teamData.name.trim(),
                description: teamData.description?.trim() || ''
            })
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'équipe:', error);
        throw error;
    }
};

export const deleteTeam = async (id) => {
    try {
        if (!id) throw new Error('ID d\'équipe requis');

        const response = await fetchWithTimeout(`/api/teams/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'équipe:', error);
        throw error;
    }
};

export const getTeamOwners = async (teamId) => {
    try {
        if (!teamId) throw new Error('ID d\'équipe requis');

        const response = await fetchWithTimeout(`/api/teams/${teamId}/owners`, {
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    } catch (error) {
        console.error('Erreur lors de la récupération des membres de l\'équipe:', error);
        throw error;
    }
};