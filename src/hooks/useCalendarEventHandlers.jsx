import { useCallback } from 'react';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';
import { hasValidEventBoundaries } from '../utils/DateUtils';
import { ONE_DAY_MS } from '../constants/constants';

export const useCalendarEventHandlers = (
  setCalendarState,
  tasks,
  handleTaskUpdate,
  holidays
) => {
  /**
   * Sélectionne une tâche pour l'édition
   */
  const handleTaskSelection = useCallback((taskData) => {
    if (!taskData?.id) {
      console.warn(ERROR_MESSAGES.INVALID_TASK);
      return;
    }

    setCalendarState(prev => ({
      ...prev,
      selectedTask: taskData,
      selectedDates: {
        start: taskData.start,
        end: taskData.end,
        resourceId: taskData.resourceId
      },
      isFormOpen: true,
    }));
  }, [setCalendarState]);

  /**
   * Gère le clic sur un événement du calendrier
   */
  const handleCalendarEventClick = useCallback((clickInfo) => {
    const eventId = clickInfo.event.id;
    const task = tasks.find((t) => t.id.toString() === eventId.toString());

    if (task) {
      handleTaskSelection(task);
    } else {
      console.warn('Tâche non trouvée:', eventId);
    }
  }, [handleTaskSelection, tasks]);

  /**
   * Gère la sélection d'une date sur le calendrier
   */
  const handleDateClick = useCallback((selectInfo) => {
    const startDate = selectInfo.start;

    setCalendarState(prev => ({
      ...prev,
      selectedDates: {
        start: startDate,
        end: startDate,
        resourceId: selectInfo.resource?.id,
      },
      isFormOpen: true,
    }));

    selectInfo.view.calendar.unselect();
  }, [setCalendarState]);

  /**
   * Prépare les mises à jour d'une tâche après un changement dans le calendrier
   */
  const prepareTaskUpdates = useCallback((event, existingTask) => {
    const startDate = event.start;
    const endDate = event.end || new Date(startDate.getTime() + ONE_DAY_MS);
    const exclusiveEndDate = endDate;
    const inclusiveEndDate = new Date(exclusiveEndDate);
    inclusiveEndDate.setDate(inclusiveEndDate.getDate() - 1);

    const statusId = event._def?.extendedProps?.statusId || existingTask?.extendedProps?.statusId;
    const resourceId = event._def?.resourceIds?.[0];

    return {
      startDate,
      endDate,
      exclusiveEndDate,
      inclusiveEndDate,
      statusId,
      resourceId,
      updates: {
        title: event.title,
        start: startDate,
        end: endDate,
        exclusiveEndDate,
        resourceId,
        statusId,
        extendedProps: {
          statusId,
          inclusiveEndDate
        }
      }
    };
  }, []);

  /**
    * Valide et met à jour une tâche après un événement de calendrier
    */
  const validateAndUpdateTask = useCallback(async (eventType, info) => {
    try {
      const { event } = info;
      const taskId = event.id;

      // Trouver la tâche existante
      const existingTask = tasks.find(t => t.id.toString() === taskId.toString());
      if (!existingTask) {
        console.warn(`Tâche avec l'ID ${taskId} introuvable`);
        info.revert();
        return false;
      }

      // Préparer les mises à jour
      const { startDate, inclusiveEndDate, updates } = prepareTaskUpdates(event, existingTask);

      // Validation des dates
      if (!hasValidEventBoundaries(startDate, inclusiveEndDate, holidays)) {
        info.revert();
        toast.warning('Les dates de début et de fin doivent être des jours ouvrés', TOAST_CONFIG);
        return false;
      }

      // Message de réussite personnalisé selon le type d'événement
      const successMessage = eventType === 'drop'
        ? `Tâche "${event.title}" déplacée`
        : `Tâche "${event.title}" redimensionnée`;

      // Effectuer la mise à jour
      await handleTaskUpdate(
        taskId,
        updates,
        {
          revertFunction: info.revert,
          successMessage
        }
      );

      return true;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la tâche (${eventType}):`, error);
      info.revert();
      toast.error('Une erreur est survenue lors de la mise à jour de la tâche', TOAST_CONFIG);
      return false;
    }
  }, [tasks, holidays, prepareTaskUpdates, handleTaskUpdate]);

  /**
   * Gère le déplacement d'un événement dans le calendrier
   */
  const handleEventDrop = useCallback(async (dropInfo) => {
    await validateAndUpdateTask('drop', dropInfo);
  }, [validateAndUpdateTask]);

  /**
   * Gère le redimensionnement d'un événement dans le calendrier
   */
  const handleEventResize = useCallback(async (resizeInfo) => {
    await validateAndUpdateTask('resize', resizeInfo);
  }, [validateAndUpdateTask]);

  return {
    handleCalendarEventClick,
    handleDateClick,
    handleEventDrop,
    handleEventResize,
    handleTaskSelection
  };
};