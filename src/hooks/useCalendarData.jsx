import { useState, useEffect, useCallback } from 'react';
import taskService from '../services/taskService';
import ownerService from '../services/ownerService';
import holidayService from '../services/holidayService';
import statusService from '../services/statusService';
import teamService from '../services/teamService';

export const useCalendarData = () => {
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Formate les ressources (propriétaires et équipes) pour l'affichage
  const formatResources = useCallback((ownersData, teamsData = []) => {
    const teamsArray = Array.isArray(teamsData) ? teamsData : [];
    const owners = Array.isArray(ownersData) ? ownersData : [];
    
    // Créer un dictionnaire des équipes pour une recherche efficace
    const teamDict = {};
    teamsArray.forEach(team => {
      if (team && team.team_id) {
        teamDict[team.team_id] = {
          id: team.team_id,
          name: team.name || 'Équipe sans nom',
          teamColor: team.color || '#797d7d'
        };
      }
    });

    // Formate les propriétaires en ressources
    const resources = [];
    owners.forEach(owner => {
      if (!owner) return;
      
      const teamId = owner.teamId;
      // Vérification de sécurité pour éviter les accès à null/undefined
      const team = teamId && teamDict[teamId] ? teamDict[teamId] : null;
      
      resources.push({
        id: owner.ownerId,
        title: owner.name,
        parentId: team ? `team_${teamId}` : undefined,
        extendedProps: {
          teamId: teamId,
          teamName: team?.name,
          teamColor: team?.teamColor
        }
      });
    });

    // Formate les équipes en ressources
    Object.values(teamDict).forEach(team => {
      resources.push({
        id: `team_${team.id}`,
        title: team.name,
        extendedProps: {
          isTeam: true,
          color: team.color
        }
      });
    });

    return resources;
  }, []);

  // Formate les tâches pour l'affichage dans le calendrier
  const formatTasks = useCallback((tasksData) => {
    const tasks = Array.isArray(tasksData) ? tasksData : [];

    return tasks
      .filter(Boolean)
      .map(task => {
        // Gestion précise des dates
        const startDate = task.start_date || null;
        const inclusiveEndDate = task.end_date || null;

        // Date exclusive pour FullCalendar (jour suivant la date de fin inclusive)
        let exclusiveEndDate = null;
        if (inclusiveEndDate) {
          exclusiveEndDate = new Date(inclusiveEndDate);
          exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);
        }

        return {
          id: task.id,
          title: task.title || 'Tâche sans titre',
          start: startDate,
          end: exclusiveEndDate, // Date exclusive pour FullCalendar
          resourceId: (task.owner_id || task.ownerId)?.toString(),
          allDay: true,
          extendedProps: {
            statusId: task.extendedProps?.statusId?.toString() || null,
            userId: task.extendedProps?.userId || null,
            description: task.extendedProps?.description || '',
            team: task.extendedProps?.teamName || null,
            ownerName: task.extendedProps?.ownerName || null,
            statusType: task.extendedProps?.statusType || null,
            // Ajout des informations de dates supplémentaires
            startDate,
            inclusiveEndDate,
            exclusiveEndDate
          }
        };
      });
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const year = new Date().getFullYear();
    
    try {
      // Exécuter toutes les requêtes en parallèle
      const [
        holidayResults, 
        ownersResults, 
        tasksResults, 
        statusesResults, 
        teamsResults
      ] = await Promise.allSettled([
        holidayService.fetchHolidays(year),
        ownerService.fetchOwners(),
        taskService.getAll(),
        statusService.fetchStatuses(),
        teamService.fetchTeams()
      ]);
      
      // Traiter les résultats des vacances
      const holidayDates = holidayResults.status === 'fulfilled' 
        ? holidayResults.value 
        : [];
      
      if (holidayResults.status === 'rejected') {
        console.error('Erreur lors de la récupération des jours fériés:', holidayResults.reason);
      }
      
      // Traiter les résultats des propriétaires
      const ownersData = ownersResults.status === 'fulfilled' 
        ? ownersResults.value 
        : [];
      
      if (ownersResults.status === 'rejected') {
        console.error('Erreur lors de la récupération des propriétaires:', ownersResults.reason);
      }
      
      // Traiter les résultats des tâches
      const tasksData = tasksResults.status === 'fulfilled' 
        ? tasksResults.value 
        : [];
      
      if (tasksResults.status === 'rejected') {
        console.error('Erreur lors de la récupération des tâches:', tasksResults.reason);
      }
      
      // Traiter les résultats des statuts
      const statusesData = statusesResults.status === 'fulfilled' 
        ? statusesResults.value 
        : [];
      
      if (statusesResults.status === 'rejected') {
        console.error('Erreur lors de la récupération des statuts:', statusesResults.reason);
      }
      
      // Traiter les résultats des équipes
      let teamsData = [];
      
      if (teamsResults.status === 'fulfilled') {
        const fetchedTeams = teamsResults.value;
        
        if (Array.isArray(fetchedTeams)) {
          teamsData = fetchedTeams;
        } else if (fetchedTeams) {
          teamsData = [fetchedTeams];
        }
      } else {
        console.error('Erreur lors de la récupération des équipes:', teamsResults.reason);
      }
      
      // Vérifier si toutes les requêtes ont échoué
      const allFailed = [
        holidayResults, 
        ownersResults, 
        tasksResults, 
        statusesResults, 
        teamsResults
      ].every(result => result.status === 'rejected');
      
      if (allFailed) {
        throw new Error("Impossible de charger les données. Veuillez réessayer plus tard.");
      }
      
      // Mettre à jour l'état avec les données formatées
      setHolidays(holidayDates);
      setResources(formatResources(ownersData, teamsData));
      setStatuses(statusesData);
      setTasks(formatTasks(tasksData));
      
    } catch (err) {
      console.error('Erreur générale dans loadData:', err);
      setError(err.message || "Une erreur s'est produite lors du chargement des données");
    } finally {
      setIsLoading(false);
    }
  }, [formatResources, formatTasks]);

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fonction pour rafraîchir les données
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    tasks,
    resources,
    holidays,
    statuses,
    isLoading,
    error,
    setTasks,
    refreshData, // Ajout d'une fonction pour rafraîchir les données
  };
};