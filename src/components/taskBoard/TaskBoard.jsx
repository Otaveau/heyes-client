import React, { useState, useRef, useEffect } from 'react';
import { Draggable } from '@fullcalendar/interaction';
import { useTheme } from '../../context/ThemeContext';
import { TaskBoardHeader } from './TaskBoardHeader';
import { TaskBoardZone } from './TaskBoardZone';
import { DeleteTaskModal } from './DeleteTaskModal';
import { addDropzonePulseEffect } from '../../utils/DndUtils';

export const TaskBoard = ({
  dropZones = [],
  dropZoneRefs,
  externalTasks = [],
  handleExternalTaskClick,
  onDeleteTask,
  resources = [],
  onMoveTask,
  onCreateTask
}) => {
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    taskToDelete: null
  });
  const draggablesRef = useRef([]);
  const [activeDropZone, setActiveDropZone] = useState(null);
  const internalRefs = useRef([]);
  
  // Utiliser les références externes si disponibles, sinon utiliser les références internes
  const effectiveRefs = dropZoneRefs || internalRefs;
  
  useTheme();

  // Initialiser les références internes si nécessaire
  useEffect(() => {
    if (!dropZones?.length) return;
    
    // Redimensionner le tableau de références si nécessaire
    if (internalRefs.current.length !== dropZones.length) {
      internalRefs.current = Array(dropZones.length)
        .fill(null)
        .map((_, i) => internalRefs.current[i] || React.createRef());
    }
  }, [dropZones]);

  // Gestion de la modal de suppression
  const openDeleteModal = (e, task) => {
    e.stopPropagation();
    setDeleteModalState({ isOpen: true, taskToDelete: task });
  };

  const closeDeleteModal = () => {
    setDeleteModalState({ isOpen: false, taskToDelete: null });
  };

  const confirmDelete = () => {
    const { taskToDelete } = deleteModalState;
    if (taskToDelete && onDeleteTask) {
      onDeleteTask(taskToDelete.id);
    }
    closeDeleteModal();
  };

  // Fonction unifiée pour déplacer une tâche
  const moveTask = (direction, e, task) => {
    e.stopPropagation();

    const statusId = task.extendedProps?.statusId || task.statusId;
    const currentZoneIndex = dropZones.findIndex(zone => zone.statusId === statusId);
    const targetIndex = direction === 'left' ? currentZoneIndex - 1 : currentZoneIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < dropZones.length && onMoveTask) {
      onMoveTask(task.id, dropZones[targetIndex].statusId);
    }
  };

  const moveTaskLeft = (e, task) => moveTask('left', e, task);
  const moveTaskRight = (e, task) => moveTask('right', e, task);

  // Obtenir le nom d'une ressource à partir de son ID
  const getResourceName = (resourceId) => {
    if (!resourceId) return 'Non assigné';
    const resource = resources.find(r => r.id.toString() === resourceId.toString());
    return resource ? resource.title : `ID: ${resourceId}`;
  };

  // Initialisation des draggables FullCalendar
  useEffect(() => {
    if (!dropZones?.length || !effectiveRefs.current?.length) return;

    // Vérifier la validité des références
    if (!effectiveRefs.current.every(ref => ref?.current)) return;

    // Nettoyage des anciens draggables et styles
    draggablesRef.current.forEach(draggable => draggable?.destroy());
    effectiveRefs.current.forEach(ref => {
      if (ref?.current) {
        // Nettoyer les classes
        ref.current.classList.remove('potential-drop-target', 'dropzone-active', 'dropzone-pulse', 'highlight-dropzone');
        ref.current.removeAttribute('data-highlight');
      }
    });
    draggablesRef.current = [];

    // Création des nouveaux draggables
    effectiveRefs.current.forEach((ref, index) => {
      if (index >= dropZones.length) return;
      
      const zone = dropZones[index];
      if (zone?.statusId === '2') return; // Ne pas créer de draggable pour "En cours"

      try {
        const draggable = new Draggable(ref.current, {
          itemSelector: '.fc-event',
          eventData: (eventEl) => {
            if (eventEl.getAttribute('data-is-conge') === 'true') return null;
            
            const taskId = eventEl.getAttribute('data-task-id');
            const task = externalTasks.find(t => t.id.toString() === taskId.toString());
            if (!task) return {};

            return {
              id: task.id,
              title: task.title,
              start: task.start || new Date(),
              end: task.end || new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
              allDay: true,
              extendedProps: {
                statusId: task.extendedProps?.statusId || task.statusId,
                description: task.extendedProps?.description || ''
              }
            };
          },
          dragStart: () => {
            // Activer les effets visuels sur toutes les zones de drop potentielles
            effectiveRefs.current.forEach((dropRef, i) => {
              if (dropRef?.current && i !== index) {
                dropRef.current.classList.add('potential-drop-target');
              }
            });
          },
          dragEnd: () => {
            // Désactiver les effets visuels
            effectiveRefs.current.forEach((dropRef) => {
              if (dropRef?.current) {
                dropRef.current.classList.remove('potential-drop-target', 'dropzone-active', 'dropzone-pulse', 'highlight-dropzone');
                dropRef.current.removeAttribute('data-highlight');
              }
            });
            setActiveDropZone(null);
          }
        });

        draggablesRef.current[index] = draggable;
      } catch (error) {
        console.error(`Erreur lors de la création du draggable pour la zone ${index}:`, error);
      }
    });

    // Configuration des effets de drag
    effectiveRefs.current.forEach((ref, index) => {
      if (!ref?.current) return;
      const element = ref.current;

      // Événements de drag over/enter/leave pour les effets visuels
      element.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (activeDropZone !== index) {
          setActiveDropZone(index);
          addDropzonePulseEffect(element, true);
          
          // Utiliser un attribut data pour le ciblage CSS
          element.setAttribute('data-highlight', 'true');
          element.classList.add('highlight-dropzone'); // Utiliser une classe existante ou définie dans vos CSS
        }
      });

      element.addEventListener('dragleave', () => {
        addDropzonePulseEffect(element, false);
        setActiveDropZone(null);
        
        // Supprimer l'attribut et la classe
        element.removeAttribute('data-highlight');
        element.classList.remove('highlight-dropzone');
      });

      element.addEventListener('drop', (e) => {
        e.preventDefault();
        addDropzonePulseEffect(element, false);
        setActiveDropZone(null);
        
        // Supprimer l'attribut et la classe
        element.removeAttribute('data-highlight');
        element.classList.remove('highlight-dropzone');
      });
    });

    return () => {
      // Nettoyage lors du démontage
      draggablesRef.current.forEach(draggable => draggable?.destroy());
    };
  }, [effectiveRefs, externalTasks, dropZones, dropZoneRefs, activeDropZone]);

  // Construction des tâches groupées par colonne
  const tasksByZone = dropZones.map(zone => {
    const zoneTasks = externalTasks.filter(task => {
      // Extraction du statusId
      const getStatusId = () => {
        return task.statusId?.toString() || 
               task.extendedProps?.statusId?.toString() || 
               task.status?.toString() || 
               null;
      };

      const isConge = task.isConge === true || 
                     task.extendedProps?.isConge === true || 
                     task.title === 'CONGE';

      return !isConge && getStatusId() === zone.statusId;
    });

    return { zone, tasks: zoneTasks };
  });

  return (
    <>
      <div className="taskboard-container-wrapper mr-[15px]">
        <TaskBoardHeader onCreateTask={onCreateTask} />

        <div className="flex w-full space-x-4 backlogs taskboard-container">
          {tasksByZone.map(({ zone, tasks }, index) => {
            // S'assurer que les refs sont initialisées
            if (!effectiveRefs.current[index]) {
              effectiveRefs.current[index] = React.createRef();
            }

            return (
              <TaskBoardZone
                key={zone.id || `zone-${index}`}
                zone={zone}
                tasks={tasks}
                index={index}
                totalZones={dropZones.length}
                reference={effectiveRefs.current[index]}
                openDeleteModal={openDeleteModal}
                moveTaskLeft={moveTaskLeft}
                moveTaskRight={moveTaskRight}
                handleTaskClick={handleExternalTaskClick}
                getResourceName={getResourceName}
              />
            );
          })}
        </div>
      </div>

      <DeleteTaskModal
        isOpen={deleteModalState.isOpen}
        task={deleteModalState.taskToDelete}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </>
  );
};