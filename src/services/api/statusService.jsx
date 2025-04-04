import { fetchWithTimeout, getAuthHeaders } from '../apiUtils/apiConfig';
import { handleResponse } from '../apiUtils/errorHandlers';


export const fetchStatuses = async () => {
    try {
        const response = await fetchWithTimeout(`/api/status`, {
            headers: getAuthHeaders()
        });

        const statuses = await handleResponse(response);

        return statuses.map(status => ({
            id: status.id,
            statusId: status.status_id,
            statusType: status.status_type,
        }));
    } catch (error) {
        console.error('Erreur lors de la récupération des statuts:', error);
        throw error;
    }
};