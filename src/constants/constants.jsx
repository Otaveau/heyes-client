export const API_URL = process.env.REACT_APP_API_URL || '/api';

export const REQUEST_TIMEOUT = 15000; // 15 secondes

export const DEFAULT_COLOR = '#9CA3AF';

export const TEAM_BACKGROUND_ALPHA = '10';

export const ONE_DAY_MS = 86400000; /// 10% d'opacité

export const VIEW_TYPES = {
  WEEK: 'resourceTimelineWeek',
  MONTH: 'resourceTimelineMonth',
  YEAR: 'resourceTimelineYear'
};

export const ANIMATION_DELAY = 50;

export const DAYS_IN_WEEK = 7;

export const TOAST_CONFIG = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
};

// Messages d'erreur
export const ERROR_MESSAGES = {
  INVALID_DATE: 'Date invalide',
  INVALID_START_END_DATE: 'Dates invalides (week-end ou jour férié)',
  INVALID_TASK: 'Tâche invalide',
  TITLE_REQUIRED: 'Le titre est requis',
  SAVE_ERROR: 'Erreur lors de la sauvegarde',
  UPDATE_ERROR: 'Erreur lors de la mise à jour',
  DROP_ERROR: 'Erreur lors du déplacement',
  RESIZE_ERROR: 'Erreur lors du redimensionnement'
};

// Styles pour les événements de congés
export const CONGE_EVENT_STYLE = `
  position: relative;
  height: 100%;
  padding: 3px 6px; 
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  overflow: visible;
  text-overflow: ellipsis; 
  white-space: nowrap;
  background: repeating-linear-gradient(
    45deg,
    #e5e7eb,
    #e5e7eb 4px,
    #f3f4f6 4px,
    #f3f4f6 8px
  );
  border-left: 3px solid #9ca3af;
  color: #4b5563;
  font-weight: 600;
`;

// Constantes pour les identifiants et configurations
export const WIP_STATUS_ID = '2'; // Status ID qui ne doit pas être ciblé par le drag and drop
export const GHOST_OFFSET = 15; // Décalage du fantôme par rapport au curseur
export const ANIMATION_DELAYS = {
  SCALE_RESET: 50,
  MOUSE_UP_CLEANUP: 100,
  PLACEHOLDER_FADE_IN: 50,
  GHOST_FADE_OUT: 180,
  FINAL_CLEANUP: 200
};

// Sélecteurs CSS
export const SELECTORS = {
  TASKBOARD_CONTAINER: '.taskboard-container',
};

// Classes CSS
export const CSS_CLASSES = {
  TASKBOARD_HIGHLIGHT: 'taskboard-highlight',
  TASKBOARD_HIGHLIGHT_INTENSE: 'taskboard-highlight-intense',
  DROPZONE_ACTIVE: 'dropzone-active',
  DROPZONE_DISABLED: 'dropzone-disabled',
  POTENTIAL_DROP_TARGET: 'potential-drop-target',
  ACTIVE_DROP_TARGET: 'active-drop-target',
  GHOST_ELEMENT: 'task-ghost-element',
  TEMPORARY_PLACEHOLDER: 'fc-event temporary-task-placeholder'
};