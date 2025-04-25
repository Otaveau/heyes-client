import { useCallback, useRef, useEffect } from 'react';
import { cleanupAllHighlights } from '../utils/DndUtils';
import { CSS_CLASSES, SELECTORS, ANIMATION_DELAYS, GHOST_OFFSET, WIP_STATUS_ID } from '../constants/constants';


/**
 * Hook personnalisé pour gérer les styles et effets visuels du glisser-déposer
 */
export const useDragDropStyleHandlers = (dropZoneRefs, dropZones) => {
  // Références pour les effets visuels
  const ghostElementRef = useRef(null);
  const dropTimeoutRef = useRef(null);
  const ghostMoveHandlerRef = useRef(null); // Stocker le handler localement au lieu de window

  /**
   * Nettoie l'élément fantôme et les événements associés
   */
  const cleanupGhostElement = useCallback(() => {
    try {
      if (ghostElementRef.current) {
        document.body.removeChild(ghostElementRef.current);
        ghostElementRef.current = null;
      }
      
      if (ghostMoveHandlerRef.current) {
        document.removeEventListener('mousemove', ghostMoveHandlerRef.current);
        ghostMoveHandlerRef.current = null;
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage de l\'élément fantôme:', error);
    }
  }, []);

  /**
   * Nettoyage complet du glisser-déposer (fantôme et surlignages)
   */
  const cleanupDragDrop = useCallback(() => {
    cleanupGhostElement();
    cleanupAllHighlights(dropZoneRefs);
  }, [cleanupGhostElement, dropZoneRefs]);

  // Nettoyage au démontage du composant
  useEffect(() => {
    return cleanupDragDrop;
  }, [cleanupDragDrop]);

  // Gérer l'annulation du drag par touche Echap ou clic en dehors
  useEffect(() => {
    const handleDragCancel = () => {
      if (ghostElementRef.current) {
        cleanupDragDrop();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleDragCancel();
    };

    const handleMouseUp = () => {
      setTimeout(() => {
        if (ghostElementRef.current) {
          handleDragCancel();
        }
      }, ANIMATION_DELAYS.MOUSE_UP_CLEANUP);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [cleanupDragDrop]);

  /**
   * Trouve et retourne un élément DOM par sélecteur
   */
  const getElement = useCallback((selector) => {
    return document.querySelector(selector);
  }, []);

  /**
   * Met en surbrillance le TaskBoard
   */
  const highlightTaskBoard = useCallback((isHighlighted) => {
    const taskBoardContainer = getElement(SELECTORS.TASKBOARD_CONTAINER);
    if (!taskBoardContainer) return;

    if (isHighlighted) {
      taskBoardContainer.classList.add(CSS_CLASSES.TASKBOARD_HIGHLIGHT);
    } else {
      taskBoardContainer.classList.remove(CSS_CLASSES.TASKBOARD_HIGHLIGHT);
      taskBoardContainer.classList.remove(CSS_CLASSES.TASKBOARD_HIGHLIGHT_INTENSE);
    }
  }, [getElement]);

  /**
   * Vérifie si une position est à l'intérieur d'un élément
   */
  const isPositionInsideRect = useCallback((position, rect) => {
    return position.x >= rect.left &&
           position.x <= rect.right &&
           position.y >= rect.top &&
           position.y <= rect.bottom;
  }, []);

  /**
   * Met à jour la surbrillance des zones de dépôt pendant le déplacement
   */
  const highlightDropZonesOnDrag = useCallback((event) => {
    if (!ghostElementRef.current) return;

    const mousePosition = { x: event.clientX, y: event.clientY };
    let foundMatch = false;

    if (dropZoneRefs?.current) {
      dropZoneRefs.current.forEach((ref, index) => {
        if (!ref?.current) return;

        // Ignorer le taskboard spécial
        if (dropZones[index]?.statusId === WIP_STATUS_ID) return;
        
        const dropZoneEl = ref.current;
        const rect = dropZoneEl.getBoundingClientRect();

        const isOver = isPositionInsideRect(mousePosition, rect);

        if (isOver) {
          dropZoneEl.classList.add(CSS_CLASSES.DROPZONE_ACTIVE);
          foundMatch = true;
        } else {
          dropZoneEl.classList.remove(CSS_CLASSES.DROPZONE_ACTIVE);
        }
      });
    }

    const taskBoardContainer = getElement(SELECTORS.TASKBOARD_CONTAINER);
    if (taskBoardContainer) {
      if (foundMatch) {
        taskBoardContainer.classList.add(CSS_CLASSES.TASKBOARD_HIGHLIGHT_INTENSE);
      } else {
        taskBoardContainer.classList.remove(CSS_CLASSES.TASKBOARD_HIGHLIGHT_INTENSE);
      }
    }
  }, [dropZoneRefs, dropZones, getElement, isPositionInsideRect]);

  /**
   * Crée et configure un élément HTML pour l'effet fantôme
   */
  const createGhostElementDOM = useCallback((info) => {
    const ghostEl = document.createElement('div');
    ghostEl.className = CSS_CLASSES.GHOST_ELEMENT;

    const originalRect = info.el.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(info.el);

    // Appliquer les styles
    ghostEl.innerHTML = `<div class="ghost-title">${info.event.title}</div>`;
    
    const styles = {
      position: 'fixed',
      zIndex: '9999',
      pointerEvents: 'none',
      width: `${originalRect.width}px`,
      height: `${originalRect.height}px`,
      backgroundColor: '#fcfcfc',
      color: computedStyle.color || 'white',
      borderRadius: computedStyle.borderRadius || '4px',
      padding: computedStyle.padding || '4px',
      opacity: '0.9',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      transition: 'transform 0.05s ease',
      fontFamily: computedStyle.fontFamily,
      fontSize: computedStyle.fontSize,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      left: `${info.jsEvent.clientX + GHOST_OFFSET}px`,
      top: `${info.jsEvent.clientY + GHOST_OFFSET}px`
    };

    // Appliquer tous les styles
    Object.entries(styles).forEach(([property, value]) => {
      ghostEl.style[property] = value;
    });

    return ghostEl;
  }, []);

  /**
   * Crée l'élément fantôme pour le glisser-déposer et configure les événements
   */
  const createGhostElement = useCallback((info) => {
    // Nettoyer l'ancien fantôme s'il existe
    cleanupGhostElement();

    // Créer le nouvel élément fantôme
    const ghostEl = createGhostElementDOM(info);
    
    try {
      document.body.appendChild(ghostEl);
      ghostElementRef.current = ghostEl;
    } catch (error) {
      console.error('Erreur lors de la création du fantôme:', error);
      return () => {};
    }

    // Fonction pour mettre à jour la position du fantôme
    const updateGhostPosition = (e) => {
      if (!ghostElementRef.current) return;

      ghostElementRef.current.style.left = `${e.clientX + GHOST_OFFSET}px`;
      ghostElementRef.current.style.top = `${e.clientY + GHOST_OFFSET}px`;

      highlightDropZonesOnDrag(e);

      ghostElementRef.current.style.transform = 'scale(1.05)';

      clearTimeout(dropTimeoutRef.current);
      dropTimeoutRef.current = setTimeout(() => {
        if (ghostElementRef.current) {
          ghostElementRef.current.style.transform = 'scale(1)';
        }
      }, ANIMATION_DELAYS.SCALE_RESET);
    };

    // Enregistrer et utiliser la fonction
    document.addEventListener('mousemove', updateGhostPosition);
    ghostMoveHandlerRef.current = updateGhostPosition;

    return updateGhostPosition;
  }, [cleanupGhostElement, createGhostElementDOM, highlightDropZonesOnDrag]);

  /**
   * Annule l'animation du fantôme avec une transition douce
   */
  const fadeOutGhostElement = useCallback(() => {
    if (!ghostElementRef.current) return;
    
    ghostElementRef.current.style.transition = 'opacity 0.2s ease';
    ghostElementRef.current.style.opacity = '0';
    
    setTimeout(() => {
      cleanupDragDrop();
    }, ANIMATION_DELAYS.FINAL_CLEANUP);
  }, [cleanupDragDrop]);

  /**
   * Animation de transition vers le TaskBoard
   */
  const simulateImmediateAppearance = useCallback((taskId, targetDropZone) => {
    // Ne pas simuler l'apparition si c'est le taskboard spécial
    if (targetDropZone.statusId === WIP_STATUS_ID) {
      fadeOutGhostElement();
      return;
    }
    
    const dropZoneIndex = dropZones.findIndex(dz => dz.statusId === targetDropZone.statusId);
    const dropZoneRef = dropZoneRefs.current?.[dropZoneIndex];

    if (!dropZoneRef?.current || !ghostElementRef.current) return;

    const dropZoneRect = dropZoneRef.current.getBoundingClientRect();
    const ghostRect = ghostElementRef.current.getBoundingClientRect();

    const ghost = ghostElementRef.current;

    // Position cible centrée dans la zone
    const targetX = dropZoneRect.left + (dropZoneRect.width / 2) - (ghostRect.width / 2);
    const targetY = dropZoneRect.top + 10;

    ghost.style.transition = 'left 0.2s ease, top 0.2s ease, opacity 0.2s ease, transform 0.2s ease';
    ghost.style.left = `${targetX}px`;
    ghost.style.top = `${targetY}px`;
    ghost.style.transform = 'scale(0.9)';

    try {
      // Créer un placeholder temporaire
      const placeholderTask = document.createElement('div');
      placeholderTask.className = CSS_CLASSES.TEMPORARY_PLACEHOLDER;
      placeholderTask.setAttribute('data-task-id', taskId);
      placeholderTask.style.opacity = '0';
      placeholderTask.style.height = `${ghostRect.height}px`;
      placeholderTask.style.margin = '8px 0';
      placeholderTask.style.transition = 'opacity 0.2s ease';
      placeholderTask.innerText = ghostElementRef.current.innerText;

      dropZoneRef.current.appendChild(placeholderTask);

      setTimeout(() => placeholderTask.style.opacity = '1', ANIMATION_DELAYS.PLACEHOLDER_FADE_IN);

      setTimeout(() => {
        ghost.style.opacity = '0';

        setTimeout(() => {
          cleanupGhostElement();

          try {
            if (placeholderTask.parentNode) {
              placeholderTask.parentNode.removeChild(placeholderTask);
            }
          } catch (error) {
            console.error('Erreur lors de la suppression du placeholder:', error);
          }
        }, ANIMATION_DELAYS.FINAL_CLEANUP);
      }, ANIMATION_DELAYS.GHOST_FADE_OUT);
    } catch (error) {
      console.error('Erreur lors de l\'animation du fantôme:', error);
      cleanupDragDrop();
    }
  }, [dropZones, dropZoneRefs, cleanupGhostElement, cleanupDragDrop, fadeOutGhostElement]);

  /**
   * Vérifie si un événement est au-dessus d'une zone de dépôt
   */
  const isEventOverDropZone = useCallback((eventPosition) => {
    if (!dropZoneRefs?.current) return null;

    // Réinitialiser les styles de toutes les zones
    dropZoneRefs.current.forEach(ref => {
      if (ref?.current) ref.current.classList.remove(CSS_CLASSES.ACTIVE_DROP_TARGET);
    });

    // Vérifier chaque zone
    for (let index = 0; index < dropZoneRefs.current.length; index++) {
      const ref = dropZoneRefs.current[index];
      if (!ref?.current) continue;
      
      // Ignorer le taskboard spécial
      if (dropZones[index]?.statusId === WIP_STATUS_ID) {
        continue;
      }

      const dropZoneEl = ref.current;
      const rect = dropZoneEl.getBoundingClientRect();

      if (isPositionInsideRect(eventPosition, rect)) {
        dropZoneEl.classList.add(CSS_CLASSES.ACTIVE_DROP_TARGET);
        return { dropZone: dropZones[index] };
      }
    }

    return null;
  }, [dropZoneRefs, dropZones, isPositionInsideRect]);

  /**
   * Gère le début du glisser-déposer
   */
  const handleEventDragStart = useCallback((info) => {
    highlightTaskBoard(true);
    createGhostElement(info);

    if (info.el) {
      info.el.style.opacity = '0';
    }

    if (dropZoneRefs?.current) {
      dropZoneRefs.current.forEach((ref, index) => {
        if (!ref?.current) return;
        
        // Ne pas ajouter la classe potential-drop-target au taskboard spécial
        if (dropZones[index]?.statusId === WIP_STATUS_ID) {
          ref.current.classList.add(CSS_CLASSES.DROPZONE_DISABLED);
        } else {
          ref.current.classList.add(CSS_CLASSES.POTENTIAL_DROP_TARGET);
        }
      });
    }
  }, [createGhostElement, dropZoneRefs, dropZones, highlightTaskBoard]);

  /**
   * Prépare un événement pour le TaskBoard
   */
  const prepareEventForTaskBoard = useCallback((event, targetDropZone) => {
    return {
      statusId: targetDropZone.statusId,
      ownerId: null,
    };
  }, []);

  return {
    highlightTaskBoard,
    createGhostElement,
    simulateImmediateAppearance,
    isEventOverDropZone,
    handleEventDragStart,
    prepareEventForTaskBoard,
    cleanupDragDrop
  };
};