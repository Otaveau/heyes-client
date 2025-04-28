import { useCallback, useMemo } from 'react';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';
import taskService from '../services/taskService';
import { hasValidEventBoundaries } from '../utils/DateUtils';

/**
 * Hook gérant les mutations de tâches (création, mise à jour, suppression)
 */
export const useTaskMutationHandlers = (setTasks, setCalendarState, tasks, holidays) => {
  
  /**
   * Convertit une date inclusive en date exclusive pour FullCalendar
   */
  const getExclusiveEndDate = useCallback((inclusiveDate) => {
    if (!inclusiveDate) return null;

    const date = new Date(inclusiveDate);
    date.setDate(date.getDate() + 1);
    return date;
  }, []);

  /**
   * Réinitialise l'état du formulaire de tâche
   */
  const resetFormState = useCallback(() => {
    setCalendarState(prev => ({
      ...prev,
      isFormOpen: false,
      selectedTask: null,
      selectedDates: null,
      taskboardDestination: null,
      taskOriginId: null,
      isProcessing: false
    }));
  }, [setCalendarState]);

  /**
   * Prépare un objet avec toutes les propriétés de date nulles
   */
  const getNullDatesObject = useMemo(() => ({
    start: null,
    end: null,
    start_date: null,
    end_date: null,
    startDate: null,
    endDate: null,
    exclusiveEndDate: null,
    extendedProps: {
      inclusiveEndDate: null,
      exclusiveEndDate: null,
      start: null,
      end: null,
      start_date: null,
      end_date: null
    }
  }), []);

  /**
   * Met à jour le statut d'une tâche (sans appel API)
   */
  const updateTaskStatus = useCallback((taskId, updates) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id.toString() === taskId.toString()
          ? { ...task, ...updates }
          : task
      )
    );
  }, [setTasks]);

  /**
   * Met à jour une tâche (avec appel API optionnel)
   */
  const handleTaskUpdate = useCallback(async (taskId, updates, options = {}) => {
    const { revertFunction = null, successMessage = null, skipApiCall = false } = options;
    
    try {
      setCalendarState((prev) => ({ ...prev, isProcessing: true }));

      const existingTask = tasks.find(task => task.id.toString() === taskId.toString());
      if (!existingTask) {
        throw new Error(`Tâche avec id ${taskId} non trouvée`);
      }

      // Vérifier si on supprime les dates
      const isRemovingDates = updates.start === null && updates.end === null;

      // Préparer les mises à jour
      let completeUpdates = {
        ...updates,
        title: updates.title || existingTask.title
      };

      // Traitement des dates
      if (!isRemovingDates && updates.extendedProps?.inclusiveEndDate && !updates.end) {
        const exclusiveEndDate = getExclusiveEndDate(updates.extendedProps.inclusiveEndDate);
        completeUpdates = {
          ...completeUpdates,
          end: exclusiveEndDate,
          exclusiveEndDate
        };
      } else if (isRemovingDates) {
        // Réinitialiser toutes les dates
        completeUpdates = {
          ...completeUpdates,
          ...getNullDatesObject,
          extendedProps: {
            ...(completeUpdates.extendedProps || {}),
            ...getNullDatesObject.extendedProps
          }
        };
      }

      // Mise à jour locale
      updateTaskStatus(taskId, completeUpdates);

      // Appel API si nécessaire
      let apiResponse = completeUpdates;
      if (!skipApiCall) {
        apiResponse = await taskService.updateTask(taskId, completeUpdates);
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
  }, [setCalendarState, updateTaskStatus, tasks, getExclusiveEndDate, getNullDatesObject]);

  /**
   * Vérifie si une tâche peut être placée dans la colonne "En cours"
   */
  const canTaskBeInProgress = useCallback((taskData) => {
    const hasOwner = Boolean(taskData.resourceId || taskData.owner_id);
    const hasDates = Boolean(taskData.start || taskData.start_date);
    return hasOwner && hasDates;
  }, []);

  /**
   * Prépare les données d'une tâche pour sauvegarde
   */
  const prepareTaskData = useCallback((formData) => {
    const startDate = formData.startDate || formData.start;
    const inclusiveEndDate = formData.endDate || formData.end;
    const exclusiveEndDate = inclusiveEndDate ? getExclusiveEndDate(inclusiveEndDate) : null;
    const isConge = formData.isConge === true;
    
    return {
      ...formData,
      title: (formData.title || '').trim(),
      description: (formData.description || '').trim(),
      start: startDate,
      end: exclusiveEndDate,
      exclusiveEndDate,
      startDate: startDate,
      endDate: inclusiveEndDate,
      extendedProps: {
        ...(formData.extendedProps || {}),
        inclusiveEndDate,
        exclusiveEndDate,
        statusId: formData.statusId,
        isConge,
        description: formData.description
      }
    };
  }, [getExclusiveEndDate]);

  /**
   * Gère la soumission du formulaire de tâche (création/modification)
   */
  const handleTaskSubmit = useCallback(async (formData, options = {}) => {
    const { taskboardDestination = null } = options;
    
    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));

      // Validation du titre
      if (!formData?.title) {
        toast.error(ERROR_MESSAGES.TITLE_REQUIRED, TOAST_CONFIG);
        return null;
      }

      // Vérifier si la tâche peut être "En cours" (si c'est la destination)
      if (taskboardDestination === '2' && !canTaskBeInProgress(formData)) {
        // Rechercher le statut d'origine
        const originalTask = tasks.find(task => task.id.toString() === formData.id.toString());
        const originalStatusId = originalTask?.statusId || '1';
        const targetStatusId = originalStatusId === '2' ? '1' : originalStatusId;
        
        // Préparer les mises à jour sans dates/propriétaire
        const updates = {
          ...formData,
          ...getNullDatesObject,
          resourceId: null,
          owner_id: null,
          statusId: targetStatusId,
          description: formData.description,
          extendedProps: {
            ...(formData.extendedProps || {}),
            ...getNullDatesObject.extendedProps,
            statusId: targetStatusId,
            description: formData.description
          }
        };

        // Mettre à jour la tâche
        await taskService.updateTask(formData.id, updates);
        updateTaskStatus(formData.id, updates);
        
        toast.warning("Tâche non modifiée - Un propriétaire et des dates sont requis pour les tâches en cours", TOAST_CONFIG);
        resetFormState();
        return updates;
      } 
      
      // Mettre à jour le statut si nécessaire
      if (taskboardDestination === '2') {
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

      // Validation des dates
      const startDate = formData.startDate || formData.start;
      const inclusiveEndDate = formData.endDate || formData.end;
      
      if ((startDate && inclusiveEndDate) && !hasValidEventBoundaries(startDate, inclusiveEndDate, holidays)) {
        toast.warning('Les dates de début et de fin doivent être des jours ouvrés', TOAST_CONFIG);
        return null;
      }

      // Déterminer si c'est une création ou modification
      const isNewTask = !formData.id;
      
      // Préparer les données complètes
      const taskData = prepareTaskData(formData);
      let result;
      
      if (isNewTask) {
        // Création d'une nouvelle tâche
        result = await taskService.createTask(taskData);
        const newTask = {
          id: result.id,
          ...taskData,
          allDay: true
        };
        
        setTasks(prevTasks => [...prevTasks, newTask]);
        toast.success('Tâche créée', TOAST_CONFIG);
      } else {
        // Mise à jour d'une tâche existante
        updateTaskStatus(formData.id, taskData);
        result = await taskService.updateTask(formData.id, taskData);
        toast.success('Tâche mise à jour', TOAST_CONFIG);
      }

      resetFormState();
      return result;
    } catch (error) {
      console.error('Erreur lors de la soumission de la tâche:', error);
      toast.error(formData.id ? ERROR_MESSAGES.UPDATE_FAILED : ERROR_MESSAGES.CREATE_FAILED, TOAST_CONFIG);
      resetFormState();
      return null;
    } finally {
      setCalendarState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [
    holidays, setCalendarState, updateTaskStatus, setTasks, tasks, 
    getNullDatesObject, canTaskBeInProgress, prepareTaskData, resetFormState
  ]);

  /**
   * Supprime une tâche
   */
  const handleDeleteTask = useCallback(async (taskId) => {
    try {
      setCalendarState(prev => ({ ...prev, isProcessing: true }));
      
      // Supprimer localement d'abord
      setTasks(prevTasks => prevTasks.filter(task => task.id.toString() !== taskId.toString()));
      
      // Puis supprimer sur le serveur
      await taskService.deleteTask(taskId);
      
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