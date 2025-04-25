import React, { memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Calendar, User } from 'lucide-react';
import { formatDateTaskCard, getInclusiveEndDate } from '../../utils/DateUtils';
import { prepareTaskData } from '../../utils/TaskUtils';
import { cn } from '../../lib/utils';

export const TaskCard = memo(({
  task,
  statusName = '',
  onTaskClick,
  className = '',
  disabled = false
}) => {

  const handleDragStart = useCallback((e) => {
    if (!task || disabled) {
      e.preventDefault();
      return;
    }
    
    const preparedTask = prepareTaskData(task);
    
    // Pour le drag and drop natif
    e.dataTransfer.setData('application/json', JSON.stringify(preparedTask));

    // Pour FullCalendar
    e.target.setAttribute('data-event', JSON.stringify({
      id: preparedTask.id,
      title: preparedTask.title,
      start: preparedTask.startDate,
      end: preparedTask.endDate,
      resourceId: preparedTask.resourceId,
      extendedProps: {
        description: preparedTask.description,
        statusId: preparedTask.statusId,
        source: 'backlog'
      }
    }));

    e.target.classList.add('dragging');
  }, [disabled, task]);

  const handleDragEnd = useCallback((e) => {
    if (e && e.target) {
      e.target.classList.remove('dragging');
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!task || disabled || !onTaskClick) return;
    
    const inclusiveEndDate = getInclusiveEndDate(task);
    const enrichedTask = {
      ...task,
      extendedProps: {
        ...(task.extendedProps || {}),
        inclusiveEndDate
      }
    };
    
    onTaskClick(enrichedTask);
  }, [disabled, onTaskClick, task]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  if (!task) return null;

  // Préparation des données pour l'affichage
  const { id, title, description } = task;
  const taskData = prepareTaskData(task);
  
  const startDateFormatted = formatDateTaskCard(taskData.startDate);
  const endDateFormatted = formatDateTaskCard(taskData.endDate);
  const assignedTo = taskData.resourceId;
  
  // Classes conditionnelles avec l'utilitaire cn
  const cardClasses = cn(
    'task-card bg-white p-4 rounded-lg shadow-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400',
    statusName?.toLowerCase() === 'wip' ? 'border-blue-400' : 'border-gray-200',
    disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-move hover:bg-gray-50',
    className
  );
  
  return (
    <div className="fc-event task-card-wrapper" data-task-id={id}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        draggable={!disabled}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={cardClasses}
        aria-disabled={disabled}
      >
        <h4 className="font-medium text-gray-900 break-words">{title}</h4>

        {description && (
          <p className="text-sm text-gray-600 mt-2 break-words line-clamp-2">
            {description}
          </p>
        )}

        <div className="mt-3 space-y-2">
          {assignedTo && (
            <div className="flex items-center text-sm text-gray-700">
              <User size={14} className="mr-2" aria-hidden="true" />
              <span>Assigné à: {assignedTo}</span>
            </div>
          )}

          {startDateFormatted && endDateFormatted && (
            <div className="flex items-center text-xs text-gray-500">
              <Calendar size={14} className="mr-2" aria-hidden="true" />
              <span>
                {startDateFormatted} - {endDateFormatted}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Ajout du displayName pour les outils de développement
TaskCard.displayName = 'TaskCard';

// PropTypes pour la documentation et la validation des props
TaskCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    start_date: PropTypes.string,
    end_date: PropTypes.string,
    start: PropTypes.string,
    end: PropTypes.string,
    owner_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    resourceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    statusId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    extendedProps: PropTypes.object
  }).isRequired,
  statusName: PropTypes.string,
  onTaskClick: PropTypes.func,
  className: PropTypes.string,
  disabled: PropTypes.bool
};