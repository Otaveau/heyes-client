/**
 * Utilitaires pour la gestion des interactions drag-and-drop
 * Ce module gère les interactions sans injecter de styles CSS
 */

// Fonction pour gérer l'effet d'apparition de la tâche
export const addTaskAppearEffect = (taskElement) => {
  if (!taskElement) return;

  // Ajouter la classe pour l'animation
  taskElement.classList.add('task-newly-added');

  // Supprimer la classe après l'animation pour éviter les problèmes de style
  setTimeout(() => {
    taskElement.classList.remove('task-newly-added');
  }, 800); // Légèrement plus long que la durée de l'animation
};

// Fonction pour gérer l'effet de pulsation sur la zone de drop
export const addDropzonePulseEffect = (zoneElement, isActive) => {
  if (!zoneElement) return;

  if (isActive) {
    zoneElement.classList.add('dropzone-active', 'dropzone-pulse');
  } else {
    zoneElement.classList.remove('dropzone-active', 'dropzone-pulse');
  }
};

/**
 * Met en surbrillance le tableau de tâches (TaskBoard)
 * Utilise les classes CSS définies dans le fichier CSS principal
 */
export const highlightTaskBoard = (isHighlighted) => {
  const taskBoardContainer = document.querySelector('.taskboard-container');
  if (taskBoardContainer) {
    if (isHighlighted) {
      taskBoardContainer.classList.add('taskboard-highlight');
    } else {
      taskBoardContainer.classList.remove('taskboard-highlight');
      taskBoardContainer.classList.remove('taskboard-highlight-intense');
    }
  }
};

/**
 * Met en surbrillance intense le tableau de tâches
 */
export const intensifyTaskBoardHighlight = (isIntense) => {
  const taskBoardContainer = document.querySelector('.taskboard-container');
  if (taskBoardContainer) {
    if (isIntense) {
      taskBoardContainer.classList.add('taskboard-highlight-intense');
    } else {
      taskBoardContainer.classList.remove('taskboard-highlight-intense');
    }
  }
};

/**
 * Nettoie toutes les surbrillances du TaskBoard et des zones de dépôt
 */
export const cleanupAllHighlights = (dropZoneRefs) => {
  const taskBoardContainer = document.querySelector('.taskboard-container');
  if (taskBoardContainer) {
    taskBoardContainer.classList.remove('taskboard-highlight');
    taskBoardContainer.classList.remove('taskboard-highlight-intense');
  }
  
  if (dropZoneRefs?.current) {
    dropZoneRefs.current.forEach(ref => {
      if (ref?.current) {
        ref.current.classList.remove('dropzone-active');
        ref.current.classList.remove('potential-drop-target');
      }
    });
  }
};

/**
 * Active/désactive l'état de zone de dépôt active
 */
export const setDropzoneActive = (element, isActive) => {
  if (!element) return;
  
  if (isActive) {
    element.classList.add('dropzone-active');
  } else {
    element.classList.remove('dropzone-active');
  }
};

/**
 * Ajoute l'animation "tâche ajoutée" à un élément
 */
export const addTaskAddedAnimation = (element) => {
  if (!element) return;
  
  element.classList.add('task-added');
  
  // Supprimer la classe après la fin de l'animation
  setTimeout(() => {
    element.classList.remove('task-added');
  }, 500); // Correspond à la durée de l'animation CSS
};

/**
 * Marque un élément comme "ghost" pendant le drag
 */
export const setTaskGhostElement = (element, isGhost) => {
  if (!element) return;
  
  if (isGhost) {
    element.classList.add('task-ghost-element');
  } else {
    element.classList.remove('task-ghost-element');
  }
};