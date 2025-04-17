import { useMemo } from 'react';
import { useDragDropStyleHandlers } from './useDragDropStyleHandlers';
import { useTaskMutationHandlers } from './useTaskMutationHandler';
import { useCalendarEventHandlers } from './useCalendarEventHandlers';
import { useExternalTaskHandlers } from './useExternalTaskHandlers';

/**
 * Hook principal qui combine tous les gestionnaires de tâches
 */
export const useTaskHandlers = (
  setTasks,
  setCalendarState,
  tasks,
  dropZoneRefs,
  dropZones,
  holidays
) => {
  // Initialiser les gestionnaires de mutations de tâches
  const taskMutationHandlers = useTaskMutationHandlers(
    setTasks, 
    setCalendarState, 
    tasks, 
    holidays
  );

  // Initialiser les gestionnaires d'événements du calendrier
  const calendarEventHandlers = useCalendarEventHandlers(
    setCalendarState, 
    tasks, 
    taskMutationHandlers.handleTaskUpdate,
    holidays
  );

  // Initialiser les gestionnaires de style pour le drag & drop
  const dragDropStyleHandlers = useDragDropStyleHandlers(
    dropZoneRefs, 
    dropZones
  );

  // Initialiser les gestionnaires de tâches externes
  const externalTaskHandlers = useExternalTaskHandlers(
    setTasks,
    tasks,
    setCalendarState, 
    taskMutationHandlers.updateTaskStatus,
    taskMutationHandlers.handleTaskUpdate,
    holidays,
    dropZoneRefs,
    dropZones
  );

  // Combinaison de tous les handlers avec une meilleure performance via useMemo
  return useMemo(() => ({
    // Handlers de mutation de tâches
    addTask: taskMutationHandlers.addTask,
    updateTask: taskMutationHandlers.updateTask,
    deleteTask: taskMutationHandlers.deleteTask,
    updateTaskStatus: taskMutationHandlers.updateTaskStatus,
    handleTaskUpdate: taskMutationHandlers.handleTaskUpdate,
    
    // Handlers d'événements du calendrier
    handleEventClick: calendarEventHandlers.handleEventClick,
    handleDateSelect: calendarEventHandlers.handleDateSelect,
    handleEventDrop: calendarEventHandlers.handleEventDrop,
    handleEventResize: calendarEventHandlers.handleEventResize,
    
    // Handlers de style pour le drag & drop
    highlightDropZones: dragDropStyleHandlers.highlightDropZones,
    resetDropZoneStyles: dragDropStyleHandlers.resetDropZoneStyles,
    
    // Handlers pour les tâches externes
    handleExternalTaskClick: externalTaskHandlers.handleExternalTaskClick,
    handleEventDragStop: externalTaskHandlers.handleEventDragStop,
    handleExternalDrop: externalTaskHandlers.handleExternalDrop,
    handleEventReceive: externalTaskHandlers.handleEventReceive,
    createGhostElement: externalTaskHandlers.createGhostElement
  }), [
    taskMutationHandlers,
    calendarEventHandlers,
    dragDropStyleHandlers,
    externalTaskHandlers
  ]);
};