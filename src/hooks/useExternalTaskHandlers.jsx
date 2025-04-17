import { useCallback, useRef } from 'react';
import { ERROR_MESSAGES, TOAST_CONFIG } from '../constants/constants';
import { toast } from 'react-toastify';
import { isHolidayOrWeekend } from '../utils/dateUtils';

export const useExternalTaskHandlers = (
  setTasks,
  tasks,
  setCalendarState,
  updateTaskStatus,
  handleTaskUpdate,
  holidays,
  dropZones
) => {
  // Référence pour l'élément fantôme
  const ghostElementRef = useRef(null);
  const ghostMoveHandlerRef = useRef(null);

  // Fonction utilitaire pour obtenir la date de fin inclusive
  const getInclusiveEndDate = useCallback((task) => {
    if (task.extendedProps?.inclusiveEndDate) return task.extendedProps.inclusiveEndDate;
    if (task.end_date) return task.end_date;
    
    if (task.end) {
      const endDate = new Date(task.end);
      endDate.setDate(endDate.getDate() - 1);
      return endDate;
    }
    
    return null;
  }, []);

  // Gestion des éléments visuels
  const visualEffects = useCallback(() => {
    const highlightTaskBoard = (isHighlighted) => {
      const taskBoardContainer = document.querySelector('.taskboard-container');
      if (!taskBoardContainer) return;
      
      taskBoardContainer.classList.toggle('taskboard-highlight', isHighlighted);
      if (!isHighlighted) {
        taskBoardContainer.classList.remove('taskboard-highlight-intense');
      }
    };
    
    const updateDropZoneHighlights = (position) => {
      const dropZoneElements = document.querySelectorAll('.potential-drop-target');
      let foundMatch = false;
      
      dropZoneElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isOver = position.x >= rect.left && 
                      position.x <= rect.right && 
                      position.y >= rect.top && 
                      position.y <= rect.bottom;
        
        el.classList.toggle('dropzone-active', isOver);
        if (isOver) foundMatch = true;
      });
      
      const taskBoardContainer = document.querySelector('.taskboard-container');
      if (taskBoardContainer) {
        taskBoardContainer.classList.toggle('taskboard-highlight-intense', foundMatch);
      }
    };
    
    const cleanupVisualEffects = () => {
      highlightTaskBoard(false);
      document.querySelectorAll('.potential-drop-target, .dropzone-active, .active-drop-target').forEach(el => {
        el.classList.remove('potential-drop-target', 'dropzone-active', 'active-drop-target');
      });
    };
    
    return { highlightTaskBoard, updateDropZoneHighlights, cleanupVisualEffects };
  }, []);
  
  const { updateDropZoneHighlights, cleanupVisualEffects } = visualEffects();

  // Clic sur une tâche externe
  const handleExternalTaskClick = useCallback((task) => {
    const fullTask = tasks.find(t => t.id.toString() === task.id.toString());
    if (!fullTask) return;

    const inclusiveEndDate = getInclusiveEndDate(fullTask);

    setCalendarState(prev => ({
      ...prev,
      isFormOpen: true,
      selectedTask: {
        id: fullTask.id,
        title: fullTask.title,
        description: fullTask.extendedProps?.description || '',
        statusId: fullTask.extendedProps?.statusId || task.statusId || '1',
        resourceId: fullTask.resourceId || null,
        ...(fullTask.start && { start: fullTask.start }),
        ...(fullTask.end && { end: fullTask.end }),
        extendedProps: {
          ...(fullTask.extendedProps || {}),
          ...(inclusiveEndDate && { inclusiveEndDate }),
          statusId: fullTask.extendedProps?.statusId || task.statusId || '1'
        }
      }
    }));
  }, [setCalendarState, tasks, getInclusiveEndDate]);

  // Vérifier si un événement est au-dessus d'une zone de dépôt
  const isEventOverDropZone = useCallback((position) => {
    try {
      const droppableElements = document.querySelectorAll('[data-status-id]');
      if (!droppableElements || droppableElements.length === 0) return null;

      for (const element of droppableElements) {
        const rect = element.getBoundingClientRect();
        
        const isOver = (
          position.x >= rect.left &&
          position.x <= rect.right &&
          position.y >= rect.top &&
          position.y <= rect.bottom
        );

        if (isOver) {
          const statusId = element.dataset.statusId;
          if (!statusId || statusId === '2') continue;

          const dropZone = dropZones.find(zone => zone.statusId === statusId);
          if (dropZone) return { dropZone, element };
        }
      }
    } catch (error) {
      console.error('Erreur dans isEventOverDropZone:', error);
    }
    return null;
  }, [dropZones]);

  // Création et animation de l'élément ghost
  const ghostElementHandlers = useCallback(() => {
    const createGhostElement = (info) => {
      if (ghostElementRef.current) {
        document.body.removeChild(ghostElementRef.current);
      }
  
      const ghostEl = document.createElement('div');
      ghostEl.className = 'task-ghost-element';
  
      const originalRect = info.el.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(info.el);
  
      ghostEl.innerHTML = `<div class="ghost-title">${info.event.title}</div>`;
      ghostEl.style.position = 'fixed';
      ghostEl.style.zIndex = '9999';
      ghostEl.style.pointerEvents = 'none';
      ghostEl.style.width = `${originalRect.width}px`;
      ghostEl.style.height = `${originalRect.height}px`;
      ghostEl.style.backgroundColor = computedStyle.backgroundColor || '#4a6cf7';
      ghostEl.style.color = computedStyle.color || 'white';
      ghostEl.style.borderRadius = computedStyle.borderRadius || '4px';
      ghostEl.style.padding = computedStyle.padding || '4px';
      ghostEl.style.opacity = '0.9';
      ghostEl.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      ghostEl.style.transition = 'transform 0.05s ease';
      ghostEl.style.fontFamily = computedStyle.fontFamily;
      ghostEl.style.fontSize = computedStyle.fontSize;
      ghostEl.style.display = 'flex';
      ghostEl.style.alignItems = 'center';
      ghostEl.style.justifyContent = 'center';
      ghostEl.style.overflow = 'hidden';
      ghostEl.style.textOverflow = 'ellipsis';
      ghostEl.style.whiteSpace = 'nowrap';
  
      ghostEl.style.left = `${info.jsEvent.clientX + 15}px`;
      ghostEl.style.top = `${info.jsEvent.clientY + 15}px`;
  
      document.body.appendChild(ghostEl);
      ghostElementRef.current = ghostEl;
  
      const updateGhostPosition = (e) => {
        if (!ghostElementRef.current) return;
        
        ghostElementRef.current.style.left = `${e.clientX + 15}px`;
        ghostElementRef.current.style.top = `${e.clientY + 15}px`;
        
        // Effet de mise à l'échelle
        ghostElementRef.current.style.transform = 'scale(1.05)';
        setTimeout(() => {
          if (ghostElementRef.current) {
            ghostElementRef.current.style.transform = 'scale(1)';
          }
        }, 50);
        
        // Mettre à jour les surbrillances
        updateDropZoneHighlights({ x: e.clientX, y: e.clientY });
      };
  
      document.addEventListener('mousemove', updateGhostPosition);
      ghostMoveHandlerRef.current = updateGhostPosition;
  
      return updateGhostPosition;
    };
    
    const simulateTransitionToTaskBoard = (taskId, targetDropZone) => {
      if (!ghostElementRef.current) return;
  
      const dropZoneEl = document.querySelector(`[data-dropzone-id="${targetDropZone.id}"]`);
      if (!dropZoneEl) return;
  
      const dropZoneRect = dropZoneEl.getBoundingClientRect();
      const ghostRect = ghostElementRef.current.getBoundingClientRect();
      const ghost = ghostElementRef.current;
  
      // Position cible centrée dans la zone
      const targetX = dropZoneRect.left + (dropZoneRect.width / 2) - (ghostRect.width / 2);
      const targetY = dropZoneRect.top + 10;
  
      ghost.style.transition = 'left 0.2s ease, top 0.2s ease, opacity 0.2s ease, transform 0.2s ease';
      ghost.style.left = `${targetX}px`;
      ghost.style.top = `${targetY}px`;
      ghost.style.transform = 'scale(0.9)';
  
      // Créer un placeholder temporaire
      const placeholderTask = document.createElement('div');
      placeholderTask.className = 'fc-event temporary-task-placeholder';
      placeholderTask.setAttribute('data-task-id', taskId);
      placeholderTask.style.opacity = '0';
      placeholderTask.style.height = `${ghostRect.height}px`;
      placeholderTask.style.margin = '8px 0';
      placeholderTask.style.transition = 'opacity 0.2s ease';
      placeholderTask.innerText = ghostElementRef.current.innerText;
  
      dropZoneEl.appendChild(placeholderTask);
      setTimeout(() => placeholderTask.style.opacity = '1', 50);
  
      setTimeout(() => {
        ghost.style.opacity = '0';
        setTimeout(() => cleanupGhostElements(placeholderTask), 200);
      }, 180);
    };
    
    const cleanupGhostElements = (placeholderTask) => {
      if (ghostElementRef.current) {
        document.body.removeChild(ghostElementRef.current);
        ghostElementRef.current = null;
      }
      
      try {
        if (placeholderTask && placeholderTask.parentNode) {
          placeholderTask.parentNode.removeChild(placeholderTask);
        }
      } catch (e) {
        console.error('Erreur lors du nettoyage du placeholder:', e);
      }
    };
    
    const cleanupDragHandlers = () => {
      if (ghostMoveHandlerRef.current) {
        document.removeEventListener('mousemove', ghostMoveHandlerRef.current);
        ghostMoveHandlerRef.current = null;
      }
    };
    
    return { createGhostElement, simulateTransitionToTaskBoard, cleanupGhostElements, cleanupDragHandlers };
  }, [updateDropZoneHighlights]);
  
  const { createGhostElement, simulateTransitionToTaskBoard, cleanupDragHandlers } = ghostElementHandlers();

  // Préparation des mises à jour de tâche
  const prepareTaskUpdates = useCallback((task, options = {}) => {
    const { statusId, resourceId, startDate, endDate } = options;
    
    // Préparer l'objet de base avec les nullifications nécessaires
    const updates = {
      // Propriétés de ressource
      resourceId: resourceId || null,
      owner_id: null,

      // Propriétés de date - FORMAT FULLCALENDAR
      start: startDate || null,
      end: endDate || null,

      // Propriétés de date - FORMAT API
      start_date: null,
      end_date: null,
      startDate: null,
      endDate: null,

      // Propriétés de statut
      statusId: statusId || task.statusId || '1',

      // Propriétés étendues
      extendedProps: {
        ...(task.extendedProps || {}),
        statusId: statusId || task.statusId || '1',
        inclusiveEndDate: startDate ? new Date(startDate) : null,
        exclusiveEndDate: endDate || null,
        // S'assurer qu'aucune autre propriété de date n'est présente si déplacement vers taskboard
        ...((!startDate && !endDate) ? {
          start: null,
          end: null,
          start_date: null,
          end_date: null
        } : {})
      }
    };
    
    return updates;
  }, []);

  // Fin du glisser-déposer
  const handleEventDragStop = useCallback(async (info) => {
    const eventId = info.event.id;
    const eventTask = tasks.find(t => t.id.toString() === eventId.toString());

    // Vérifier si c'est un congé (ignorer)
    if (eventTask && (
      eventTask.isConge === true ||
      eventTask.extendedProps?.isConge === true ||
      eventTask.title === 'CONGE'
    )) {
      if (info.el) {
        info.el.style.display = '';
        info.el.style.opacity = '1';
      }
      return;
    }

    try {
      // Nettoyer effets visuels
      cleanupVisualEffects();
      cleanupDragHandlers();

      if (info.el) {
        info.el.classList.remove('dragging-event');
        info.el.style.opacity = '1';
      }

      // Vérifier si l'événement est sur une zone de dépôt
      const eventPosition = {
        x: info.jsEvent.clientX,
        y: info.jsEvent.clientY
      };

      const dropTarget = isEventOverDropZone(eventPosition);

      if (dropTarget && dropTarget.dropZone) {
        const { dropZone } = dropTarget;
        const taskId = info.event.id;
        
        if (!tasks || !Array.isArray(tasks)) {
          console.error('tasks n\'est pas défini ou n\'est pas un tableau');
          return;
        }

        const task = tasks.find(t => t.id.toString() === taskId.toString());
        if (!task) {
          console.warn(`Task with id ${taskId} not found`);
          return;
        }

        if (info.el) info.el.style.display = 'none';
        info.event.remove();

        // Animer la transition vers le TaskBoard
        simulateTransitionToTaskBoard(taskId, dropZone);

        // Préparer les mises à jour pour le déplacement vers le taskboard
        const updates = prepareTaskUpdates(task, { statusId: dropZone.statusId });

        // Mettre à jour l'état local immédiatement
        if (typeof updateTaskStatus === 'function') {
          updateTaskStatus(taskId, updates);
        } else {
          console.warn('updateTaskStatus n\'est pas une fonction');
        }

        // Mise à jour persistante sur le serveur
        if (typeof handleTaskUpdate === 'function') {
          try {
            await handleTaskUpdate(taskId, updates, {
              skipApiCall: false,
              successMessage: `Tâche déplacée vers ${dropZone.title || 'la colonne'}`
            });
          } catch (error) {
            console.error('Erreur lors de la mise à jour de la tâche:', error);
            toast.error(ERROR_MESSAGES.UPDATE_FAILED, TOAST_CONFIG);
          }
        } else {
          console.warn('handleTaskUpdate n\'est pas une fonction');
        }
      }
    } catch (error) {
      console.error('Erreur dans handleEventDragStop:', error);
    }
  }, [tasks, updateTaskStatus, handleTaskUpdate, cleanupVisualEffects, isEventOverDropZone, 
      simulateTransitionToTaskBoard, cleanupDragHandlers, prepareTaskUpdates]);

  // Vérification de validité pour déposer une tâche
  const validateTaskDrop = useCallback((date, resource) => {
    // Vérifier si c'est un jour férié ou un weekend
    if (isHolidayOrWeekend(date, holidays)) {
      toast.warning('Impossible de planifier sur un jour non ouvré', TOAST_CONFIG);
      return false;
    }

    // Vérifier si la ressource cible est une équipe
    if (resource?.extendedProps?.isTeam || 
        (typeof resource?.id === 'string' && resource.id.startsWith('team_'))) {
      toast.warning('Impossible de planifier directement sur une équipe', TOAST_CONFIG);
      return false;
    }

    return true;
  }, [holidays]);

  // Dépôt d'une tâche externe sur le calendrier
  const handleExternalDrop = useCallback(async (info) => {
    if (info.draggedEl) {
      info.draggedEl.style.opacity = '0';
    }

    // Éviter le traitement multiple
    if (info.draggedEl.dataset.processed === 'true') {
      return;
    }
    info.draggedEl.dataset.processed = 'true';
    setTimeout(() => {
      if (info.draggedEl && info.draggedEl.dataset) {
        delete info.draggedEl.dataset.processed;
      }
    }, 100);

    if (!info.draggedEl.parentNode) return;

    const startDate = info.date || new Date();
    
    // Valider si on peut déposer la tâche
    if (!validateTaskDrop(startDate, info.resource)) {
      if (info.draggedEl) info.draggedEl.style.opacity = '1';
      return;
    }

    // Créer une date de fin exclusive (jour suivant pour FullCalendar)
    const exclusiveEndDate = new Date(startDate.getTime() + 86400000);
    // Créer une date de fin inclusive (même jour que startDate)
    const inclusiveEndDate = new Date(startDate);

    const taskId = info.draggedEl.getAttribute('data-task-id');
    const externalTask = tasks.find(task => task.id.toString() === taskId.toString());

    if (!externalTask) return false;

    const updates = {
      title: externalTask.title,
      description: externalTask.extendedProps?.description || '',
      start: startDate,
      end: exclusiveEndDate,
      resourceId: info.resource?.id ? parseInt(info.resource.id) : null,
      extendedProps: {
        ...externalTask.extendedProps,
        statusId: '2',
        inclusiveEndDate,
        exclusiveEndDate
      },
      statusId: '2'
    };

    // Mettre à jour la tâche avec les nouvelles propriétés
    updateTaskStatus(taskId, updates);

    // Mettre à jour l'affichage
    setTimeout(() => {
      setTasks(prev => prev.map(t => {
        if (t.id.toString() === taskId.toString()) {
          return {
            ...t,
            resourceId: info.resource?.id ? parseInt(info.resource.id) : null,
            start: startDate,
            end: exclusiveEndDate,
            extendedProps: {
              ...t.extendedProps,
              statusId: '2',
              inclusiveEndDate
            }
          };
        }
        return t;
      }));

      if (info.draggedEl) {
        info.draggedEl.style.opacity = '1';
      }
    }, 50);

    await handleTaskUpdate(
      taskId,
      updates,
      {
        successMessage: `Tâche "${externalTask.title}" droppée vers le calendrier`,
        skipApiCall: false
      }
    );

    return true;
  }, [tasks, updateTaskStatus, handleTaskUpdate, setTasks, validateTaskDrop]);

  // Réception d'un événement externe
  const handleEventReceive = useCallback((info) => {
    if (info.event.extendedProps.processed) return;
    
    info.event.setExtendedProp('processed', true);
    info.event.remove();
  }, []);

  return {
    handleExternalTaskClick,
    handleEventDragStop,
    handleExternalDrop,
    handleEventReceive,
    createGhostElement
  };
};