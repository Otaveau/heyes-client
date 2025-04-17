import { useCallback } from 'react';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';
import { createTask, updateTask, deleteTask } from '../services/api/taskService';
import { hasValidEventBoundaries } from '../utils/dateUtils';

export const useTaskMutationHandlers = (setTasks, setCalendarState, tasks, holidays) => {
  
  // Fonction utilitaire pour convertir une date inclusive en date exclusive
  const getExclusiveEndDate = useCallback((inclusiveDate) => {
    if (!inclusiveDate) return null;

    const date = new Date(inclusiveDate);
    date.setDate(date.getDate() + 1);
    return date;
  }, []);

  // Mise à jour du statut d'une tâche (sans appel API)
  const updateTaskStatus = useCallback((taskId, updates) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id.toString() === taskId.toString()
          ? { ...task, ...updates }
          : task
      )
    );
  }, [setTasks]);

  // Mise à jour d'une tâche (avec appel API)
  const handleTaskUpdate = useCallback(async (taskId, updates, options = {}) => {
    const { revertFunction = null, successMessage = null, skipApiCall = false } = options;
    try {
      setCalendarState((prev) => ({ ...prev, isProcessing: true }));

      const existingTask = tasks.find(task => task.id.toString() === taskId.toString());

      // Modification importante: vérifier si les dates doivent être nulles
      const isRemovingDates = updates.start === null && updates.end === null;

      // Préparer les mises à jour avec gestion des dates
      let completeUpdates = {
        ...updates,
        title: updates.title || existingTask.title
      };

      // Seulement convertir les dates si nous ne sommes pas en train de les supprimer
      if (!isRemovingDates && updates.extendedProps?.inclusiveEndDate && !updates.end) {
        // Convertir la date inclusive en date exclusive pour FullCalendar
        const exclusiveEndDate = getExclusiveEndDate(updates.extendedProps.inclusiveEndDate);

        completeUpdates = {
          ...completeUpdates,
          end: exclusiveEndDate, // Date exclusive pour FullCalendar
          exclusiveEndDate: exclusiveEndDate // Stockage explicite de la date exclusive
        };
      }

      // Si les dates doivent être nulles, s'assurer qu'elles le sont partout
      if (isRemovingDates) {
        completeUpdates = {
          ...completeUpdates,
          start: null,
          end: null,
          start_date: null,
          end_date: null,
          startDate: null,
          endDate: null,
          exclusiveEndDate: null,
          // S'assurer que extendedProps existe et contient aussi des dates nulles
          extendedProps: {
            ...(completeUpdates.extendedProps || {}),
            inclusiveEndDate: null,
            exclusiveEndDate: null,
            start: null,
            end: null,
            start_date: null,
            end_date: null
          }
        };
      }

      // Mise à jour locale
      updateTaskStatus(taskId, completeUpdates);

      // Préparation des données pour l'API avec garantie que toutes les dates sont traitées correctement
      const apiUpdates = { ...completeUpdates };

      // Appel API si nécessaire
      let apiResponse = completeUpdates;
      if (!skipApiCall) {
        apiResponse = await updateTask(taskId, apiUpdates);
      }

      if (successMessage) {
        toast.success(successMessage, TOAST_CONFIG);
      }

      return apiResponse;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la tâche:', error);
      toast.error(ERROR_MESSAGES.UPDATE_FAILED, TOAST_CONFIG);

      if (revertFunction) {
        revertFunction();
      }
      return null;
    } finally {
      setCalendarState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, updateTaskStatus, tasks, getExclusiveEndDate]);


  // Soumission du formulaire de tâche (création/modification)
 // Version améliorée qui combine les deux méthodes
 const handleTaskSubmit = useCallback(async (formData, options = {}) => {
  const { taskboardDestination = null } = options;
  
  try {
    setCalendarState(prev => ({ ...prev, isProcessing: true }));

    // Si la tâche vient d'être déplacée vers le taskboard "En cours" (statusId '2')
    if (taskboardDestination === '2') {
      // Vérifier si un propriétaire est assigné et si des dates sont définies
      const hasOwner = Boolean(formData.resourceId || formData.owner_id);
      const hasDates = Boolean(formData.start || formData.start_date);

      // Si les conditions ne sont pas remplies pour être "En cours"
      if (!hasOwner || !hasDates) {
        // Rechercher la tâche originale pour obtenir son statusId précédent
        const originalTask = tasks.find(task => task.id.toString() === formData.id.toString());
        const originalStatusId = originalTask?.statusId || '1'; // Fallback à 'À faire' si non trouvé

        // Utiliser le statut d'origine si différent de '2'
        const targetStatusId = originalStatusId === '2' ? '1' : originalStatusId;

        // Préparer les mises à jour sans dates/propriétaire
        const updates = {
          ...formData,
          start: null,
          end: null,
          start_date: null,
          end_date: null,
          resourceId: null,
          owner_id: null,
          statusId: targetStatusId,
          description: formData.description,
          extendedProps: {
            ...(formData.extendedProps || {}),
            statusId: targetStatusId,
            description: formData.description
          }
        };

        // Utiliser handleTaskUpdate pour mettre à jour
        await updateTask(formData.id, updates);
        updateTaskStatus(formData.id, updates);
        
        toast.warning("Tâche non modifiée - Un propriétaire et des dates sont requis pour les tâches en cours", TOAST_CONFIG);
        return updates;
      } 
      
      // Si les conditions sont remplies, mettre à jour vers le statut '2'
      formData = {
        ...formData,
        statusId: '2',
        extendedProps: {
          ...(formData.extendedProps || {}),
          statusId: '2',
          description: formData.description
        }
      };
    }

    // Validation du titre
    if (!formData?.title) {
      toast.error(ERROR_MESSAGES.TITLE_REQUIRED, TOAST_CONFIG);
      return null;
    }

    // Préparation des dates
    const startDate = formData.startDate || formData.start;
    const inclusiveEndDate = formData.endDate || formData.end;

    // Calculer la date exclusive (pour FullCalendar)
    let exclusiveEndDate = null;
    if (inclusiveEndDate) {
      exclusiveEndDate = getExclusiveEndDate(inclusiveEndDate);
    }

    // Validation des dates - utiliser la date inclusive pour validation
    if ((startDate && inclusiveEndDate) && !hasValidEventBoundaries(startDate, inclusiveEndDate, holidays)) {
      toast.warning('Les dates de début et de fin doivent être des jours ouvrés', TOAST_CONFIG);
      return null;
    }

    // Déterminer si c'est une création ou une modification
    const isNewTask = !formData.id;
    const isConge = formData.isConge === true;

    // Préparer les données de la tâche
    const taskData = {
      ...formData,
      title: (formData.title || '').trim(),
      description: (formData.description || '').trim(),
      start: startDate,
      end: exclusiveEndDate,
      exclusiveEndDate: exclusiveEndDate,
      startDate: startDate,
      endDate: inclusiveEndDate,
      extendedProps: {
        ...(formData.extendedProps || {}),
        inclusiveEndDate: inclusiveEndDate,
        exclusiveEndDate: exclusiveEndDate,
        statusId: formData.statusId,
        isConge: isConge,
        description: formData.description
      }
    };

    let updatedTask;
    
    // Cas de mise à jour d'une tâche existante
    if (!isNewTask) {
      updateTaskStatus(formData.id, taskData);
      updatedTask = await updateTask(formData.id, taskData);
      toast.success('Tâche mise à jour', TOAST_CONFIG);
    }
    // Cas de création d'une nouvelle tâche
    else {
      updatedTask = await createTask(taskData);
      const newTask = {
        id: updatedTask.id,
        ...taskData,
        allDay: true
      };

      setTasks(prevTasks => [...prevTasks, newTask]);
      toast.success('Tâche créée', TOAST_CONFIG);
    }

    // Réinitialiser l'état du formulaire
    setCalendarState(prev => ({
      ...prev,
      isFormOpen: false,
      selectedTask: null,
      selectedDates: null,
      taskboardDestination: null,
      taskOriginId: null
    }));

    return updatedTask;
  } catch (error) {
    console.error('Erreur lors de la soumission de la tâche:', error);
    toast.error(formData.id ? ERROR_MESSAGES.UPDATE_FAILED : ERROR_MESSAGES.CREATE_FAILED, TOAST_CONFIG);
    
    // S'assurer que le formulaire est fermé même en cas d'erreur
    setCalendarState(prev => ({
      ...prev,
      isFormOpen: false,
      selectedTask: null,
      selectedDates: null,
      taskboardDestination: null,
      taskOriginId: null
    }));
    
    return null;
  } finally {
    setCalendarState(prev => ({ ...prev, isProcessing: false }));
  }
}, [holidays, setCalendarState, updateTaskStatus, setTasks, tasks, getExclusiveEndDate]);
  // Suppression d'une tâche
  const handleDeleteTask = useCallback(async (taskId) => {
    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      setTasks(prevTasks => prevTasks.filter(task => task.id.toString() !== taskId.toString()));

      await deleteTask(taskId);

      toast.success('Tâche supprimée', TOAST_CONFIG);
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(ERROR_MESSAGES.DELETE_FAILED, TOAST_CONFIG);
      return false;
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [setCalendarState, setTasks]);

  return {
    updateTaskStatus,
    handleTaskUpdate,
    handleTaskSubmit,
    handleDeleteTask,
    getExclusiveEndDate
  };
};