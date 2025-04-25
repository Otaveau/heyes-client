import { useDragDropStyleHandlers } from './useDragDropStyleHandlers';
import { useTaskMutationHandlers } from './useTaskMutationHandler';
import { useCalendarEventHandlers } from './useCalendarEventHandlers';
import { useExternalTaskHandlers } from './useExternalTaskHandlers';


export const useTaskHandlers = (
  setTasks,
  setCalendarState,
  tasks,
  dropZoneRefs,
  dropZones,
  holidays,
  calendarRef
) => {
  
  const dragDropStyleHandlers = useDragDropStyleHandlers(dropZoneRefs, dropZones);

  const taskMutationHandlers = useTaskMutationHandlers(setTasks, setCalendarState, tasks, holidays);

  const calendarEventHandlers = useCalendarEventHandlers(
    setCalendarState, 
    tasks, 
    taskMutationHandlers.handleTaskUpdate,
    holidays
  );

  const externalTaskHandlers = useExternalTaskHandlers(
    setTasks,
    tasks,
    setCalendarState, 
    taskMutationHandlers.updateTaskStatus,
    taskMutationHandlers.handleTaskUpdate,
    holidays,
    dropZones,
    calendarRef
  );

  return {
    ...taskMutationHandlers,
    ...calendarEventHandlers,
    ...dragDropStyleHandlers,
    ...externalTaskHandlers
  };
};