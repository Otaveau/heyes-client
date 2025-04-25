/**
 * Prépare les données de la tâche pour le drag and drop
 */
export const prepareTaskData = (task) => {
    const {
      id,
      title,
      description,
      start_date,
      end_date,
      owner_id,
      resourceId,
      statusId,
      start,
      end
    } = task;
  
    return {
      id,
      title,
      description,
      startDate: start_date || start,
      endDate: end_date || end,
      resourceId: owner_id || resourceId,
      statusId,
      source: 'backlog'
    };
  };